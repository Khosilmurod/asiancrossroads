from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, AdminUserSerializer
from .permissions import IsAdmin, IsPresident, IsBoardOrHigher

User = get_user_model()

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (IsAdmin|IsPresident,)  # Only admins and presidents can register users
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        # If not admin, force role to be BOARD
        if self.request.user.role != 'ADMIN':
            serializer.validated_data['role'] = 'BOARD'
        serializer.save()

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class UserManagementView(generics.ListCreateAPIView):
    permission_classes = (IsAdmin|IsPresident,)
    serializer_class = AdminUserSerializer
    
    def get_queryset(self):
        # Exclude admin users from the list
        return User.objects.exclude(role='ADMIN')

    def get_serializer_class(self):
        if self.request.user.role == 'ADMIN':
            return AdminUserSerializer
        return UserSerializer

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAdmin|IsPresident,)
    serializer_class = AdminUserSerializer
    
    def get_queryset(self):
        # Exclude admin users from being viewed/edited
        return User.objects.exclude(role='ADMIN')

    def get_serializer_class(self):
        if self.request.user.role == 'ADMIN':
            return AdminUserSerializer
        return UserSerializer

    def perform_update(self, serializer):
        # Only admins can change roles
        if self.request.user.role != 'ADMIN' and 'role' in self.request.data:
            raise permissions.PermissionDenied("Only admins can change user roles.")
        serializer.save()

class TeamMembersView(generics.ListAPIView):
    permission_classes = (permissions.AllowAny,)  # Public endpoint
    serializer_class = UserSerializer
    
    def get_queryset(self):
        # Exclude admin users and order by role and main status
        return User.objects.exclude(role='ADMIN').order_by('-role', '-is_main')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
