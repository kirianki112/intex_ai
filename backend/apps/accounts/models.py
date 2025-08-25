from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import uuid
from django.utils import timezone
import secrets


# -------------------
# Custom User Manager
# -------------------
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if not password:
            raise ValueError("Superusers must have a password")
        return self.create_user(email, password, **extra_fields)


# -------------------
# Organization Invite Token (issued by superuser)
# -------------------
class OrganizationInviteToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_by = models.ForeignKey(
        "User", on_delete=models.SET_NULL, null=True, blank=True, related_name="org_tokens_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)

    @staticmethod
    def issue(created_by=None, ttl_hours=72):
        t = OrganizationInviteToken(
            token=secrets.token_urlsafe(32),
            created_by=created_by,
            expires_at=timezone.now() + timezone.timedelta(hours=ttl_hours),
        )
        t.save()
        return t

    def validate(self):
        if self.is_used:
            raise ValueError("Token already used.")
        if self.expires_at and timezone.now() > self.expires_at:
            raise ValueError("Token expired.")


# -------------------
# Organization Model
# -------------------
class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        "User", on_delete=models.SET_NULL, null=True, blank=True, related_name="organizations_created"
    )

    def __str__(self):
        return self.name


# -------------------
# Custom User Model
# -------------------
class User(AbstractUser):
    username = None  # disable username
    email = models.EmailField(unique=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="users", null=True, blank=True
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


# -------------------
# User Profile
# -------------------
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255, blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.email}"


# -------------------
# Roles & UserRole (multi-role per user)
# -------------------
class Role(models.Model):
    ROLE_CHOICES = [
        ("admin", "Organization Admin"),
        ("kb_manager", "Knowledge Base Manager"),
        ("editor", "Editor"),
        ("reviewer", "Reviewer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=ROLE_CHOICES)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("name",)

    def __str__(self):
        return self.get_name_display()


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_users")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "role")

    def __str__(self):
        return f"{self.user.email} → {self.role.name}"
