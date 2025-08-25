from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import KnowledgeDocument
from .tasks import ingest_document

@receiver(post_save, sender=KnowledgeDocument)
def trigger_ingest_on_upload(sender, instance, created, **kwargs):
    # Only auto-ingest new uploads (if you prefer explicit action, remove this signal)
    if created and instance.status == "uploaded":
        ingest_document.delay(str(instance.id))
