from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TemplateViewSet, DocumentViewSet, SectionViewSet, CitationViewSet

router = DefaultRouter()
router.register(r"templates", TemplateViewSet, basename="templates")
router.register(r"documents", DocumentViewSet, basename="documents")
router.register(r"citations", CitationViewSet, basename="citations")

section_patterns = [
    path("sections/", SectionViewSet.as_view({"get": "list"}), name="section-list"),
    path("sections/<uuid:pk>/", SectionViewSet.as_view({"get": "retrieve"}), name="section-detail"),
    path("sections/<uuid:pk>/edit/", SectionViewSet.as_view({"post": "edit"}), name="section-edit"),
    path("sections/<uuid:pk>/ai-generate/", SectionViewSet.as_view({"post": "ai_generate"}), name="section-ai-generate"),
    path("sections/<uuid:pk>/undo/", SectionViewSet.as_view({"post": "undo"}), name="section-undo"),
]

urlpatterns = [
    path("", include(router.urls)),
] + section_patterns
