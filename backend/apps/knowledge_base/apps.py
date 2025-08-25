from django.apps import AppConfig

class KnowledgeBaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.knowledge_base"
    verbose_name = "Knowledge Base"

    def ready(self):
        # Import signals
        from . import signals  # noqa: F401
