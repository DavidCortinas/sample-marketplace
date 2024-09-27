import base64
import requests
import json
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging
from backend.models import MusicServiceConnection
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class SpotifyClientCredentialsView(View):
    TOKEN_URL = "https://accounts.spotify.com/api/token"
    CACHE_KEY = "spotify_client_token"
    MAX_RETRIES = 1

    def get(self, request, *args, **kwargs):
        try:
            access_token = self.get_access_token()
            return JsonResponse({"access_token": access_token})
        except Exception as e:
            logger.error(f"Error getting Spotify access token: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)

    def get_access_token(self):
        token = cache.get(self.CACHE_KEY)
        if token:
            logger.info(f"Retrieved token from cache: {token[:10]}...")
            return token

        logger.info("Token not found in cache, fetching new token")
        token_info = self.get_client_credentials_token()
        access_token = token_info["access_token"]
        expires_in = token_info["expires_in"]
        cache.set(self.CACHE_KEY, access_token, expires_in - 60)
        return access_token

    def get_client_credentials_token(self):
        logger.info("get_client_credentials_token method called")
        client_id = settings.SPOTIFY_CLIENT_ID
        client_secret = settings.SPOTIFY_CLIENT_SECRET

        auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {"grant_type": "client_credentials"}

        logger.debug(f"Requesting new token with headers: {headers} and data: {data}")

        try:
            response = requests.post(self.TOKEN_URL, headers=headers, data=data)
            logger.debug(f"Token request response status: {response.status_code}")
            logger.debug(f"Token request response content: {response.text}")

            response.raise_for_status()
            token_info = response.json()

            access_token = token_info["access_token"]
            expires_in = token_info["expires_in"]

            logger.info(
                f"New token obtained: {access_token[:10]}... Expires in: {expires_in}"
            )
            cache.set(self.CACHE_KEY, access_token, expires_in - 60)

            return {"access_token": access_token, "expires_in": expires_in}
        except requests.RequestException as e:
            logger.error(f"Error refreshing Spotify token: {str(e)}")
            raise

    def refresh_access_token(self, refresh_token):
        logger.info("refresh_access_token method called")
        client_id = settings.SPOTIFY_CLIENT_ID
        client_secret = settings.SPOTIFY_CLIENT_SECRET

        auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
        }

        logger.debug(f"Refreshing token with headers: {headers} and data: {data}")

        try:
            response = requests.post(self.TOKEN_URL, headers=headers, data=data)
            logger.debug(
                f"Refresh token request response status: {response.status_code}"
            )
            logger.debug(f"Refresh token request response content: {response.text}")

            response.raise_for_status()
            token_info = response.json()

            access_token = token_info["access_token"]
            expires_in = token_info["expires_in"]

            logger.info(
                f"Refreshed token obtained: {access_token[:10]}... Expires in: {expires_in}"
            )
            cache.set(self.CACHE_KEY, access_token, expires_in - 60)

            return {"access_token": access_token, "expires_in": expires_in}
        except requests.RequestException as e:
            logger.error(f"Error refreshing Spotify token: {str(e)}")
            raise

    def make_spotify_request(
        self, request, url, method="GET", params=None, data=None, retries=0
    ):
        try:
            music_service = MusicServiceConnection.objects.get(
                user=request.user,
                service_name='spotify'
            )
        except ObjectDoesNotExist:
            logger.error(f"No Spotify connection found for user {request.user.email}")
            return Response({"error": "Spotify account not connected"}, status=status.HTTP_400_BAD_REQUEST)

        access_token = music_service.access_token
        headers = {"Authorization": f"Bearer {access_token}"}

        logger.info(f"Making Spotify request to {url}")
        logger.debug(f"Headers: {headers}")
        logger.debug(f"Params: {params}")
        logger.debug(f"Data: {data}")

        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            logger.info(f"Spotify API response status: {response.status_code}")
            logger.debug(f"Spotify API response content: {response.text[:200]}...")

            if response.status_code == 401 and retries < self.MAX_RETRIES:
                logger.warning("Access token expired, refreshing...")
                refresh_token = music_service.refresh_token
                if refresh_token:
                    new_token = self.refresh_access_token(refresh_token)
                    if new_token:
                        music_service.access_token = new_token
                        music_service.save()
                        headers["Authorization"] = f"Bearer {new_token}"
                        return self.make_spotify_request(
                            request, url, method, params, data, retries + 1
                        )
                    else:
                        logger.error("Failed to refresh access token")
                        return Response({"error": "Failed to refresh access token"}, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    logger.error("No refresh token available")
                    return Response({"error": "No refresh token available"}, status=status.HTTP_401_UNAUTHORIZED)
            return response
        except requests.RequestException as e:
            logger.error(f"Request to Spotify API failed: {str(e)}")
            return Response(
                {"error": "Failed to communicate with Spotify API"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
class SpotifyUserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spotify_client = SpotifyClientCredentialsView()

    def get(self, request):
        try:
            logger.info("SpotifyUserDetailView.get method called")
            response = self.spotify_client.make_spotify_request(
                request, "https://api.spotify.com/v1/me"
            )
            logger.debug(
                f"Spotify user details response: {response.status_code} - {response.text}"
            )

            if response.status_code == 200:
                user_data = response.json()
                logger.info("Successfully retrieved user profile from Spotify API")
                return Response(user_data)
            else:
                logger.error(
                    f"Spotify API error: {response.status_code} - {response.text}"
                )
                return Response(
                    {
                        "error": f"Spotify API error: {response.status_code} - {response.text}"
                    },
                    status=response.status_code,
                )

        except Exception as e:
            logger.exception("An error occurred while processing the request")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SpotifyPlaylistsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spotify_client = SpotifyClientCredentialsView()
        self.user_detail_view = SpotifyUserDetailView()

    def get(self, request, *args, **kwargs):
        logger.info("SpotifyPlaylistsView.get method called")
        logger.debug(f"Request user: {request.user}")
        logger.debug(f"Request auth: {request.auth}")
        logger.debug(f"Request headers: {request.headers}")

        try:
            # First, get the user's Spotify profile
            user_response = self.user_detail_view.get(request)
            logger.debug(f"User detail response: {user_response.status_code}")
            if user_response.status_code != 200:
                logger.error(f"Failed to get user details: {user_response.data}")
                return user_response

            user_data = user_response.data
            user_id = user_data.get("id", "me")
            logger.info(f"Retrieved user ID: {user_id}")

            # Now proceed with getting the playlists
            limit = request.GET.get("limit", "50")
            offset = request.GET.get("offset", "0")

            params = {
                "limit": limit,
                "offset": offset,
            }

            response = self.spotify_client.make_spotify_request(
                request,
                f"https://api.spotify.com/v1/users/{user_id}/playlists",
                params=params,
            )

            logger.debug(
                f"Playlists response: {response.status_code} - {response.text}"
            )

            if response.status_code == 200:
                playlists_data = response.json()
                logger.info("Successfully retrieved playlists from Spotify API")
                return Response(playlists_data)
            else:
                logger.error(
                    f"Spotify API error: {response.status_code} - {response.text}"
                )
                return Response(
                    {
                        "error": f"Spotify API error: {response.status_code} - {response.text}"
                    },
                    status=response.status_code,
                )

        except Exception as e:
            logger.exception("An error occurred while processing the request")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
            token_info = credentials_view.get_client_credentials_token()
            token = token_info["access_token"]
            expires_in = token_info["expires_in"]
            cache.set(
                "spotify_client_token", token, expires_in - 60
            )  # Cache for slightly less than the expiry time
        return token
