from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpotifyClientCredentialsView, SpotifyRecommendationsView, SpotifyPlaylistsView
from .viewsets import QueryViewSet
from backend.views import spotify_auth

router = DefaultRouter()
router.register(r'queries', QueryViewSet, basename='query')

urlpatterns = [
    path(
        "auth/client-credentials/",
        SpotifyClientCredentialsView.as_view(),
        name="spotify_client_credentials",
    ),
    path(
        "recommendations/",
        SpotifyRecommendationsView.as_view(),
        name="spotify_recommendations",
    ),
    path("playlists/", SpotifyPlaylistsView.as_view(), name="spotify_playlists"),
    path(
        "playlists/<str:playlist_id>/",
        SpotifyPlaylistsView.as_view(),
        name="spotify_playlist_detail",
    ),
    path(
        "playlists/<str:playlist_id>/tracks/",
        SpotifyPlaylistsView.as_view(),
        name="spotify_playlist_tracks",
    ),
    path("authorize/", spotify_auth.spotify_authorize, name="spotify_authorize"),
    path("callback/", spotify_auth.spotify_callback, name="spotify_callback"),
    path("", include(router.urls)),  # Include the router URLs
]
