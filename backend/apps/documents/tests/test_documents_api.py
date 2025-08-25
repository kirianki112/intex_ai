from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch, Mock
from .models import DocumentTemplate, Document, DocumentSection

User = get_user_model()

class DocumentsAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@user.com", password="pass")
        self.client.force_authenticate(self.user)
        self.template = DocumentTemplate.objects.create(
            name="Test Template",
            structure={"sections": [{"key": "intro", "title": "Intro", "order": 1}]},
            created_by=self.user
        )
        self.doc = Document.objects.create(template=self.template, title="Doc", created_by=self.user)

    def test_create_document(self):
        url = reverse("documents-list")
        data = {"template": str(self.template.id), "title": "Test Doc"}
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        doc = Document.objects.get(id=resp.data["id"])
        self.assertTrue(doc.sections.exists())

    @patch("apps.documents.tasks.ai_generate_section.delay")
    def test_generate_all(self, mock_delay):
        DocumentSection.objects.create(document=self.doc, key="intro", title="Intro", order=1)
        url = reverse("documents-generate_all", kwargs={"pk": self.doc.id})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, status.HTTP_202_ACCEPTED)
        mock_delay.assert_called()

    @patch("apps.documents.openai_client.client.responses.create")
    @patch("apps.knowledge_base.openai_client.embed_texts")
    def test_ai_generate_section_with_web_and_kb(self, mock_embed, mock_create):
        mock_embed.return_value = [[0.1, 0.2, 0.3]]
        mock_create.return_value = Mock(output=[None, {"content": [{"text": "Test content", "annotations": [
            {"text": "Web source", "url": "https://example.com", "score": 0.95}
        ]}]})
        sec = DocumentSection.objects.create(document=self.doc, key="test", title="Test", order=1)
        url = reverse("section-ai-generate", kwargs={"pk": sec.id})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, status.HTTP_202_ACCEPTED)
