from django.contrib import admin
from .models import (
    User, UserProfile, Organization, Role, UserRole, OrganizationInviteToken
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "organization", "is_active", "is_staff", "is_superuser")
    search_fields = ("email",)
    list_filter = ("is_active", "is_staff", "is_superuser", "organization")

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "job_title", "phone_number")

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at")
    search_fields = ("name",)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "description")

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "assigned_at")

@admin.register(OrganizationInviteToken)
class OrganizationInviteTokenAdmin(admin.ModelAdmin):
    list_display = ("token", "created_by", "created_at", "expires_at", "is_used")
    readonly_fields = ("token",)
