import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator

def uuid4():
    return uuid.uuid4()

class TimestampedModel(models.Model):
    """Abstract base for timestamped models."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        indexes = [models.Index(fields=['created_at'])]

class DocumentTemplate(TimestampedModel):
    """Reusable template for proposals, concept notes, etc."""
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    structure = models.JSONField(default=dict)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['name'])]

class Document(TimestampedModel):
    """Top-level document (concept note, proposal, etc.)"""
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("in_review", "In Review"),
        ("approved", "Approved"),
        ("final", "Final"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    template = models.ForeignKey(DocumentTemplate, on_delete=models.PROTECT, related_name="documents", null=True, blank=True)
    title = models.CharField(max_length=1024)
    meta = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="created_documents", on_delete=models.CASCADE)
    organization = models.ForeignKey("accounts.Organization", null=True, blank=True, on_delete=models.CASCADE)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="draft")
    finalized_at = models.DateTimeField(null=True, blank=True)
    success = models.BooleanField(null=True, blank=True, help_text="True if funded/accepted, False if rejected")

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['success']),
            models.Index(fields=['organization', 'status']),
        ]

class DocumentSection(TimestampedModel):
    """Structured section inside a document"""
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="sections")
    key = models.CharField(max_length=200)
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    current_version = models.ForeignKey("DocumentSectionVersion", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    is_locked = models.BooleanField(default=False)

    class Meta:
        unique_together = ("document", "key")
        ordering = ["order"]
        indexes = [models.Index(fields=['document', 'order'])]

    def get_content(self):
        return self.current_version.content if self.current_version else ""

class DocumentSectionVersion(TimestampedModel):
    """Versioned content of a section (for undo/redo + AI tracking)"""
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    section = models.ForeignKey(DocumentSection, on_delete=models.CASCADE, related_name="versions")
    content = models.TextField(blank=True)
    diff = models.JSONField(default=dict, blank=True, help_text="Diff from previous version for efficiency")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    ai_generated = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    summary = models.CharField(max_length=512, blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=['section', '-created_at'])]

class EditHistory(TimestampedModel):
    """Tracks all edits for audit trail"""
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    section = models.ForeignKey(DocumentSection, on_delete=models.CASCADE, related_name="edits")
    version = models.ForeignKey(DocumentSectionVersion, on_delete=models.CASCADE, related_name="edit_histories")
    edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=50, choices=[("create", "create"), ("update", "update"), ("revert", "revert"), ("merge", "merge")])

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=['section', 'action'])]

class Citation(TimestampedModel):
    """Inline or external citation linked to a section"""
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    section = models.ForeignKey(DocumentSection, on_delete=models.CASCADE, related_name="citations")
    marker = models.CharField(max_length=64, help_text="Inline marker like [1] or (Smith, 2023)")
    reference_text = models.TextField()
    kb_document = models.ForeignKey("knowledge_base.KnowledgeDocument", null=True, blank=True, on_delete=models.SET_NULL)
    external_url = models.URLField(blank=True, null=True)
    snapshot_path = models.TextField(blank=True, null=True)
    confidence_score = models.FloatField(null=True, blank=True)
    additional_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=['section'])]

class SectionComment(TimestampedModel):
    """Reviewer comments on sections"""
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    section = models.ForeignKey(DocumentSection, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def mark_resolved(self, user=None):
        self.resolved = True
        self.resolved_at = timezone.now()
        self.save(update_fields=["resolved", "resolved_at"])

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=['section', 'resolved'])]

class SectionLock(TimestampedModel):
    """Lock a section while being edited (avoid conflicts)"""
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    section = models.OneToOneField(DocumentSection, on_delete=models.CASCADE, related_name="lock")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    acquired_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at

    def release(self):
        self.delete()

    class Meta:
        indexes = [models.Index(fields=['expires_at'])]

class ReviewRequest(TimestampedModel):
    """Request a review for a document"""
    STATUS = [("open", "open"), ("approved", "approved"), ("changes_requested", "changes_requested"), ("closed", "closed")]
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="review_requests")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    reviewers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="assigned_reviews", blank=True)
    status = models.CharField(max_length=32, choices=STATUS, default="open")
    summary = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=['document', 'status'])]

class DocumentExport(TimestampedModel):
    """Exported files (Word, PDF, Excel)"""
    FORMAT_CHOICES = [("docx", "DOCX"), ("pdf", "PDF"), ("excel", "Excel")]
    STATUS_CHOICES = [("pending", "Pending"), ("completed", "Completed"), ("failed", "Failed")]
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="exports")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    options = models.JSONField(default=dict, blank=True)
    file = models.FileField(upload_to="document_exports/", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return f"{self.document.title} export {self.format}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=['document', 'status'])]