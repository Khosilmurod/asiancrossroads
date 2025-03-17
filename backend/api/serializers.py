from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TeamMember, Event, Article, MailingListSubscriber, IncomingEmail
from accounts.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    spots_left = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    has_ended = serializers.BooleanField(read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'venue', 'registration_link', 'cover_image', 'category',
            'capacity', 'current_registrations', 'spots_left', 'is_full',
            'has_ended', 'created_by', 'created_by_name', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'current_registrations']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None

    def validate(self, data):
        if 'end_date' in data and data['end_date'] and data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data

class ArticleSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author', 'image', 'published_date', 'is_published']

class MailingListSubscriberSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    subscribed_at = serializers.DateTimeField(read_only=True)
    is_active = serializers.BooleanField(default=True, read_only=True)
    
    class Meta:
        model = MailingListSubscriber
        fields = ['id', 'email', 'first_name', 'last_name', 'university', 
                 'interests', 'is_student', 'subscribed_at', 'is_active']
        read_only_fields = ['id', 'subscribed_at', 'is_active']
        
    def validate_email(self, value):
        # Check if email already exists for active subscribers
        existing = MailingListSubscriber.objects.filter(email=value, is_active=True).first()
        if existing:
            print(f"Email {value} already exists and is active")  # Debug print
            raise serializers.ValidationError("This email is already subscribed to our mailing list.")
        return value.lower()  # Store emails in lowercase

    def validate(self, data):
        print(f"Validating subscription data: {data}")  # Debug print
        # Ensure required fields are present
        required_fields = ['email', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                raise serializers.ValidationError(f"{field} is required")
        return data

    def create(self, validated_data):
        print(f"Creating subscriber with data: {validated_data}")  # Debug print
        try:
            return super().create(validated_data)
        except Exception as e:
            print(f"Error creating subscriber: {str(e)}")  # Debug print
            raise

class IncomingEmailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = IncomingEmail
        fields = [
            'id', 'sender_email', 'subject', 'content', 'html_content',
            'received_at', 'status', 'status_display', 'approved_by',
            'approved_by_name', 'approved_at', 'sent_at', 'has_attachments',
            'attachments'
        ]
        read_only_fields = [
            'sender_email', 'subject', 'content', 'html_content',
            'received_at', 'approved_by', 'approved_at', 'sent_at',
            'has_attachments', 'attachments'
        ]
