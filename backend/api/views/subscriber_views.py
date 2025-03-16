from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from api.models import MailingListSubscriber
from api.serializers import MailingListSubscriberSerializer
from rest_framework.permissions import BasePermission, AllowAny
from django.shortcuts import get_object_or_404

class CanViewSubscribers(BasePermission):
    def has_permission(self, request, view):
        print(f"Checking view permissions for user: {request.user}")  # Debug print
        if not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'role') and request.user.role in ['ADMIN', 'PRESIDENT', 'BOARD']

class CanDeleteSubscribers(BasePermission):
    def has_permission(self, request, view):
        print(f"Checking delete permissions for user: {request.user}")  # Debug print
        if not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'role') and request.user.role in ['ADMIN', 'PRESIDENT']

class SubscriberViewSet(viewsets.ModelViewSet):
    queryset = MailingListSubscriber.objects.all()
    serializer_class = MailingListSubscriberSerializer
    permission_classes = [AllowAny]  # Default to AllowAny
    
    def get_permissions(self):
        """
        Custom permissions:
        - Anyone can subscribe (create)
        - Admin, President, and Board members can view list
        - Only Admin and President can delete
        """
        print(f"Action being performed: {self.action}")  # Debug print
        if self.action == 'create':
            print("Allowing public subscription")  # Debug print
            return [AllowAny()]  # Explicitly allow anyone to subscribe
        elif self.action == 'destroy':
            print("Checking delete permissions")  # Debug print
            return [CanDeleteSubscribers()]
        elif self.action in ['list', 'retrieve']:
            print("Checking view permissions")  # Debug print
            return [CanViewSubscribers()]
        else:
            print("Default to authenticated")  # Debug print
            return [permissions.IsAuthenticated()]
    
    def get_object(self):
        """Override get_object to add debugging for object retrieval"""
        pk = self.kwargs.get('pk')
        print(f"Attempting to get subscriber with ID: {pk}")  # Debug print
        
        # Check if object exists
        try:
            obj = get_object_or_404(MailingListSubscriber, pk=pk)
            print(f"Found subscriber: {obj.email}")  # Debug print
            return obj
        except Exception as e:
            print(f"Error finding subscriber with ID {pk}: {str(e)}")  # Debug print
            raise
    
    def list(self, request, *args, **kwargs):
        """Override list method to handle empty queryset and add debugging"""
        queryset = self.get_queryset()
        print(f"Queryset count: {queryset.count()}")  # Debug print
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Override create method to add debugging"""
        print(f"Create request data: {request.data}")  # Debug print
        print(f"Request user: {request.user}")  # Debug print
        print(f"Request method: {request.method}")  # Debug print
        print(f"Request headers: {request.headers}")  # Debug print
        
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                print("Serializer is valid")  # Debug print
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            else:
                print(f"Serializer errors: {serializer.errors}")  # Debug print
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error during subscription: {str(e)}")  # Debug print
            return Response(
                {"detail": "Failed to subscribe. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    def destroy(self, request, *args, **kwargs):
        """Override destroy method to add debugging"""
        try:
            instance = self.get_object()
            print(f"Attempting to delete subscriber: {instance.email} (ID: {instance.id})")  # Debug print
            self.perform_destroy(instance)
            print(f"Successfully deleted subscriber with ID: {instance.id}")  # Debug print
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            print(f"Error during deletion: {str(e)}")  # Debug print
            raise 