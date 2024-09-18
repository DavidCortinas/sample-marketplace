from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "is_active",
            "date_joined",
            "email_verified",
            "onboarding_completed",
        ]

    def to_representation(self, instance):
        print("to_representation called")
        data = super().to_representation(instance)
        print("Serialized data in serializer:", data)
        return data

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("UserSerializer initialized")
