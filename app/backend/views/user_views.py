from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from backend.models import Genre


@permission_classes([AllowAny])
@api_view(["GET"])
def get_genres(request):
    genres = Genre.objects.values_list("name", flat=True)
    return Response(list(genres))
