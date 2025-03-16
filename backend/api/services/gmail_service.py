import os
import base64
import pickle
import re
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
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
import pathlib

User = get_user_model()
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

# Create assets directory if it doesn't exist
ASSETS_DIR = os.path.join(settings.BASE_DIR, 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

def get_logo_html(mode="cid"):
    """Get the HTML for the logo.
    
    mode="cid": Returns an <img> tag referencing the logo via a Content-ID.
    mode="datauri": Returns an <img> tag with a data URI (Base64) so the file is self-contained.
    """
    logo_path = os.path.join(settings.BASE_DIR, 'assets', 'logo.png')
    
    if not os.path.exists(logo_path):
        print(f"Logo file not found at {logo_path}")
        return ""
        
    if mode == "cid":
        # Reference the logo using a content ID
        return '''
            <div style="text-align: center; padding: 20px 0;">
                <img src="cid:logo@asiancrossroads" 
                     alt="Asian Crossroads Logo" 
                     style="width: 150px; height: auto; display: block; margin: 0 auto;"
                     width="150">
            </div>
        '''
    elif mode == "datauri":
        try:
            with open(logo_path, 'rb') as f:
                logo_data = base64.b64encode(f.read()).decode('utf-8')
                return f'''
                    <div style="text-align: center; padding: 20px 0;">
                        <img src="data:image/png;base64,{logo_data}" 
                             alt="Asian Crossroads Logo" 
                             style="width: 150px; height: auto; display: block; margin: 0 auto;"
                             width="150">
                    </div>
                '''
        except Exception as e:
            print(f"Error reading logo: {str(e)}")
            return ""
    else:
        return ""

def add_logo_to_html(html_content, mode="datauri"):
    """Add logo to HTML content and ensure it's all styled with Merriweather."""
    logo_html = get_logo_html(mode)
    if not logo_html:
        return html_content
        
    # If the content is just plain text, wrap it in a div with nice formatting
    if not html_content.strip().startswith('<'):
        html_content = f'''
            <div class="ac-email-content-text">
                {html_content}
            </div>
        '''
    else:
        # Clean up any existing styles and wrap HTML content
        # Remove any existing font-family styles
        html_content = re.sub(r'font-family\s*:[^;"]+;?', '', html_content, flags=re.IGNORECASE)
        # Remove font tags
        html_content = re.sub(r'</?font[^>]*>', '', html_content, flags=re.IGNORECASE)
        # Remove face attributes
        html_content = re.sub(r'\sface="[^"]*"', '', html_content, flags=re.IGNORECASE)
        # Remove style tags
        html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
        # Wrap in container
        html_content = f'<div class="ac-email-content-html">{html_content}</div>'
    
    # Remove any existing logo if present
    html_content = re.sub(
        r'<div[^>]*>\s*<img[^>]*alt="Asian Crossroads Logo"[^>]*>\s*</div>',
        '',
        html_content,
        flags=re.IGNORECASE
    )
    
    # Remove any existing DOCTYPE, html, head, and body tags
    html_content = re.sub(
        r'<!DOCTYPE[^>]*>|</?html[^>]*>|</?head[^>]*>|</?body[^>]*>',
        '',
        html_content,
        flags=re.IGNORECASE
    )
    
    # Create a complete HTML structure with the logo at the top and scoped styles
    return f'''
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta name="color-scheme" content="light">
                <meta name="supported-color-schemes" content="light">
                <meta name="format-detection" content="telephone=no">
                <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet">
                <style>
                    /* Reset all inherited styles */
                    * {{
                        margin: 0;
                        padding: 0;
                        font-family: 'Merriweather', Georgia, serif !important;
                        line-height: 1.6 !important;
                        color: #1f2937 !important;
                    }}
                    
                    /* Main container styles */
                    .ac-email-container {{
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                    }}
                    
                    /* Content text styles */
                    .ac-email-content-text {{
                        white-space: pre-wrap;
                        margin-bottom: 1em;
                    }}
                    
                    /* HTML content styles */
                    .ac-email-content-html {{
                        margin-bottom: 1em;
                    }}
                    
                    /* Override any existing styles */
                    p, div, span, a, li, td, th, h1, h2, h3, h4, h5, h6 {{
                        font-family: 'Merriweather', Georgia, serif !important;
                        line-height: 1.6 !important;
                        color: #1f2937 !important;
                    }}
                    
                    /* Specific heading styles */
                    h1, h2, h3, h4, h5, h6 {{
                        margin-bottom: 0.5em;
                        line-height: 1.4 !important;
                    }}
                    
                    /* Paragraph spacing */
                    p {{
                        margin-bottom: 1em;
                    }}
                    
                    /* List styles */
                    ul, ol {{
                        margin-bottom: 1em;
                        padding-left: 2em;
                    }}
                    
                    /* Link styles */
                    a {{
                        color: #2563eb !important;
                        text-decoration: underline;
                    }}
                    
                    /* Logo container */
                    .ac-email-logo {{
                        text-align: center;
                        padding: 20px 0;
                    }}
                    
                    /* Logo image */
                    .ac-email-logo img {{
                        width: 150px;
                        height: auto;
                        display: block;
                        margin: 0 auto;
                    }}
                </style>
            </head>
            <body>
                <div class="ac-email-container">
                    <div class="ac-email-logo">
                        {logo_html}
                    </div>
                    {html_content}
                </div>
            </body>
        </html>
    '''

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
                        decoded_html = base64.urlsafe_b64decode(
                            payload['body']['data']
                        ).decode('utf-8')
                        
                        # Remove any existing logo if present
                        decoded_html = re.sub(
                            r'<div[^>]*>\s*<img[^>]*alt="Asian Crossroads Logo"[^>]*>\s*</div>',
                            '',
                            decoded_html,
                            flags=re.IGNORECASE
                        )

                        # Remove any inline font-family styles, <font> tags, and face="..." attributes
                        decoded_html = re.sub(r'font-family\s*:[^;"]+;?', '', decoded_html, flags=re.IGNORECASE)
                        decoded_html = re.sub(r'\sface="[^"]*"', '', decoded_html, flags=re.IGNORECASE)
                        decoded_html = re.sub(r'</?font[^>]*>', '', decoded_html, flags=re.IGNORECASE)
                        
                        html_content = decoded_html
                
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
                # Convert HTML to plain text
                content = re.sub(r'<br\s*/?>', '\n', html_content)
                content = re.sub(r'</div>\s*<div[^>]*>', '\n\n', content)
                content = re.sub(r'</p>\s*<p[^>]*>', '\n\n', content)
                content = re.sub(r'<[^>]+>', '', content)
                content = re.sub(r'\n{3,}', '\n\n', content)
                content = content.strip()
            
            # Create HTML version with logo and styling (all Merriweather)
            final_html = add_logo_to_html(
                html_content if html_content else content,
                mode="datauri"
            )
            
            print(f"Found {len(attachments)} attachments")
            
            # Store email for approval
            try:
                IncomingEmail.objects.create(
                    sender_email=sender_email,
                    subject=subject,
                    content=content,
                    html_content=final_html,
                    original_email_id=message['id'],
                    has_attachments=bool(attachments),
                    attachments=attachments
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
    print(f"\n=== Starting to send approved email {email_id} ===")
    service = get_gmail_service()
    try:
        email = IncomingEmail.objects.get(id=email_id)
        print(f"Found email: subject='{email.subject}', from={email.sender_email}")
    except IncomingEmail.DoesNotExist:
        print(f"Error: Email with ID {email_id} not found")
        raise
    
    try:
        subscribers = MailingListSubscriber.objects.filter(is_active=True)
        subscriber_count = subscribers.count()
        print(f"Found {subscriber_count} active subscribers")
        if subscriber_count == 0:
            print("Warning: No active subscribers found!")
            return
    except Exception as e:
        print(f"Error getting subscribers: {str(e)}")
        raise
    
    # Loop through subscribers and send the email with inline logo using CID
    for subscriber in subscribers:
        print(f"\n--- Processing subscriber: {subscriber.email} ---")
        try:
            message = MIMEMultipart('mixed')
            message['Subject'] = email.subject
            message['From'] = 'Asian Crossroads <asiancrossroads@gmail.com>'
            message['To'] = subscriber.email
            message['X-Auto-Response-Suppress'] = 'OOF, AutoReply'
            message['Precedence'] = 'bulk'
            message['X-Priority'] = '3'
            message['X-MSMail-Priority'] = 'Normal'
            
            # Create the HTML/plain-text alternative part
            alt_part = MIMEMultipart('alternative')
            
            # Add plain text part
            print("Adding plain text content...")
            text_content = email.content
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            alt_part.attach(text_part)
            
            # Use the stored HTML content but replace data URI with CID for the logo
            print("Creating HTML content with logo...")
            html_content = re.sub(
                r'data:image/png;base64,[^"]*',
                'cid:logo@asiancrossroads',
                email.html_content
            )
            html_part = MIMEText(html_content, 'html', 'utf-8')
            alt_part.attach(html_part)
            message.attach(alt_part)
            
            # Attach the logo image as an inline attachment for CID reference
            try:
                logo_path = os.path.join(settings.BASE_DIR, 'assets', 'logo.png')
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                logo_img = MIMEImage(logo_data, _subtype="png")
                logo_img.add_header('Content-ID', '<logo@asiancrossroads>')
                logo_img.add_header('Content-Disposition', 'inline', filename="logo.png")
                message.attach(logo_img)
            except Exception as e:
                print(f"Error attaching inline logo: {str(e)}")
            
            # Add additional attachments if any
            if email.has_attachments and email.attachments:
                print(f"Processing {len(email.attachments)} attachments")
                for attachment_meta in email.attachments:
                    try:
                        print(f"Processing attachment: {attachment_meta['filename']}")
                        attachment_id = attachment_meta['attachment_id']
                        message_id_length = len(email.original_email_id) + 1
                        attachment_id_only = attachment_meta['attachment_id'][message_id_length:]
                        
                        print(f"Using message_id: {email.original_email_id}")
                        print(f"Using attachment_id: {attachment_id_only}")
                        
                        attachment = service.users().messages().attachments().get(
                            userId='me',
                            messageId=email.original_email_id,
                            id=attachment_id_only
                        ).execute()
                        
                        if attachment and 'data' in attachment:
                            file_data = base64.urlsafe_b64decode(attachment['data'])
                            print(f"Successfully retrieved attachment data, size: {len(file_data)} bytes")
                            
                            main_type, sub_type = attachment_meta['content_type'].split('/', 1)
                            att_part = MIMEBase(main_type, sub_type)
                            att_part.set_payload(file_data)
                            encoders.encode_base64(att_part)
                            
                            att_part.add_header(
                                'Content-Disposition',
                                'attachment',
                                filename=attachment_meta['filename']
                            )
                            message.attach(att_part)
                            print(f"Successfully attached {attachment_meta['filename']}")
                        else:
                            print(f"Warning: No data found in attachment response for {attachment_meta['filename']}")
                    except Exception as e:
                        print(f"Error attaching file {attachment_meta['filename']}: {str(e)}")
                        continue
            
            print("Encoding message...")
            try:
                raw_message = base64.urlsafe_b64encode(
                    message.as_bytes()
                ).decode('utf-8')
            except Exception as e:
                print(f"Error encoding message: {str(e)}")
                raise
            
            print("Sending message...")
            try:
                result = service.users().messages().send(
                    userId='me',
                    body={'raw': raw_message}
                ).execute()
                print(f"Successfully sent email to {subscriber.email} (Message ID: {result.get('id')})")
            except Exception as e:
                print(f"Error from Gmail API while sending to {subscriber.email}: {str(e)}")
                continue
            
        except Exception as e:
            print(f"Error processing subscriber {subscriber.email}: {str(e)}")
            continue
    
    # Update email status
    print("\nUpdating email status...")
    email.sent_at = timezone.now()
    email.save()
    print("=== Email sending process completed ===\n")
