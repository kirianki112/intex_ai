import uuid
from django.db import models
from django.conf import settings
from pgvector.django import VectorField  # from pgvector package
from django.utils import timezone

# Document upload statuses
DOC_STATUS = (
    ("uploaded", "Uploaded"),
    ("processing", "Processing"),
    ("ready", "Ready"),
    ("failed", "Failed"),
)

class KnowledgeDocument(models.Model):
    """
    Stores uploaded file metadata and owner/org info.
    The file is saved in MEDIA_ROOT/knowledge_docs/
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="kb_documents",
        null=True,
        blank=True,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="uploaded_documents"
    )
    title = models.CharField(max_length=512)
    file = models.FileField(upload_to="knowledge_docs/")
    file_name = models.CharField(max_length=512, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    size_bytes = models.PositiveBigIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=DOC_STATUS, default="uploaded")
    error_message = models.TextField(blank=True, null=True)
    pages = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)  # soft delete / visibility flag

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.id})"


class DocumentChunk(models.Model):
    """
    A chunk of text from a document with its embedding vector stored in pgvector.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(KnowledgeDocument, on_delete=models.CASCADE, related_name="chunks")
    chunk_index = models.PositiveIntegerField()  # ordering index
    text = models.TextField()
    # vector dimension depends on embedding model; pgvector.VectorField stores vector
    embedding = VectorField(dimensions=1536, null=True)  # default uses 1536 (text-embedding-3-small)
    tokens = models.PositiveIntegerField(null=True, blank=True)
    page_start = models.IntegerField(null=True, blank=True)
    page_end = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("document", "chunk_index")
        indexes = [
            models.Index(fields=["document", "chunk_index"]),
            # vector index must be created in a migration using RunSQL for ivfflat or hnsw (see migration note).
        ]
        ordering = ["chunk_index"]

    def __str__(self):
        return f"chunk {self.chunk_index} of {self.document.title}"


class SearchQueryLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    organization = models.ForeignKey("accounts.Organization", on_delete=models.SET_NULL, null=True, blank=True)
    query_text = models.TextField()
    top_k = models.PositiveIntegerField(default=6)
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    result_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("accounts.Organization", on_delete=models.CASCADE, related_name="chat_sessions", null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="chat_sessions")
    title = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ChatMessage(models.Model):
    ROLE_CHOICES = (("user", "user"), ("assistant", "assistant"), ("system", "system"))
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    # citations example: [{"doc_id": "...", "chunk_id": "...", "score": 0.12}, ...]
    citations = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
