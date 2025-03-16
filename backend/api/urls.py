from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views.subscriber_views import SubscriberViewSet
from .views.email_views import IncomingEmailViewSet

router = DefaultRouter()
router.register('team', views.TeamMemberViewSet)
router.register('events', views.EventViewSet)
router.register('articles', views.ArticleViewSet)
router.register('subscribers', SubscriberViewSet, basename='subscriber')
router.register('emails', IncomingEmailViewSet, basename='email')

urlpatterns = [
    path('', include(router.urls)),
]
