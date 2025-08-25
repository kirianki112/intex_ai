from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Document, DocumentSection, DocumentSectionVersion, EditHistory

@receiver(post_save, sender=Document)
def create_sections_from_template(sender, instance, created, **kwargs):
    if not created or not instance.template:
        return
    structure = instance.template.structure or {}
    sections = structure.get("sections", [])
    for idx, s in enumerate(sections, start=1):
        sec = DocumentSection.objects.create(
            document=instance,
            key=s.get("key", f"section_{idx}"),
            title=s.get("title", f"Section {idx}"),
            order=s.get("order", idx)
        )
        v = DocumentSectionVersion.objects.create(
            section=sec, content="", created_by=instance.created_by, ai_generated=False
        )
        sec.current_version = v
        sec.save(update_fields=["current_version"])

@receiver(post_save, sender=DocumentSectionVersion)
def create_edit_history(sender, instance, created, **kwargs):
    if created:
        EditHistory.objects.create(
            section=instance.section, version=instance, edited_by=instance.created_by, action="create"
        )
