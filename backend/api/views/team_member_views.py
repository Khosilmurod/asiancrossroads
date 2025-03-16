from rest_framework import viewsets, permissions
from api.models import TeamMember
from api.serializers import TeamMemberSerializer

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
