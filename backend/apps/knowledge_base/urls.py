from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, semantic_search, ChatSessionViewSet

router = DefaultRouter()
router.register(r"documents", DocumentViewSet, basename="documents")
router.register(r"chat/sessions", ChatSessionViewSet, basename="chat-sessions")

urlpatterns = [
    path("", include(router.urls)),
    path("search/", semantic_search, name="kb-search"),
]
