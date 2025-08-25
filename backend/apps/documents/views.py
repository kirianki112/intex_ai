# --- START OF FILE views.py ---

import re # <--- Add this import at the top of your file
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import DocumentTemplate, Document, DocumentSection, DocumentSectionVersion, DocumentExport, Citation
from .serializers import (
    DocumentTemplateSerializer, DocumentSerializer, DocumentSectionSerializer,
    SectionEditSerializer, DocumentExportSerializer, CitationSerializer
)
from .tasks import ai_generate_section, export_document_task, upload_document_to_kb, ai_generate_document
from .permissions import IsDocumentOwnerOrReviewer

# ... (TemplateViewSet, DocumentViewSet, SectionViewSet remain unchanged) ...

class TemplateViewSet(viewsets.ModelViewSet):
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsDocumentOwnerOrReviewer]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return super().get_queryset()
        return Document.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        meta = serializer.validated_data.get('meta', {})
        prompt = self.request.data.get('prompt')
        if prompt:
            meta['user_prompt'] = prompt
            serializer.validated_data['meta'] = meta
        serializer.save(created_by=self.request.user, organization=self.request.user.organization)

    @action(detail=True, methods=["post"])
    def generate_all(self, request, pk=None):
        doc = self.get_object()
        prompt = request.data.get('prompt') or doc.meta.get('user_prompt')
        if not doc.sections.exists():
            return Response({"detail": "No sections found for this document"}, status=status.HTTP_400_BAD_REQUEST)
        ai_generate_document.delay(str(doc.id), user_prompt=prompt)
        return Response({"detail": "Full document generation started"}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=["post"])
    def export(self, request, pk=None):
        doc = self.get_object()
        fmt = request.data.get("format", "docx")
        options = request.data.get("options", {})
        if fmt not in dict(DocumentExport.FORMAT_CHOICES):
            return Response({"detail": "Invalid format"}, status=400)
        exp = DocumentExport.objects.create(document=doc, requested_by=request.user, format=fmt, options=options)
        export_document_task.delay(str(exp.id))
        return Response(DocumentExportSerializer(exp).data, status=202)

    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        doc = self.get_object()
        success = request.data.get("success", None)
        with transaction.atomic():
            doc.status = "final"
            doc.finalized_at = timezone.now()
            if success is not None:
                doc.success = bool(success)
            doc.save(update_fields=["status", "finalized_at", "success"])
        upload_document_to_kb.delay(str(doc.id), success=doc.success)
        return Response({"detail": "Finalized and KB upload queued"}, status=202)

class SectionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsDocumentOwnerOrReviewer]

    def list(self, request):
        """Retrieve all sections for a specific document."""
        document_id = request.query_params.get('document')
        if not document_id:
            return Response({"detail": "Document ID required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            sections = DocumentSection.objects.filter(document_id=document_id).order_by('order')
            if not sections.exists():
                return Response({"detail": "No sections found for this document"}, status=status.HTTP_404_NOT_FOUND)
            serializer = DocumentSectionSerializer(sections, many=True)
            return Response(serializer.data)
        except DocumentSection.DoesNotExist:
            return Response({"detail": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    def retrieve(self, request, pk=None):
        sec = get_object_or_404(DocumentSection, id=pk)
        return Response(DocumentSectionSerializer(sec).data)

    @action(detail=True, methods=["post"])
    def edit(self, request, pk=None):
        sec = get_object_or_404(DocumentSection, id=pk)
        serializer = SectionEditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        content = serializer.validated_data["content"]
        ai_generated = serializer.validated_data.get("ai_generated", False)
        summary = serializer.validated_data.get("summary", "")
        v = DocumentSectionVersion.objects.create(
            section=sec, content=content, created_by=request.user, ai_generated=ai_generated, summary=summary
        )
        sec.current_version = v
        sec.save(update_fields=["current_version"])
        return Response({"detail": "Updated", "version": str(v.id)})

    @action(detail=True, methods=["post"])
    def ai_generate(self, request, pk=None):
        sec = get_object_or_404(DocumentSection, id=pk)
        prompt = request.data.get("prompt") or sec.document.meta.get("user_prompt")
        ai_generate_section.delay(str(sec.id), user_prompt=prompt)
        return Response({"detail": "AI generation queued"}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=["post"])
    def undo(self, request, pk=None):
        sec = get_object_or_404(DocumentSection, id=pk)
        versions = sec.versions.order_by("-created_at")
        if versions.count() < 2:
            return Response({"detail": "No previous version"}, status=status.HTTP_400_BAD_REQUEST)
        prev = versions[1]
        sec.current_version = prev
        sec.save(update_fields=["current_version"])
        return Response({"detail": "Reverted", "version": str(prev.id)})


class CitationViewSet(viewsets.ModelViewSet):
    queryset = Citation.objects.all()
    serializer_class = CitationSerializer
    permission_classes = [IsAuthenticated, IsDocumentOwnerOrReviewer]

    def get_queryset(self):
        """
        Optionally restricts the returned citations to a given document,
        by filtering against a `document` query parameter in the URL.
        Also optimizes the query by pre-fetching related objects.
        """
        queryset = super().get_queryset().select_related(
            'section__document', 
            'kb_document'  # <-- OPTIMIZATION: pre-fetch kb_document
        )

        user = self.request.user
        if not user.is_superuser:
            queryset = queryset.filter(section__document__organization=user.organization)
        
        document_id = self.request.query_params.get('document')
        if document_id:
            queryset = queryset.filter(section__document_id=document_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        """
        Overrides the default list action to return a grouped structure.
        Instead of a flat list of citations, it returns a list of unique
        documents, each containing the chunks cited from it.
        """
        queryset = self.get_queryset()
        grouped_documents = {}
        
        # Regex to parse the chunk index from the reference_text
        parser_regex = re.compile(r"\(Chunk (\d+)\)")

        for citation in queryset:
            # Skip citations not linked to a KB document
            if not citation.kb_document:
                continue

            kb_doc_id = str(citation.kb_document.id)

            if kb_doc_id not in grouped_documents:
                grouped_documents[kb_doc_id] = {
                    "kb_document_id": kb_doc_id,
                    "document_title": citation.kb_document.title,
                    "chunks_used": []
                }
            
            # Extract chunk index from reference text
            chunk_index = -1
            match = parser_regex.search(citation.reference_text or "")
            if match:
                chunk_index = int(match.group(1))

            chunk_info = {
                "chunk_index": chunk_index,
                "marker": citation.marker,
                "section_id": str(citation.section_id),
                "confidence_score": citation.confidence_score,
                "citation_id": str(citation.id)
            }
            
            grouped_documents[kb_doc_id]["chunks_used"].append(chunk_info)

        # Convert the dictionary of documents into a final list
        structured_list = list(grouped_documents.values())
        
        # De-duplicate and sort chunks within each document
        for doc in structured_list:
            unique_chunks = {
                f'{chunk["chunk_index"]}-{chunk["section_id"]}': chunk
                for chunk in doc["chunks_used"]
            }
            doc["chunks_used"] = sorted(
                unique_chunks.values(),
                key=lambda c: (c["section_id"], c["chunk_index"])
            )
            
        # Sort final list by document title
        structured_list.sort(key=lambda doc: doc["document_title"])

        return Response(structured_list)