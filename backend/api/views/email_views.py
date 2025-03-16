from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from ..models import IncomingEmail
from ..serializers import IncomingEmailSerializer
from ..services.gmail_service import check_new_emails, send_approved_email, get_gmail_service
import base64

User = get_user_model()

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
        # Get all authorized email addresses (board members, admins, president)
        authorized_emails = User.objects.filter(
            role__in=['ADMIN', 'PRESIDENT', 'BOARD']
        ).values_list('email', flat=True)
        
        # Filter emails by authorized senders
        return IncomingEmail.objects.filter(
            sender_email__in=authorized_emails
        ).order_by('-received_at')

    @action(detail=True, methods=['post'])
    def delete_email(self, request, pk=None):
        """Delete an email."""
        email = self.get_object()
        email.delete()
        return Response({'status': 'success'})

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

    @action(detail=False, methods=['get'], url_path='attachment/(?P<attachment_id>[^/.]+)', permission_classes=[])
    def get_attachment(self, request, attachment_id=None):
        """Serve an email attachment."""
        try:
            print(f"Attempting to serve attachment: {attachment_id}")
            
            # First find the email containing this attachment
            email = IncomingEmail.objects.filter(
                attachments__contains=[{'attachment_id': attachment_id}]
            ).first()
            
            if not email:
                print(f"No email found with attachment_id: {attachment_id}")
                return Response(
                    {'error': 'Attachment not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Find the attachment metadata
            attachment_meta = next(
                (a for a in email.attachments if a['attachment_id'] == attachment_id),
                None
            )
            
            if not attachment_meta:
                print(f"No attachment metadata found for attachment_id: {attachment_id}")
                return Response(
                    {'error': 'Attachment metadata not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            print(f"Found attachment metadata: {attachment_meta}")

            # Get the attachment data from Gmail
            try:
                service = get_gmail_service()
                print("Gmail service initialized")
                
                # The attachment ID contains both message ID and attachment ID
                # Format: message_id_attachment_id
                try:
                    # Get the original message ID
                    original_message_id = email.original_email_id
                    
                    # Get the attachment ID - it's stored in the format message_id_attachment_id
                    # We need to extract just the attachment ID part
                    attachment_parts = attachment_meta['attachment_id'].split('_')
                    # The attachment ID is everything after the message ID
                    message_id_length = len(original_message_id) + 1  # +1 for the underscore
                    attachment_id_only = attachment_meta['attachment_id'][message_id_length:]
                    
                    print(f"Using original message_id: {original_message_id}")
                    print(f"Using attachment_id: {attachment_id_only}")
                    
                    attachment = service.users().messages().attachments().get(
                        userId='me',
                        messageId=original_message_id,
                        id=attachment_id_only
                    ).execute()
                    
                    if not attachment:
                        print("No attachment data returned from Gmail API")
                        return Response(
                            {'error': 'Attachment not found in Gmail'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                    
                    if 'data' not in attachment:
                        print("No data field in attachment response")
                        return Response(
                            {'error': 'Attachment data not found'},
                            status=status.HTTP_404_NOT_FOUND
                        )

                    print("Successfully retrieved attachment data from Gmail")

                    # Decode the attachment data
                    try:
                        file_data = base64.urlsafe_b64decode(attachment['data'])
                        print(f"Successfully decoded attachment data, size: {len(file_data)} bytes")
                    except Exception as e:
                        print(f"Error decoding attachment data: {str(e)}")
                        return Response(
                            {'error': 'Could not decode attachment data'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )

                    # Create the response with proper headers
                    response = HttpResponse(
                        file_data,
                        content_type=attachment_meta['content_type']
                    )
                    response['Content-Disposition'] = f'attachment; filename="{attachment_meta["filename"]}"'
                    response['Content-Length'] = len(file_data)
                    print(f"Sending response with content type: {attachment_meta['content_type']}")
                    return response
                    
                except Exception as e:
                    print(f"Error processing attachment IDs: {str(e)}")
                    return Response(
                        {'error': 'Invalid attachment format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
            except Exception as e:
                print(f"Error fetching attachment from Gmail: {str(e)}")
                return Response(
                    {'error': f'Could not fetch attachment from Gmail: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            print(f"Error serving attachment: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 