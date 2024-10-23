from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from api.models import Playlist
from django.core.serializers import serialize

@login_required
def check_email_verification(request):
    return JsonResponse({'emailVerified': request.user.email_verified})


@login_required
def get_playlists(request):
    playlists = Playlist.objects.filter(user=request.user)
    playlists_data = serialize("json", playlists)
    return JsonResponse({"playlists": playlists_data}, safe=False)
