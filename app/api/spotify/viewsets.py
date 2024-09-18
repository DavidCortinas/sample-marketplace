from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from backend.models import Query
from .serializers import QuerySerializer

class QueryViewSet(viewsets.ModelViewSet):
    serializer_class = QuerySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Query.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
