from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models import (
    Organization, User, UserProfile, Role, UserRole, OrganizationInviteToken
)
from .serializers import (
    OrganizationSerializer, UserSerializer, UserProfileSerializer,
    RoleSerializer, CreateOrgRequestSerializer, CreateUserSerializer,
    OrganizationInviteTokenSerializer
)
from .permissions import IsSuperUser, IsOrgAdmin, IsSameOrganization, IsSelfOrOrgAdmin


class OrganizationInviteTokenViewSet(mixins.CreateModelMixin,
                                     mixins.ListModelMixin,
                                     viewsets.GenericViewSet):
    """
    Superuser issues tokens. Optionally set TTL (hours) via ?ttl=48
    """
    serializer_class = OrganizationInviteTokenSerializer
    permission_classes = [IsAuthenticated & IsSuperUser]
    queryset = OrganizationInviteToken.objects.all().order_by("-created_at")

    def create(self, request, *args, **kwargs):
        ttl = int(request.query_params.get("ttl", 72))
        tok = OrganizationInviteToken.issue(created_by=request.user, ttl_hours=ttl)
        ser = self.get_serializer(tok)
        return Response(ser.data, status=status.HTTP_201_CREATED)


class OrganizationOnboardViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    Public endpoint: create organization + first admin using a token.
    """
    serializer_class = CreateOrgRequestSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = ser.save()
        return Response({
            "organization": OrganizationSerializer(result["organization"]).data,
            "admin": UserSerializer(result["admin"]).data,
        }, status=status.HTTP_201_CREATED)


class RoleViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Role.objects.all().order_by("name")


class UserViewSet(viewsets.ModelViewSet):
    """
    Org Admin can create/list users within their organization.
    Users can retrieve/update themselves (profile update via /me/).
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSameOrganization]
    queryset = User.objects.all()

    def get_queryset(self):
        # limit to same org
        u = self.request.user
        if not u.organization:
            return User.objects.none()
        return User.objects.filter(organization=u.organization).order_by("email")

    def create(self, request, *args, **kwargs):
        if not IsOrgAdmin().has_permission(request, self):
            return Response({"detail": "Only organization admins can create users."},
                            status=status.HTTP_403_FORBIDDEN)
        ser = CreateUserSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        if request.method.lower() == "get":
            return Response(UserSerializer(request.user).data)
        # PATCH: update own profile/basic fields
        ser = UserSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    @action(detail=True, methods=["post"], url_path="assign-roles")
    def assign_roles(self, request, pk=None):
        if not IsOrgAdmin().has_permission(request, self):
            return Response({"detail": "Only organization admins can assign roles."},
                            status=status.HTTP_403_FORBIDDEN)
        user = self.get_object()
        roles = request.data.get("roles", [])
        if not isinstance(roles, list):
            return Response({"detail": "roles must be a list."}, status=400)
        UserRole.objects.filter(user=user).delete()
        for rname in roles:
            role, _ = Role.objects.get_or_create(name=rname)
            UserRole.objects.get_or_create(user=user, role=role)
        return Response({"detail": "Roles updated."})


class ProfileViewSet(mixins.RetrieveModelMixin,
                     mixins.UpdateModelMixin,
                     viewsets.GenericViewSet):
    """
    Access/modify profiles within same organization.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsSameOrganization]
    queryset = UserProfile.objects.select_related("user")

    def get_queryset(self):
        u = self.request.user
        if not u.organization:
            return UserProfile.objects.none()
        return UserProfile.objects.filter(user__organization=u.organization)

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        if request.method.lower() == "get":
            return Response(self.get_serializer(request.user.profile).data)
        ser = self.get_serializer(request.user.profile, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)
