from django.contrib import admin
from .models import KnowledgeDocument, DocumentChunk, ChatSession, ChatMessage, SearchQueryLog

@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "uploaded_by", "status", "created_at")
    list_filter = ("status", "organization")
    search_fields = ("title", "file_name")


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ("document", "chunk_index", "tokens", "created_at")
    search_fields = ("text",)


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "organization", "created_at")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("session", "role", "created_at")

