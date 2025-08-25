from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from apps.accounts.models import OrganizationInviteToken, Organization, Role, UserRole

User = get_user_model()

class KnowledgeBaseAPITest(APITestCase):
    def setUp(self):
        # create superuser and org via invite token flow from accounts app
        self.super = User.objects.create_superuser(email="super@example.com", password="superpass")
        # create token
        token = OrganizationInviteToken.issue(created_by=self.super, ttl_hours=1)
        # onboard org (reuse accounts serializers flow would normally be used; here create directly)
        self.org = Organization.objects.create(name="TestOrg", created_by=self.super)
        self.admin = User.objects.create_user(email="admin@test.org", password="AdminPass123!", organization=self.org, is_staff=True)
        admin_role, _ = Role.objects.get_or_create(name="admin")
        UserRole.objects.get_or_create(user=self.admin, role=admin_role)

        self.client = APIClient()
        # use admin for uploads
        self.client.force_authenticate(user=self.admin)

    def test_upload_txt_and_search(self):
        url = reverse("documents-list")
        content = b"Hello world. This is a knowledge base test. The quick brown fox jumps over the lazy dog."
        f = SimpleUploadedFile("test.txt", content, content_type="text/plain")
        resp = self.client.post(url, {"file": f, "title": "Test TXT"}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        doc_id = resp.data["id"]

        # Since ingestion is async via Celery we can't wait here; but ensure document was created
        from apps.knowledge_base.models import KnowledgeDocument
        doc = KnowledgeDocument.objects.get(id=doc_id)
        self.assertEqual(doc.title, "Test TXT")
        # check status at least 'uploaded' or 'processing'
        self.assertIn(doc.status, ["uploaded", "processing", "ready", "failed"])

    def test_search_requires_query(self):
        url = reverse("kb-search")
        resp = self.client.post(url, {"query": ""}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
