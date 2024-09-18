import base64
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import json


@method_decorator(csrf_exempt, name="dispatch")
class SpotifyClientCredentialsView(View):
    def get(self, request, *args, **kwargs):
        try:
            access_token, expires_in = self.get_client_credentials_token()
            cache.set("spotify_client_token", access_token, expires_in - 60)
            return JsonResponse(
                {"access_token": access_token, "expires_in": expires_in}
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def get_client_credentials_token(self):
        client_id = settings.SPOTIFY_CLIENT_ID
        client_secret = settings.SPOTIFY_CLIENT_SECRET

        auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {"grant_type": "client_credentials"}

        response = requests.post(
            "https://accounts.spotify.com/api/token", headers=headers, data=data
        )

        if response.status_code == 200:
            token_info = response.json()
            return token_info["access_token"], token_info["expires_in"]
        else:
            raise Exception(
                f"Failed to obtain token: {response.status_code} - {response.text}"
            )


@method_decorator(csrf_exempt, name="dispatch")
class SpotifyRecommendationsView(View):
    def get(self, request, *args, **kwargs):
        try:
            access_token = self.get_access_token()

            # Get seed parameters
            seed_artists = request.GET.get("seed_artists", "")
            seed_genres = request.GET.get("seed_genres", "")
            seed_tracks = request.GET.get("seed_tracks", "")
            limit = request.GET.get("limit", "100")

            # Process advanced parameters
            advanced_params = request.GET.get("advanced_params", "{}")
            advanced_params = json.loads(advanced_params)

            # Prepare headers and params for the Spotify API request
            headers = {
                "Authorization": f"Bearer {access_token}",
            }
            params = {
                "seed_artists": seed_artists,
                "seed_genres": seed_genres,
                "seed_tracks": seed_tracks,
                "limit": limit,
            }

            # Add advanced parameters to the request
            for param, values in advanced_params.items():
                if values.get("enabled", False):
                    if "min" in values:
                        params[f"min_{param}"] = values["min"]
                    if "max" in values:
                        params[f"max_{param}"] = values["max"]
                    params[f"target_{param}"] = values["target"]

            # Make the request to Spotify API
            response = requests.get(
                "https://api.spotify.com/v1/recommendations",
                headers=headers,
                params=params,
            )

            if response.status_code == 200:
                data = response.json()
                track_uris = [track["uri"] for track in data["tracks"]]
                return JsonResponse(
                    {
                        "track_uris": track_uris,
                        "full_response": data,
                    }
                )
            else:
                return JsonResponse(
                    {
                        "error": f"Spotify API error: {response.status_code} - {response.text}"
                    },
                    status=response.status_code,
                )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def get_access_token(self):
        token = cache.get("spotify_client_token")
        if not token:
            credentials_view = SpotifyClientCredentialsView()
            token_data = credentials_view.get_client_credentials_token()
            token, expires_in = token_data
            cache.set(
                "spotify_client_token", token, expires_in - 60
            )  # Cache for slightly less than the expiry time
        return token
