from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserProfile, Role
from django.core.exceptions import ObjectDoesNotExist

@receiver(post_save, sender=User)
def create_profile_on_user_create(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=Role)
def ensure_unique_default_roles(sender, instance, created, **kwargs):
    # No-op hook reserved if you later want to auto-provision roles per org
    pass
