import os
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import KnowledgeDocument, DocumentChunk, ChatSession, ChatMessage
from .serializers import (
    UploadDocumentSerializer, DocumentDetailSerializer,
    ChunkSerializer, SearchHitSerializer, ChatSessionSerializer, ChatMessageSerializer
)
from .permissions import CanUploadDocument, CanManageDocument
from .tasks import ingest_document
from .openai_client import embed_texts, chat_with_context
from .chunker import count_tokens
from apps.accounts.permissions import IsSameOrganization

# Upload / list documents
class DocumentViewSet(mixins.CreateModelMixin,
                      mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    serializer_class = UploadDocumentSerializer
    queryset = KnowledgeDocument.objects.all()
    permission_classes = [IsAuthenticated, IsSameOrganization]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return KnowledgeDocument.objects.none()
        return KnowledgeDocument.objects.filter(organization=user.organization, is_active=True)

    def perform_create(self, serializer):
        # Fill file metadata and org info
        f = self.request.FILES.get("file")
        file_name = f.name
        mime_type = f.content_type if hasattr(f, "content_type") else ""
        size_bytes = f.size if hasattr(f, "size") else None
        title = self.request.data.get("title") or file_name
        doc = serializer.save(
            uploaded_by=self.request.user,
            organization=self.request.user.organization,
            file_name=file_name,
            mime_type=mime_type,
            size_bytes=size_bytes,
            title=title
        )
        # enqueue ingestion task
        ingest_document.delay(str(doc.id))

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanManageDocument])
    def reindex(self, request, pk=None):
        doc = self.get_object()
        doc.status = "uploaded"
        doc.save(update_fields=["status"])
        ingest_document.delay(str(doc.id))
        return Response({"detail": "Reindexing started"}, status=status.HTTP_202_ACCEPTED)


# Search endpoint (semantic)
from django.db import connection
from django.db.models import F, Value
import time

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSameOrganization])
def semantic_search(request):
    """
    POST body: {"query": "...", "top_k": 6, "document_ids":[...]}
    Returns top chunks with score (cosine distance).
    """
    query = request.data.get("query", "").strip()
    if not query:
        return Response({"detail": "query required"}, status=status.HTTP_400_BAD_REQUEST)
    top_k = int(request.data.get("top_k", 6))
    doc_ids = request.data.get("document_ids", None)

    # Embed query
    q_emb = embed_texts([query], batch_size=1)[0]

    # Raw SQL using pgvector operator <=> (cosine distance) - lower is better
    # Use dynamic table names to avoid hardcoding errors
    user_org = request.user.organization
    with connection.cursor() as cur:
        # FIX: Convert the embedding list to a string to be interpreted as a vector literal
        params = [str(q_emb), user_org.id]
        doc_filter_sql = ""
        if doc_ids:
            doc_filter_sql = "AND document_id = ANY(%s)"
            params.append(doc_ids)
        sql = f"""
        SELECT id, document_id, chunk_index, text, embedding <=> %s as score
        FROM {DocumentChunk._meta.db_table}
        WHERE document_id IN (
            SELECT id FROM {KnowledgeDocument._meta.db_table} WHERE organization_id = %s AND is_active = true
        )
        {doc_filter_sql}
        ORDER BY score ASC
        LIMIT %s
        """
        params.append(top_k)
        cur.execute(sql, params)
        rows = cur.fetchall()
    hits = []
    for r in rows:
        chunk_id, document_id, chunk_idx, text, score = r[0], r[1], r[2], r[3], float(r[4])
        snippet = text[:600]
        hits.append({
            "chunk_id": chunk_id,
            "document_id": document_id,
            "snippet": snippet,
            "score": score,
            "chunk_index": chunk_idx,
        })

    return Response({"results": hits})


# Chat endpoints
class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    queryset = ChatSession.objects.all()
    permission_classes = [IsAuthenticated, IsSameOrganization]

    def get_queryset(self):
        user = self.request.user
        return ChatSession.objects.filter(user=user).order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, organization=self.request.user.organization)

    @action(detail=True, methods=["post"], url_path="message")
    def post_message(self, request, pk=None):
        session = self.get_object()
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "question required"}, status=400)
        top_k = int(request.data.get("top_k", 6))

        # embed query and pull top chunks
        q_emb = embed_texts([question], batch_size=1)[0]

        from django.db import connection
        with connection.cursor() as cur:
            # FIX: Use dynamic table names from model metadata, just like in semantic_search
            sql = f"""
            SELECT id, document_id, chunk_index, text, embedding <=> %s as score
            FROM {DocumentChunk._meta.db_table}
            WHERE document_id IN (
                SELECT id FROM {KnowledgeDocument._meta.db_table} WHERE organization_id = %s AND is_active = true
            )
            ORDER BY score ASC
            LIMIT %s
            """
            cur.execute(sql, [str(q_emb), request.user.organization.id, top_k])
            rows = cur.fetchall()

        context_chunks = []
        for r in rows:
            chunk_id, document_id, chunk_idx, text, score = r[0], r[1], r[2], r[3], float(r[4])
            context_chunks.append({
                "text": text,
                "source": str(document_id),
                "score": score
            })

        system_prompt = getattr(settings, "KB_SYSTEM_PROMPT", "You are a helpful assistant. Use the context to answer the user's question and cite sources.")
        answer = chat_with_context(system_prompt, question, context_chunks)

        # persist chat messages
        user_msg = ChatMessage.objects.create(session=session, role="user", content=question, citations=None)
        assistant_msg = ChatMessage.objects.create(session=session, role="assistant", content=answer, citations=context_chunks)

        session.save()  # update updated_at
        return Response({
            "answer": answer,
            "citations": context_chunks,
            "assistant_message_id": str(assistant_msg.id)
        }, status=200)