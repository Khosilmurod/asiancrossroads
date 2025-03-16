from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from api.models import Event
from api.serializers import EventSerializer
from accounts.permissions import IsBoardOrHigher

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsBoardOrHigher]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        # Non-board members can only see published events
        if not self.request.user.is_authenticated or \
           self.request.user.role not in ['ADMIN', 'PRESIDENT', 'BOARD']:
            return Event.objects.filter(is_published=True)
        return Event.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
