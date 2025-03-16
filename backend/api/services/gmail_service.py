import os
import base64
import pickle
import re
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email import encoders
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from ..models import IncomingEmail, MailingListSubscriber

User = get_user_model()
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

def extract_links_from_text(text):
    """Extract URLs from text content."""
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    return list(set(re.findall(url_pattern, text)))

def get_attachment_metadata(part, message_id):
    """Extract attachment metadata from message part."""
    filename = part.get('filename') or part.get('name')
    if not filename:
        return None
        
    data = part.get('body', {})
    size = data.get('size', 0)
    attachment_id = data.get('attachmentId')
    
    if not attachment_id:
        return None
        
    # Combine message ID and attachment ID
    full_attachment_id = f"{message_id}_{attachment_id}"
    
    return {
        'filename': filename,
        'size': size,
        'content_type': part.get('mimeType'),
        'attachment_id': full_attachment_id,
        'url': f'/api/emails/attachment/{full_attachment_id}/'
    }

def get_gmail_service():
    """Get an authenticated Gmail service instance."""
    creds = None
    token_path = os.path.join(settings.BASE_DIR, 'token.pickle')
    credentials_path = os.path.join(settings.BASE_DIR, 'credentials.json')

    print("Initializing Gmail service...")

    if os.path.exists(token_path):
        print("Found existing token, loading...")
        with open(token_path, 'rb') as token:
            try:
                creds = pickle.load(token)
                print("Token loaded successfully")
            except Exception as e:
                print(f"Error loading token: {e}")
                creds = None

    # Check if credentials are valid
    if creds:
        print("Checking credentials validity...")
        try:
            if creds.expired:
                print("Credentials expired, refreshing...")
                if creds.refresh_token:
                    creds.refresh(Request())
                    print("Credentials refreshed successfully")
                else:
                    print("No refresh token available")
                    creds = None
            else:
                print("Credentials are valid")
        except Exception as e:
            print(f"Error checking/refreshing credentials: {e}")
            creds = None

    # If no valid credentials available, create new ones
    if not creds:
        print("No valid credentials, creating new ones...")
        if not os.path.exists(credentials_path):
            raise FileNotFoundError(
                "credentials.json not found. Please download it from Google Cloud Console"
            )
        
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, 
                SCOPES,
                redirect_uri='http://localhost:8080/'
            )
            creds = flow.run_local_server(port=8080)
            print("New credentials created successfully")
            
            # Save the credentials for future use
            with open(token_path, 'wb') as token:
                pickle.dump(creds, token)
                print("New credentials saved to token.pickle")
        except Exception as e:
            print(f"Error creating new credentials: {e}")
            raise

    try:
        service = build('gmail', 'v1', credentials=creds)
        print("Gmail service built successfully")
        return service
    except Exception as e:
        print(f"Error building Gmail service: {e}")
        raise

def check_new_emails():
    """Check for new emails and store them for approval."""
    service = get_gmail_service()

    try:
        # Get authorized email addresses
        authorized_emails = set(User.objects.filter(
            role__in=['ADMIN', 'PRESIDENT', 'BOARD']
        ).values_list('email', flat=True))
        
        print(f"Authorized emails: {authorized_emails}")
        
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
            
            # Skip if sender is not authorized
            if sender_email.lower() not in {email.lower() for email in authorized_emails}:
                print(f"Skipping unauthorized sender: {sender_email}")
                continue
                
            print(f"Processing authorized email from: {sender_email}")
            
            # Process email content and attachments
            content = ""
            html_content = None
            attachments = []
            
            def process_parts(payload):
                nonlocal content, html_content, attachments
                
                # Handle single part message
                if 'body' in payload and payload['body'].get('data'):
                    if payload['mimeType'] == 'text/plain':
                        content = base64.urlsafe_b64decode(
                            payload['body']['data']
                        ).decode('utf-8')
                    elif payload['mimeType'] == 'text/html':
                        html_content = base64.urlsafe_b64decode(
                            payload['body']['data']
                        ).decode('utf-8')
                
                # Handle attachment in the current part
                if ('filename' in payload and payload['filename']) or ('name' in payload and payload['name']):
                    attachment_meta = get_attachment_metadata(payload, message['id'])
                    if attachment_meta:
                        attachments.append(attachment_meta)
                        print(f"Found attachment: {attachment_meta['filename']}")
                
                # Process child parts recursively
                if 'parts' in payload:
                    for part in payload['parts']:
                        process_parts(part)
            
            # Start processing from the root payload
            process_parts(msg['payload'])
            
            # If no plain text content but have HTML, create a plain text version
            if not content and html_content:
                content = html_content.replace('<br>', '\n').replace('</div>', '\n')
                # Remove all other HTML tags
                content = re.sub(r'<[^>]+>', '', content)
            
            # Extract links from content
            extracted_links = extract_links_from_text(content)
            if html_content:
                extracted_links.extend(extract_links_from_text(html_content))
            extracted_links = list(set(extracted_links))
            
            print(f"Found {len(attachments)} attachments and {len(extracted_links)} links")
            
            # Store email for approval
            try:
                IncomingEmail.objects.create(
                    sender_email=sender_email,
                    subject=subject,
                    content=content,
                    html_content=html_content,
                    original_email_id=message['id'],
                    has_attachments=bool(attachments),
                    attachments=attachments,
                    extracted_links=extracted_links
                )
                
                # Mark email as read
                service.users().messages().modify(
                    userId='me',
                    id=message['id'],
                    body={'removeLabelIds': ['UNREAD']}
                ).execute()
                
                print(f"Successfully stored email from: {sender_email}")
            except Exception as e:
                print(f"Error storing email: {str(e)}")
                continue
            
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
            message = MIMEMultipart('mixed')
            message['Subject'] = email.subject
            message['From'] = 'Asian Crossroads <asiancrossroads@gmail.com>'
            message['To'] = subscriber.email
            
            # Create the HTML/plain-text part
            alt_part = MIMEMultipart('alternative')
            
            # Add plain text and HTML parts
            text_part = MIMEText(email.content, 'plain', 'utf-8')
            alt_part.attach(text_part)
            
            if email.html_content:
                html_part = MIMEText(email.html_content, 'html', 'utf-8')
                alt_part.attach(html_part)
                
            message.attach(alt_part)
            
            # Add attachments if any
            if email.has_attachments and email.attachments:
                for attachment_meta in email.attachments:
                    try:
                        # Get attachment data from Gmail API
                        attachment_id = attachment_meta['attachment_id']
                        msg_id, att_id = attachment_id.split('_')
                        attachment = service.users().messages().attachments().get(
                            userId='me',
                            messageId=msg_id,
                            id=att_id
                        ).execute()
                        
                        if attachment and 'data' in attachment:
                            file_data = base64.urlsafe_b64decode(attachment['data'])
                            
                            # Create attachment part
                            main_type, sub_type = attachment_meta['content_type'].split('/', 1)
                            att_part = MIMEBase(main_type, sub_type)
                            att_part.set_payload(file_data)
                            encoders.encode_base64(att_part)
                            
                            # Add header
                            att_part.add_header(
                                'Content-Disposition',
                                'attachment',
                                filename=attachment_meta['filename']
                            )
                            message.attach(att_part)
                            print(f"Successfully attached {attachment_meta['filename']}")
                    except Exception as e:
                        print(f"Error attaching file {attachment_meta['filename']}: {str(e)}")
                        continue
            
            raw_message = base64.urlsafe_b64encode(
                message.as_bytes()
            ).decode('utf-8')
            
            try:
                service.users().messages().send(
                    userId='me',
                    body={'raw': raw_message}
                ).execute()
                print(f"Successfully sent email to {subscriber.email}")
            except Exception as e:
                print(f"Error sending email to {subscriber.email}: {str(e)}")
                continue
        
        # Update email status
        email.sent_at = timezone.now()
        email.save()
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise 