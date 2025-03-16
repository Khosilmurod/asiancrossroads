from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from ..models import IncomingEmail
from ..serializers import IncomingEmailSerializer
from ..services.gmail_service import check_new_emails, send_approved_email

class CanManageEmails(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'PRESIDENT']

class IncomingEmailViewSet(viewsets.ModelViewSet):
    queryset = IncomingEmail.objects.all()
    serializer_class = IncomingEmailSerializer
    permission_classes = [CanManageEmails]

    def get_queryset(self):
        return IncomingEmail.objects.all().order_by('-received_at')

    @action(detail=False, methods=['post'])
    def check_new(self, request):
        """Manually trigger checking for new emails."""
        try:
            check_new_emails()
            return Response({'status': 'success'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an email and send it to all subscribers."""
        email = self.get_object()
        
        if email.status != 'PENDING':
            return Response(
                {'error': 'Only pending emails can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Send the email
            send_approved_email(email.id)
            
            # Update email status
            email.status = 'APPROVED'
            email.approved_by = request.user
            email.approved_at = timezone.now()
            email.save()
            
            return Response({'status': 'success'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an email."""
        email = self.get_object()
        
        if email.status != 'PENDING':
            return Response(
                {'error': 'Only pending emails can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email.status = 'REJECTED'
        email.approved_by = request.user
        email.approved_at = timezone.now()
        email.save()
        
        return Response({'status': 'success'}) 