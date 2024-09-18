import os
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import requests
from urllib.parse import urlencode
from ..models import CustomUser, UserProfile
import json


@csrf_exempt
@require_http_methods(["POST"])
def spotify_authorize(request):
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    redirect_uri = os.environ.get("SPOTIFY_REDIRECT_URI")
    scope = "user-read-email playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-read user-follow-modify user-library-read user-library-modify"

    params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": scope,
        "show_dialog": "true",
    }
    print("redirect_uri", redirect_uri)

    authorization_url = f"https://accounts.spotify.com/authorize?{urlencode(params)}"
    return JsonResponse({"authorization_url": authorization_url})


@csrf_exempt
@require_http_methods(["POST"])
def spotify_callback(request):
    try:
        data = json.loads(request.body)
        code = data.get("code")
        user_id = data.get("user_id")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not code or not user_id:
        return JsonResponse({"error": "Missing code or user_id"}, status=400)

    token_url = "https://accounts.spotify.com/api/token"
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    redirect_uri = os.environ.get("SPOTIFY_REDIRECT_URI")

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret,
    }

    response = requests.post(token_url, data=payload)
    if response.status_code != 200:
        return JsonResponse({"error": "Failed to exchange code for token"}, status=400)

    tokens = response.json()

    # Get user profile from Spotify
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    profile_response = requests.get("https://api.spotify.com/v1/me", headers=headers)
    if profile_response.status_code != 200:
        return JsonResponse({"error": "Failed to fetch Spotify profile"}, status=400)

    spotify_profile = profile_response.json()

    # Update user model with Spotify info
    try:
        user = CustomUser.objects.get(id=user_id)
        user.spotify_id = spotify_profile["id"]
        user.spotify_access_token = tokens["access_token"]
        user.spotify_refresh_token = tokens["refresh_token"]

        try:
            profile = user.profile
            if (
                profile.username
                and profile.birthdate
                and profile.user_type
                and (profile.user_type != "professional" or profile.profession)
            ):
                user.onboarding_completed = True
            else:
                user.onboarding_completed = False
        except UserProfile.DoesNotExist:
            user.onboarding_completed = False

        user.save()
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    return JsonResponse({"success": True})
