from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from backend.models import Genre


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_genres(request):
    print(f"Auth header: {request.META.get('HTTP_AUTHORIZATION')}")
    print(f"User: {request.user}")
    genres = Genre.objects.values_list("name", flat=True)
    return Response(list(genres))
