from rest_framework import serializers
from .models import KnowledgeDocument, DocumentChunk, ChatSession, ChatMessage
from apps.accounts.serializers import UserSerializer  # optional reuse
from django.conf import settings


class UploadDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = ["id", "title", "file", "file_name", "mime_type", "size_bytes", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at", "file_name", "mime_type", "size_bytes"]

    def create(self, validated_data):
        # set file_name/mime_type/size_bytes later in view or signal
        return super().create(validated_data)


class DocumentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = ["id", "title", "file", "file_name", "mime_type", "size_bytes", "status", "pages", "created_at", "processed_at"]


class ChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = ["id", "document", "chunk_index", "text", "tokens", "page_start", "page_end"]


class SearchHitSerializer(serializers.Serializer):
    chunk_id = serializers.UUIDField()
    document_id = serializers.UUIDField()
    snippet = serializers.CharField()
    score = serializers.FloatField()
    chunk_index = serializers.IntegerField()


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "session", "role", "content", "citations", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ["id", "organization", "user", "title", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "created_at", "updated_at", "messages"]
