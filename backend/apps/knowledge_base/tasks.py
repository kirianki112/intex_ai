import os
import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from .models import KnowledgeDocument, DocumentChunk
from .extractors import extract_text_from_pdf, extract_text_from_docx, extract_text_from_doc, extract_text_from_txt, extract_text_from_excel
from .chunker import chunk_text, count_tokens
from .openai_client import embed_texts

logger = logging.getLogger(__name__)

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def ingest_document(self, document_id):
    """
    Ingest a document by:
    1. Extracting text based on file type
    2. Chunking the text
    3. Generating embeddings
    4. Storing chunks in the database
    """
    try:
        doc = KnowledgeDocument.objects.get(id=document_id)
    except KnowledgeDocument.DoesNotExist:
        logger.error(f"Document {document_id} not found")
        return

    # Check if document is already processed
    if doc.status == "ready":
        logger.info(f"Document {document_id} already processed, skipping")
        return

    # Set status to processing
    if doc.status != "processing":
        doc.status = "processing"
        doc.save(update_fields=["status"])

    # Validate file path
    file_path = doc.file.path
    if not os.path.exists(file_path):
        error_msg = f"File not found: {file_path}"
        logger.error(error_msg)
        doc.status = "failed"
        doc.error_message = error_msg
        doc.save(update_fields=["status", "error_message"])
        return

    ext = os.path.splitext(file_path)[1].lower()
    supported_extensions = {".pdf", ".docx", ".doc", ".txt", ".md", ".rtf", ".xls", ".xlsx", ".csv"}
    if ext not in supported_extensions:
        error_msg = f"Unsupported file extension: {ext}"
        logger.error(error_msg)
        doc.status = "failed"
        doc.error_message = error_msg
        doc.save(update_fields=["status", "error_message"])
        return

    try:
        # Extract text based on file extension
        if ext in [".pdf"]:
            text, pages = extract_text_from_pdf(file_path)
            logger.info(f"Extracted {pages} pages from PDF: {file_path}")
        elif ext in [".docx"]:
            text, pages = extract_text_from_docx(file_path)
            logger.info(f"Extracted text from DOCX: {file_path}")
        elif ext in [".doc"]:
            text, pages = extract_text_from_doc(file_path)
            logger.info(f"Extracted text from DOC: {file_path}")
        elif ext in [".txt", ".md", ".rtf"]:
            text, pages = extract_text_from_txt(file_path)
            logger.info(f"Extracted text from TXT/MD/RTF: {file_path}")
        elif ext in [".xls", ".xlsx", ".csv"]:
            text, pages = extract_text_from_excel(file_path)
            logger.info(f"Extracted {pages} rows from Excel/CSV: {file_path}")

        doc.pages = pages
        doc.save(update_fields=["pages"])

        # Chunk the text
        chunk_tokens = getattr(settings, "KB_CHUNK_TOKENS", 900)
        overlap = getattr(settings, "KB_CHUNK_OVERLAP", 150)
        chunks = chunk_text(text, chunk_size=chunk_tokens, overlap=overlap)

        if not chunks:
            error_msg = "No text content could be extracted from the document"
            raise ValueError(error_msg)

        # Embed chunks in batches
        batch_size = getattr(settings, "KB_EMBEDDING_BATCH_SIZE", 64)
        embeddings = embed_texts(chunks, batch_size=batch_size)

        # Prepare DocumentChunk objects
        objs = []
        for idx, (chunk_text_, emb) in enumerate(zip(chunks, embeddings)):
            tok_count = count_tokens(chunk_text_)
            objs.append(DocumentChunk(
                document=doc,
                chunk_index=idx,
                text=chunk_text_,
                embedding=emb,
                tokens=tok_count
            ))

        # Use atomic transaction to ensure consistency
        with transaction.atomic():
            # Delete existing chunks for reprocessing
            existing_chunks = DocumentChunk.objects.filter(document=doc)
            if existing_chunks.exists():
                logger.info(f"Deleting {existing_chunks.count()} existing chunks for document {document_id}")
                existing_chunks.delete()

            # Create new chunks
            DocumentChunk.objects.bulk_create(objs, batch_size=200)

            # Update document status
            doc.status = "ready"
            doc.processed_at = timezone.now()
            doc.error_message = ""
            doc.save(update_fields=["status", "processed_at", "error_message"])

        logger.info(f"Successfully processed document {document_id} with {len(objs)} chunks")

    except Exception as e:
        logger.exception(f"Failed to ingest document {document_id}: {str(e)}")
        doc.status = "failed"
        doc.error_message = str(e)
        doc.save(update_fields=["status", "error_message"])
        raise

@shared_task
def cleanup_failed_documents():
    """
    Cleanup task to reset documents stuck in processing state for over 30 minutes.
    """
    from datetime import timedelta

    cutoff_time = timezone.now() - timedelta(minutes=30)
    stuck_docs = KnowledgeDocument.objects.filter(
        status="processing",
        updated_at__lt=cutoff_time
    )

    count = stuck_docs.count()
    if count > 0:
        stuck_docs.update(
            status="failed",
            error_message="Processing timeout - document was stuck in processing state"
        )
        logger.info(f"Reset {count} stuck documents to failed status")
    
    return count