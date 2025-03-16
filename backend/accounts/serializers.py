from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.files.base import ContentFile
import base64
import uuid

User = get_user_model()

class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            try:
                # Get the format and the actual base64 content
                format, imgstr = data.split(';base64,')
                ext = format.split('/')[-1]
                
                # Generate a unique filename
                filename = f"{uuid.uuid4()}.{ext}"
                
                # Convert base64 to file content
                data = ContentFile(base64.b64decode(imgstr), name=filename)
            except Exception:
                return None
        return super().to_internal_value(data)

class UserSerializer(serializers.ModelSerializer):
    profile_picture = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'graduating_year', 'major', 'description',
            'profile_picture', 'title', 'role', 'is_main'
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return attrs

        # If trying to edit an admin user, don't allow any changes to role
        if self.instance and self.instance.role == 'ADMIN':
            attrs.pop('role', None)
            return attrs

        # Only admin and president can change roles
        if 'role' in attrs:
            if not (request.user.role == 'ADMIN' or request.user.role == 'PRESIDENT'):
                attrs.pop('role')
            elif attrs['role'] not in ['BOARD', 'PRESIDENT']:
                raise serializers.ValidationError({"role": "Invalid role selected."})
            elif request.user.role == 'PRESIDENT' and attrs['role'] == 'PRESIDENT':
                raise serializers.ValidationError({"role": "Only admins can assign the PRESIDENT role."})

        return attrs

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    profile_picture = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'graduating_year',
            'major', 'description', 'profile_picture', 'title',
            'role'
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'graduating_year': {'required': True},
            'major': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if not attrs['email'].endswith('@yale.edu'):
            raise serializers.ValidationError({"email": "Must use a Yale email address."})
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.role != 'ADMIN' and attrs.get('role') not in ['BOARD']:
                raise serializers.ValidationError({"role": "You can only create board members."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        password = validated_data.pop('password', None)
        
        user = User(**validated_data)
        if password:
            user.set_password(password)
        
        user.save()
        return user

class AdminUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ('is_active',)
        read_only_fields = ('id',)

    def update(self, instance, validated_data):
        # Handle profile picture update
        if 'profile_picture' in validated_data:
            instance.profile_picture = validated_data.pop('profile_picture')
        return super().update(instance, validated_data) 