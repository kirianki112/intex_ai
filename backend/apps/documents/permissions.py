from rest_framework.permissions import BasePermission

class IsDocumentOwnerOrReviewer(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser:
            return True
        if getattr(obj, "created_by", None) == user:
            return True
        if hasattr(obj, "review_requests"):
            return obj.review_requests.filter(reviewers=user).exists()
        return False
