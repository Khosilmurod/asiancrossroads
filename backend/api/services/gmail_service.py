import os
import base64
import pickle
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from django.conf import settings
from django.utils import timezone
from ..models import IncomingEmail, MailingListSubscriber
from accounts.models import User

SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

def get_gmail_service():
    creds = None
    token_path = os.path.join(settings.BASE_DIR, 'token.pickle')
    credentials_path = os.path.join(settings.BASE_DIR, 'credentials.json')

    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, 
                SCOPES,
                redirect_uri='http://localhost:8080/'
            )
            creds = flow.run_local_server(port=8080)
        
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)

    return build('gmail', 'v1', credentials=creds)

def check_new_emails():
    """Check for new emails from board members/admins and store them for approval."""
    service = get_gmail_service()
    
    # Get list of authorized sender emails
    authorized_emails = User.objects.filter(
        role__in=['BOARD', 'PRESIDENT', 'ADMIN']
    ).values_list('email', flat=True)

    try:
        # Get unread messages
        results = service.users().messages().list(
            userId='me',
            labelIds=['UNREAD'],
            q='to:asiancrossroads@gmail.com'
        ).execute()
        
        messages = results.get('messages', [])
        
        for message in messages:
            msg = service.users().messages().get(
                userId='me',
                id=message['id'],
                format='full'
            ).execute()
            
            headers = msg['payload']['headers']
            subject = next(h['value'] for h in headers if h['name'] == 'Subject')
            sender = next(h['value'] for h in headers if h['name'] == 'From')
            sender_email = sender.split('<')[-1].strip('>')
            
            # Check if sender is authorized
            if sender_email not in authorized_emails:
                continue
                
            # Get email content
            if 'parts' in msg['payload']:
                parts = msg['payload']['parts']
                content = ""
                html_content = None
                
                for part in parts:
                    if part['mimeType'] == 'text/plain':
                        content = base64.urlsafe_b64decode(
                            part['body']['data']
                        ).decode('utf-8')
                    elif part['mimeType'] == 'text/html':
                        html_content = base64.urlsafe_b64decode(
                            part['body']['data']
                        ).decode('utf-8')
            else:
                content = base64.urlsafe_b64decode(
                    msg['payload']['body']['data']
                ).decode('utf-8')
                html_content = None
            
            # Store email for approval
            IncomingEmail.objects.create(
                sender_email=sender_email,
                subject=subject,
                content=content,
                html_content=html_content,
                original_email_id=message['id']
            )
            
            # Mark email as read
            service.users().messages().modify(
                userId='me',
                id=message['id'],
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            
    except Exception as e:
        print(f"Error checking emails: {str(e)}")
        raise

def send_approved_email(email_id):
    """Send approved email to all subscribers."""
    service = get_gmail_service()
    email = IncomingEmail.objects.get(id=email_id)
    subscribers = MailingListSubscriber.objects.filter(is_active=True)
    
    try:
        for subscriber in subscribers:
            message = MIMEMultipart('alternative')
            message['Subject'] = email.subject
            message['From'] = 'Asian Crossroads <asiancrossroads@gmail.com>'
            message['To'] = subscriber.email
            
            # Add plain text and HTML parts
            text_part = MIMEText(email.content, 'plain')
            message.attach(text_part)
            
            if email.html_content:
                html_part = MIMEText(email.html_content, 'html')
                message.attach(html_part)
            
            raw_message = base64.urlsafe_b64encode(
                message.as_bytes()
            ).decode('utf-8')
            
            service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
        
        # Update email status
        email.sent_at = timezone.now()
        email.save()
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise 