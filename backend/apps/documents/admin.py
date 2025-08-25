from django.contrib import admin
from .models import (
    DocumentTemplate, Document, DocumentSection, DocumentSectionVersion,
    Citation, SectionComment, SectionLock, ReviewRequest, DocumentExport, EditHistory
)

@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "created_by", "created_at")
    search_fields = ("name",)

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "template", "created_by", "organization", "status", "created_at", "finalized_at", "success")
    search_fields = ("title", "meta")
    list_filter = ("status", "success")

@admin.register(DocumentSection)
class DocumentSectionAdmin(admin.ModelAdmin):
    list_display = ("document", "title", "order", "is_locked")
    list_filter = ("document",)

@admin.register(DocumentSectionVersion)
class DocumentSectionVersionAdmin(admin.ModelAdmin):
    list_display = ("section", "created_by", "ai_generated", "created_at")
    list_filter = ("ai_generated",)

@admin.register(Citation)
class CitationAdmin(admin.ModelAdmin):
    list_display = ("marker", "section", "kb_document", "external_url", "created_at")
    search_fields = ("reference_text",)

@admin.register(SectionComment)
class SectionCommentAdmin(admin.ModelAdmin):
    list_display = ("section", "author", "resolved", "created_at")
    list_filter = ("resolved",)

@admin.register(ReviewRequest)
class ReviewRequestAdmin(admin.ModelAdmin):
    list_display = ("document", "requested_by", "status", "created_at")
    list_filter = ("status",)

@admin.register(DocumentExport)
class DocumentExportAdmin(admin.ModelAdmin):
    list_display = ("document", "requested_by", "format", "status", "created_at")
    list_filter = ("status", "format")

@admin.register(EditHistory)
class EditHistoryAdmin(admin.ModelAdmin):
    list_display = ("section", "version", "edited_by", "action", "created_at")
    list_filter = ("action",)