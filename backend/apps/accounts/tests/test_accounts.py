from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.accounts.models import OrganizationInviteToken, Organization, Role, UserRole

User = get_user_model()

class AccountsFlowTests(APITestCase):
    def setUp(self):
        self.super = User.objects.create_superuser(email="super@example.com", password="superpass")
        self.client = APIClient()

    def test_org_onboarding_and_user_flow(self):
        # Superuser issues token
        self.client.force_authenticate(user=self.super)
        res = self.client.post(reverse("org-token-list"))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        token = res.data["token"]

        # Publicly onboard org + first admin
        self.client.force_authenticate(user=None)
        res2 = self.client.post(reverse("onboard-list"), {
            "token": token,
            "name": "Intex Org",
            "admin_email": "admin@intex.com",
            "admin_password": "AdminPass123",
            "admin_full_name": "Admin Person",
        }, format="json")
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        org_id = res2.data["organization"]["id"]
        admin_email = res2.data["admin"]["email"]
        admin = User.objects.get(email=admin_email)
        self.assertTrue(admin.user_roles.filter(role__name="admin").exists())
        self.assertEqual(str(admin.organization.id), org_id)

        # Admin creates a user in same org
        self.client.force_authenticate(user=admin)
        res3 = self.client.post(reverse("users-list"), {
            "email": "user1@intex.com",
            "password": "UserPass123!",
            "full_name": "User One",
            "roles": ["editor", "reviewer"]
        }, format="json")
        self.assertEqual(res3.status_code, status.HTTP_201_CREATED)
        user1 = User.objects.get(email="user1@intex.com")
        self.assertEqual(user1.organization, admin.organization)
        self.assertEqual(set(user1.user_roles.values_list("role__name", flat=True)), {"editor", "reviewer"})

        # User updates own profile
        self.client.force_authenticate(user=user1)
        res4 = self.client.patch(reverse("profiles-me"), {"bio": "Hello world"}, format="json")
        self.assertEqual(res4.status_code, status.HTTP_200_OK)
        user1.refresh_from_db()
        self.assertEqual(user1.profile.bio, "Hello world")

        # Non-admin cannot create users
        res5 = self.client.post(reverse("users-list"), {
            "email": "another@intex.com", "password": "Pass123456"
        }, format="json")
        self.assertEqual(res5.status_code, status.HTTP_403_FORBIDDEN)
