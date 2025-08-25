from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)

class IsOrgAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated and u.organization):
            return False
        return u.user_roles.filter(role__name="admin").exists()

class IsSameOrganization(BasePermission):
    """
    Allows access only to objects within the same organization as the user.
    Use on viewsets where queryset is filtered by organization.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.organization)

    def has_object_permission(self, request, view, obj):
        user_org = getattr(request.user, "organization", None)
        target_org = getattr(obj, "organization", None)
        if target_org is None and hasattr(obj, "user"):
            target_org = getattr(obj.user, "organization", None)
        return user_org and target_org and user_org == target_org


class IsSelfOrOrgAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "id") and obj == request.user:
            return True
        # allow admins of same org
        from .permissions import IsOrgAdmin as _IsOrgAdmin  # local import to avoid cycle
        return _IsOrgAdmin().has_permission(request, view)
