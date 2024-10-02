import base64
import requests
import ast
import json
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from ..custom_auth import DebugJWTAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.authentication import get_authorization_header
import logging
from backend.models import MusicServiceConnection
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class SpotifyClientCredentialsView(View):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

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

    def make_spotify_request(self, request, url, method="GET", params=None, data=None):
        try:
            music_service = MusicServiceConnection.objects.get(
                user=request.user, service_name="spotify"
            )
        except ObjectDoesNotExist:
            logger.error(f"No Spotify connection found for user {request.user}")
            return Response(
                {"error": "No Spotify connection found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        access_token = music_service.access_token
        logger.info(f"Initial access token: {access_token[:10]}...")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        logger.info(f"Making Spotify request to {url}")
        logger.debug(f"Headers: {headers}")
        logger.debug(f"Params: {params}")
        logger.debug(f"Data: {data}")

        response = requests.request(
            method, url, headers=headers, params=params, data=data
        )

        logger.info(f"Spotify API response status: {response.status_code}")
        logger.debug(f"Spotify API response content: {response.text}")

        if response.status_code == 401:
            logger.info("Access token expired. Attempting to refresh...")
            try:
                refresh_token = music_service.refresh_token
                new_token_info = self.refresh_access_token(refresh_token)
                new_access_token = new_token_info["access_token"]

                # Update the MusicServiceConnection with the new token
                music_service.access_token = new_access_token
                music_service.save()

                # Retry the request with the new token
                headers["Authorization"] = f"Bearer {new_access_token}"
                response = requests.request(
                    method, url, headers=headers, params=params, data=data
                )

                logger.info(f"Retried request status: {response.status_code}")
                logger.debug(f"Retried request content: {response.text}")
            except Exception as e:
                logger.error(f"Failed to refresh token: {str(e)}")
                return Response(
                    {"error": "Failed to refresh access token"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        return response


class SpotifyUserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spotify_client = SpotifyClientCredentialsView()

    def get(self, request):
        try:
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
    authentication_classes = [DebugJWTAuthentication]
    permission_classes = [IsAuthenticated]  # Uncomment this line

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spotify_client = SpotifyClientCredentialsView()
        self.user_detail_view = SpotifyUserDetailView()

    def get(self, request, playlist_id=None):
        if playlist_id:
            return self.get_playlist(request, playlist_id)
        return self.get_playlists(request)

    def post(self, request, playlist_id=None):
        if playlist_id:
            return self.add_items_to_playlist(request, playlist_id)
        return self.create_playlist(request)

    def put(self, request, playlist_id):
        return self.reorder_playlist_items(request, playlist_id)

    def delete(self, request, playlist_id):
        action = request.query_params.get("action")
        if action == "remove_items":
            return self.remove_items_from_playlist(request, playlist_id)
        return self.unfollow_playlist(request, playlist_id)

    def get_playlists(self, request):
        try:
            user_response = self.user_detail_view.get(request)
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

    def get_playlist(self, request, playlist_id):
        logger.info(f"Getting specific playlist: {playlist_id}")
        try:
            response = self.spotify_client.make_spotify_request(
                request,
                f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
            )

            logger.debug(f"Playlist response: {response.status_code} - {response.text}")

            if response.status_code == 200:
                playlist_data = response.json()
                logger.info(f"Successfully retrieved playlist: {playlist_id}")
                return Response(playlist_data)
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

    def post(self, request, *args, **kwargs):
        logger.info("SpotifyPlaylistsView.post method called")
        logger.debug(f"Request user: {request.user}")
        logger.debug(f"Request data: {request.data}")

        try:
            # Get the user's Spotify ID
            user_response = self.user_detail_view.get(request)
            if user_response.status_code != 200:
                logger.error(f"Failed to get user details: {user_response.data}")
                return user_response

            user_id = user_response.data.get("id")

            # Prepare the request data
            playlist_data = {
                "name": request.data.get("name", "New Playlist"),
                "description": request.data.get("description", ""),
                "public": request.data.get("public", True),
            }

            # Create the playlist
            response = self.spotify_client.make_spotify_request(
                request,
                f"https://api.spotify.com/v1/users/{user_id}/playlists",
                method="POST",
                data=json.dumps(playlist_data),
            )

            logger.debug(
                f"Create playlist response: {response.status_code} - {response.text}"
            )

            if response.status_code == 201:
                logger.info("Successfully created playlist")
                return Response(response.json(), status=status.HTTP_201_CREATED)
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
            logger.exception("An error occurred while creating the playlist")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def add_items_to_playlist(self, request, playlist_id, *args, **kwargs):
        logger.info(f"Adding items to playlist: {playlist_id}")
        logger.debug(f"Request data: {request.data}")

        try:
            uris = request.data.get("uris", [])
            position = request.data.get("position")

            data = {"uris": uris}
            if position is not None:
                data["position"] = position

            response = self.spotify_client.make_spotify_request(
                request,
                f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                method="POST",
                data=json.dumps(data),
            )

            logger.debug(
                f"Add items response: {response.status_code} - {response.text}"
            )

            if response.status_code == 201:
                logger.info("Successfully added items to playlist")
                return Response(response.json(), status=status.HTTP_201_CREATED)
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
            logger.exception("An error occurred while adding items to the playlist")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def reorder_playlist_items(self, request, playlist_id, *args, **kwargs):
        logger.info(f"Reordering items in playlist: {playlist_id}")
        logger.debug(f"Request data: {request.data}")

        try:
            data = {
                "range_start": request.data.get("range_start"),
                "insert_before": request.data.get("insert_before"),
                "range_length": request.data.get("range_length", 1),
                "snapshot_id": request.data.get("snapshot_id"),
            }

            response = self.spotify_client.make_spotify_request(
                request,
                f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                method="PUT",
                data=json.dumps(data),
            )

            logger.debug(
                f"Reorder items response: {response.status_code} - {response.text}"
            )

            if response.status_code == 200:
                logger.info("Successfully reordered playlist items")
                return Response(response.json(), status=status.HTTP_200_OK)
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
            logger.exception("An error occurred while reordering playlist items")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def remove_items_from_playlist(self, request, playlist_id, *args, **kwargs):
        logger.info(f"Removing items from playlist: {playlist_id}")
        logger.debug(f"Request data: {request.data}")

        try:
            data = {
                "tracks": request.data.get("tracks", []),
                "snapshot_id": request.data.get("snapshot_id"),
            }

            response = self.spotify_client.make_spotify_request(
                request,
                f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                method="DELETE",
                data=json.dumps(data),
            )

            logger.debug(
                f"Remove items response: {response.status_code} - {response.text}"
            )

            if response.status_code == 200:
                logger.info("Successfully removed items from playlist")
                return Response(response.json(), status=status.HTTP_200_OK)
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
            logger.exception("An error occurred while removing items from the playlist")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def unfollow_playlist(self, request, playlist_id=None, *args, **kwargs):
        if not playlist_id:
            return Response(
                {"error": "Playlist ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(
            f"SpotifyPlaylistsView.delete method called for playlist_id: {playlist_id}"
        )
        logger.debug(f"Request user: {request.user}")
        logger.debug(f"Request auth: {request.auth}")
        logger.debug(f"Request headers: {request.headers}")

        try:
            # Unfollow (delete) the playlist
            response = self.spotify_client.make_spotify_request(
                request,
                f"https://api.spotify.com/v1/playlists/{playlist_id}/followers",
                method="DELETE",
            )

            logger.debug(
                f"Unfollow playlist response: {response.status_code} - {response.text}"
            )

            if response.status_code == 200:
                logger.info(f"Successfully unfollowed playlist: {playlist_id}")
                return Response(
                    {"message": "Playlist successfully unfollowed"},
                    status=status.HTTP_200_OK,
                )
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
            logger.exception("An error occurred while processing the unfollow request")
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
