from rest_framework import serializers
from .models import (
    Organization, User, UserProfile, Role, UserRole, OrganizationInviteToken
)
from django.utils import timezone


class OrganizationInviteTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationInviteToken
        fields = ["id", "token", "created_by", "created_at", "expires_at", "is_used"]
        read_only_fields = ["id", "token", "created_by", "created_at", "is_used"]


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "full_name", "job_title", "phone_number", "bio", "avatar",
            "location", "linkedin", "github", "created_at", "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at"]


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "description"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "organization", "is_active", "is_staff", "profile", "roles"]
        read_only_fields = ["id", "is_staff"]

    def get_roles(self, obj):
        return [ur.role.name for ur in obj.user_roles.select_related("role").all()]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        user = super().update(instance, validated_data)
        if profile_data:
            for k, v in profile_data.items():
                setattr(user.profile, k, v)
            user.profile.save()
        return user


class CreateOrgRequestSerializer(serializers.Serializer):
    token = serializers.CharField()
    name = serializers.CharField(max_length=255)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(min_length=8, write_only=True)
    admin_full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate(self, attrs):
        token_str = attrs["token"]
        try:
            tok = OrganizationInviteToken.objects.get(token=token_str)
        except OrganizationInviteToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token.")
        try:
            tok.validate()
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        attrs["_token_obj"] = tok
        return attrs

    def create(self, validated_data):
        tok = validated_data.pop("_token_obj")
        org = Organization.objects.create(name=validated_data["name"])
        admin = User.objects.create_user(
            email=validated_data["admin_email"],
            password=validated_data["admin_password"],
            organization=org,
            is_staff=True,
        )
        # Optionally mark as superuser? No—org admin is handled via Role
        admin_role, _ = Role.objects.get_or_create(name="admin")
        UserRole.objects.get_or_create(user=admin, role=admin_role)

        # Profile
        admin.profile.full_name = validated_data.get("admin_full_name") or ""
        admin.profile.save()

        tok.is_used = True
        tok.save(update_fields=["is_used"])
        return {"organization": org, "admin": admin}


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=[c[0] for c in Role.ROLE_CHOICES]),
        allow_empty=True,
        required=False,
    )

    def create(self, validated_data):
        org = self.context["request"].user.organization
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            organization=org,
        )
        if validated_data.get("full_name"):
            user.profile.full_name = validated_data["full_name"]
            user.profile.save()
        # assign roles
        for rname in validated_data.get("roles", []):
            role, _ = Role.objects.get_or_create(name=rname)
            UserRole.objects.get_or_create(user=user, role=role)
        return user
