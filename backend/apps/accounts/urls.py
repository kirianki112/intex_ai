from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationInviteTokenViewSet, OrganizationOnboardViewSet,
    RoleViewSet, UserViewSet, ProfileViewSet
)

router = DefaultRouter()
router.register(r"org-tokens", OrganizationInviteTokenViewSet, basename="org-token")
router.register(r"onboard", OrganizationOnboardViewSet, basename="onboard")
router.register(r"roles", RoleViewSet, basename="roles")
router.register(r"users", UserViewSet, basename="users")
router.register(r"profiles", ProfileViewSet, basename="profiles")

urlpatterns = [
    path("", include(router.urls)),
]
