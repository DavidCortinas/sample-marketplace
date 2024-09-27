from rest_framework import serializers
from backend.models import Query

class QuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Query
        fields = ['id', 'name', 'parameters', 'recommendations', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        # Remove 'user' from validated_data if it's present
        validated_data.pop('user', None)
        return Query.objects.create(user=user, **validated_data)
