from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='register'),
    
    # User Management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('users/', views.UserManagementView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Public endpoints
    path('team/', views.TeamMembersView.as_view(), name='team-members'),
] 