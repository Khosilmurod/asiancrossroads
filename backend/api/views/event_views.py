from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from api.models import Event
from api.serializers import EventSerializer
from accounts.permissions import IsBoardOrHigher
from ..permissions import IsAdminOrBoardMember

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    queryset = Event.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminOrBoardMember]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = Event.objects.all().order_by('-start_date')
        
        # If user is not admin/board member, only show active events
        if not IsAdminOrBoardMember().has_permission(self.request, self):
            queryset = queryset.filter(is_active=True)
            
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
            
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(start_date__range=[start_date, end_date])
            
        # Filter upcoming/past events
        show = self.request.query_params.get('show', 'upcoming')
        if show == 'upcoming':
            queryset = queryset.filter(start_date__gte=timezone.now())
        elif show == 'past':
            queryset = queryset.filter(start_date__lt=timezone.now())
            
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
            
        return queryset.select_related('created_by')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        
        if event.has_ended:
            return Response(
                {"error": "This event has already ended"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if event.is_full:
            return Response(
                {"error": "This event is already full"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        event.current_registrations += 1
        event.save()
        
        return Response({
            "message": "Successfully registered for the event",
            "spots_left": event.spots_left
        })
    
    @action(detail=True, methods=['post'])
    def unregister(self, request, pk=None):
        event = self.get_object()
        
        if event.has_ended:
            return Response(
                {"error": "This event has already ended"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if event.current_registrations > 0:
            event.current_registrations -= 1
            event.save()
            
        return Response({
            "message": "Successfully unregistered from the event",
            "spots_left": event.spots_left
        })
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        event = self.get_object()
        event.is_published = True
        event.save()
        return Response({"status": "Event published successfully"})
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        event = self.get_object()
        event.is_published = False
        event.save()
        return Response({"status": "Event unpublished successfully"})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        event = self.get_object()
        event.is_active = not event.is_active
        event.save()
        return Response({
            "status": f"Event {'activated' if event.is_active else 'deactivated'} successfully",
            "is_active": event.is_active
        })
