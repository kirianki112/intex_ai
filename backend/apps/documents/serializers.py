from rest_framework import serializers
from .models import (
    DocumentTemplate, Document, DocumentSection, DocumentSectionVersion,
    Citation, SectionComment, ReviewRequest, DocumentExport
)

class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at"]

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "finalized_at"]

class DocumentSectionSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()

    class Meta:
        model = DocumentSection
        fields = ["id", "document", "key", "title", "order", "is_locked", "content"]
        read_only_fields = ["id", "document", "key", "title", "order", "is_locked"]

    def get_content(self, obj):
        return obj.get_content()

class SectionEditSerializer(serializers.Serializer):
    content = serializers.CharField()
    ai_generated = serializers.BooleanField(default=False)
    summary = serializers.CharField(required=False, allow_blank=True)

class CitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citation
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

class SectionCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionComment
        fields = "__all__"
        read_only_fields = ["id", "author", "created_at"]

class ReviewRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewRequest
        fields = "__all__"
        read_only_fields = ["id", "requested_by", "created_at", "updated_at"]

class DocumentExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentExport
        fields = "__all__"
        read_only_fields = ["id", "requested_by", "file", "created_at", "status"]
