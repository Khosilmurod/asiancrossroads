from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('team', views.TeamMemberViewSet)
router.register('events', views.EventViewSet)
router.register('articles', views.ArticleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
