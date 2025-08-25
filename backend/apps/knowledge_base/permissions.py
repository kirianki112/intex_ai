from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.accounts.permissions import IsSameOrganization, IsOrgAdmin

class CanUploadDocument(BasePermission):
    """
    Allow upload to users who belong to an org and have kb_manager/editor role.
    """
    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated and u.organization):
            return False
        # superusers allowed
        if u.is_superuser:
            return True
        return u.user_roles.filter(role__name__in=["kb_manager", "editor"]).exists()


class CanManageDocument(BasePermission):
    """
    Org admins or the uploader can delete/reindex.
    """
    def has_object_permission(self, request, view, obj):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.is_superuser:
            return True
        if getattr(obj, "uploaded_by", None) == u:
            return True
        # org admin
        return u.user_roles.filter(role__name="admin").exists()
