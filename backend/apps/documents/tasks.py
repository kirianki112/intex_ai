import logging
import difflib
import re
from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction, connection
from django.utils import timezone
from .models import DocumentSection, DocumentSectionVersion, Citation, Document, DocumentExport
from .services.exporters.docx_exporter import export_document_to_docx
from .services.exporters.pdf_exporter import export_document_to_pdf
from .services.exporters.excel_exporter import export_document_to_excel
from .openai_client import generate_draft, refine_document
from apps.knowledge_base.openai_client import embed_texts
from apps.knowledge_base.models import KnowledgeDocument, DocumentChunk
from apps.knowledge_base.chunker import chunk_text, count_tokens

logger = logging.getLogger(__name__)

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def ai_generate_section(self, section_id, system_prompt=None, user_prompt=None, top_k=6):
    """Regenerate a single section, optionally aware of the rest of the document."""
    logger.info(f"Starting ai_generate_section task for section_id: {section_id}, user_prompt: {user_prompt}")
    try:
        sec = DocumentSection.objects.select_related("document").get(id=section_id)
        doc = sec.document

        # Build base system prompt
        system_prompt = system_prompt or settings.DOC_SYSTEM_PROMPT

        # Gather context from other sections (to avoid disjointed edits)
        other_sections_context = "\n\n".join(
            f"## {s.title}\n{s.current_version.content}"
            for s in doc.sections.exclude(id=sec.id)
            if s.current_version
        )

        # Build final prompt
        prompt = (
            f"{system_prompt}\n\n"
            f"Document title: {doc.title}\n"
            f"Existing content from other sections:\n{other_sections_context}\n\n"
            f"Now regenerate the section '{sec.title}'. "
            f"{user_prompt or 'Draft content for this section.'}\n"
            "Ensure markdown formatting for tables if specified in template."
        )
        logger.debug(f"Prompt for section {sec.id}: {prompt}")

        # Embed query
        q_emb = embed_texts([prompt])[0]

        # Vector search in KB
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT dc.id, dc.document_id, dc.chunk_index, dc.text, kd.title,
                       dc.embedding <=> %s::vector as score
                FROM knowledge_base_documentchunk dc
                JOIN knowledge_base_knowledgedocument kd ON dc.document_id = kd.id
                WHERE kd.organization_id = %s AND kd.is_active = true
                ORDER BY score ASC
                LIMIT %s
                """,
                [q_emb, doc.organization.id if doc.organization else None, top_k]
            )
            rows = cur.fetchall()

        kb_chunks = [
            {"id": str(r[0]), "document_id": str(r[1]), "chunk_index": r[2],
             "text": r[3], "title": r[4], "score": float(r[5])}
            for r in rows
        ]

        # AI generation
        result = generate_draft(prompt, template=sec.title, kb_chunks=kb_chunks)
        content, citations = result["content"], result["citations"]

        with transaction.atomic():
            v = DocumentSectionVersion.objects.create(
                section=sec, content=content,
                created_by=doc.created_by, ai_generated=True
            )
            sec.current_version = v
            sec.save(update_fields=["current_version"])

            for cit in citations:
                Citation.objects.create(
                    section=sec, marker=cit["marker"], reference_text=cit["reference_text"],
                    kb_document_id=cit.get("kb_document_id"), confidence_score=cit.get("confidence_score")
                )

        logger.info(f"Completed ai_generate_section for section_id: {section_id}")
        return {"section_id": str(sec.id), "version_id": str(v.id)}
    except Exception as e:
        logger.error(f"Error in ai_generate_section for section_id: {section_id}: {str(e)}", exc_info=True)
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def ai_generate_document(self, document_id, user_prompt=None, top_k=8):
    """Generate document sequentially: each section in order, with context from prior sections."""
    logger.info(f"Starting ai_generate_document (sequential) for document_id: {document_id}")
    try:
        doc = Document.objects.prefetch_related("sections").get(id=document_id)
        template = doc.template
        if not template:
            raise ValueError("Document has no template")

        prior_sections_text = ""  # will accumulate generated content

        with transaction.atomic():
            for sec in doc.sections.order_by("order"):
                # Build prompt with context
                prompt = (
                    f"You are drafting '{doc.title}'.\n\n"
                    f"Previously written sections:\n{prior_sections_text or 'None yet'}\n\n"
                    f"Now generate the next section: '{sec.title}'.\n"
                    f"Follow template requirements, preserve markdown tables, "
                    f"use inline citations [1], [2].\n\n"
                    f"{user_prompt or ''}"
                )

                # Embed + retrieve KB
                q_emb = embed_texts([prompt])[0]
                with connection.cursor() as cur:
                    cur.execute(
                        """
                        SELECT dc.id, dc.document_id, dc.chunk_index, dc.text, kd.title,
                               dc.embedding <=> %s::vector as score
                        FROM knowledge_base_documentchunk dc
                        JOIN knowledge_base_knowledgedocument kd ON dc.document_id = kd.id
                        WHERE kd.organization_id = %s AND kd.is_active = true
                        ORDER BY score ASC
                        LIMIT %s
                        """,
                        [q_emb, doc.organization.id if doc.organization else None, top_k]
                    )
                    rows = cur.fetchall()

                kb_chunks = [
                    {"id": str(r[0]), "document_id": str(r[1]), "chunk_index": r[2],
                     "text": r[3], "title": r[4], "score": float(r[5])}
                    for r in rows
                ]

                # Generate content for this section
                result = generate_draft(prompt, template=sec.title, kb_chunks=kb_chunks)
                content, citations = result["content"], result["citations"]

                # Save section version
                v = DocumentSectionVersion.objects.create(
                    section=sec, content=content,
                    created_by=doc.created_by, ai_generated=True
                )
                sec.current_version = v
                sec.save(update_fields=["current_version"])

                # Save citations
                for cit in citations:
                    Citation.objects.create(
                        section=sec, marker=cit["marker"], reference_text=cit["reference_text"],
                        kb_document_id=cit.get("kb_document_id"), confidence_score=cit.get("confidence_score")
                    )

                # Add to rolling context
                prior_sections_text += f"\n\n## {sec.title}\n{content}"

        logger.info(f"Completed ai_generate_document (sequential) for document_id: {document_id}")
        return {"document_id": str(doc.id)}

    except Exception as e:
        logger.error(f"Error in ai_generate_document (sequential) for {document_id}: {str(e)}", exc_info=True)
        raise

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def export_document_task(self, export_id):
    """Export document to specified format asynchronously."""
    logger.info(f"Starting export_document_task for export_id: {export_id}")
    
    # Fetch the export object first to make the exception handling block safer
    # and prevent NameError if the .get() fails.
    exp = DocumentExport.objects.get(id=export_id)
    
    try:
        doc = exp.document
        
        # 🎯 Map format names to proper file extensions
        format_extensions = {
            "docx": "docx",
            "pdf": "pdf", 
            "excel": "xlsx"  # 🔧 FIX: Map "excel" format to "xlsx" extension
        }
        
        if exp.format == "docx":
            bio = export_document_to_docx(doc)
        elif exp.format == "pdf":
            bio = export_document_to_pdf(doc)
        elif exp.format == "excel":
            bio = export_document_to_excel(doc)
        else:
            raise ValueError(f"Unsupported format: {exp.format}")
        
        # 🎯 Use the correct file extension
        file_extension = format_extensions[exp.format]
        filename = f"{doc.title}_{exp.format}.{file_extension}"
        
        exp.file.save(filename, ContentFile(bio.read()))
        exp.status = "completed"
        # The 'file' field must be included to persist the saved file path.
        exp.save(update_fields=["status", "file"])
        logger.info(f"Completed export_document_task for export_id: {export_id}")
        return {"export_id": str(exp.id)}
    except Exception as e:
        logger.error(f"Error in export_document_task for export_id: {export_id}: {str(e)}", exc_info=True)
        exp.status = "failed"
        exp.save(update_fields=["status"])
        raise

@shared_task(bind=True)
def upload_document_to_kb(self, document_id, success=None):
    logger.info(f"Starting upload_document_to_kb for document_id: {document_id}")
    try:
        doc = Document.objects.get(id=document_id)
        combined = "\n\n".join([f"{sec.title}\n\n{sec.get_content()}" for sec in doc.sections.order_by("order") if sec.get_content()])
        chunk_tokens = settings.KB_CHUNK_TOKENS or 900
        overlap = settings.KB_CHUNK_OVERLAP or 150
        chunks = chunk_text(combined, chunk_size=chunk_tokens, overlap=overlap)
        if not chunks:
            logger.warning(f"No chunks generated for document_id: {document_id}")
            return {"status": "no_chunks"}

        kb_doc = KnowledgeDocument.objects.create(
            organization=doc.organization,
            uploaded_by=doc.created_by,
            title=doc.title,
            file_name=f"document-{doc.id}.txt",
            mime_type="text/plain",
            size_bytes=len(combined.encode("utf-8")),
            status="processing",
        )

        embeddings = embed_texts(chunks, batch_size=64)
        objs = [
            DocumentChunk(
                document=kb_doc,
                chunk_index=idx,
                text=chunk_text,
                embedding=emb,
                tokens=count_tokens(chunk_text)
            ) for idx, (chunk_text, emb) in enumerate(zip(chunks, embeddings))
        ]
        DocumentChunk.objects.bulk_create(objs, batch_size=200)
        kb_doc.status = "ready"
        kb_doc.processed_at = timezone.now()
        kb_doc.save(update_fields=["status", "processed_at"])
        if success is not None:
            kb_doc.additional_metadata = {"success": success}
            kb_doc.save(update_fields=["additional_metadata"])
        logger.info(f"Completed upload_document_to_kb for document_id: {document_id}, kb_doc_id: {kb_doc.id}")
        return {"kb_doc_id": str(kb_doc.id)}
    except Exception as e:
        logger.error(f"Error in upload_document_to_kb for document_id: {document_id}: {str(e)}", exc_info=True)
        raises