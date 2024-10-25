from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from api.models import Playlist
from django.core.serializers import serialize
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Playlist, Song
from .serializers import PlaylistSerializer, SongSerializer
from .spotify.views import SpotifyPlaylistsView

@login_required
def check_email_verification(request):
    return JsonResponse({'emailVerified': request.user.email_verified})


@login_required
def get_playlists(request):
    playlists = Playlist.objects.filter(user=request.user)
    playlists_data = serialize("json", playlists)
    return JsonResponse({"playlists": playlists_data}, safe=False)

class PlaylistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        playlists = Playlist.objects.filter(user=request.user)
        serializer = PlaylistSerializer(playlists, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PlaylistSerializer(data=request.data)
        if serializer.is_valid():
            name = serializer.validated_data['name']
            description = serializer.validated_data.get('description', '')

            # Create playlist on Spotify
            spotify_playlist = SpotifyPlaylistsView.create_spotify_playlist(request.user, name, description)

            if spotify_playlist:
                # Create playlist locally
                playlist = serializer.save(user=request.user, spotify_id=spotify_playlist['id'])
                return Response(PlaylistSerializer(playlist).data, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to create playlist on Spotify'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PlaylistSongView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, playlist_id):
        try:
            playlist = Playlist.objects.get(id=playlist_id, user=request.user)
        except Playlist.DoesNotExist:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SongSerializer(data=request.data)
        if serializer.is_valid():
            song_uri = serializer.validated_data['spotify_uri']
            song_name = serializer.validated_data['name']
            artist_name = serializer.validated_data['artist']

            # Add song to Spotify playlist
            success = SpotifyPlaylistsView.add_song_to_spotify_playlist(request.user, playlist.spotify_id, song_uri)

            if success:
                # Check if song exists locally, if not create it
                song, created = Song.objects.get_or_create(
                    spotify_uri=song_uri,
                    defaults={'name': song_name, 'artist': artist_name}
                )

                # Add song to local playlist
                playlist.songs.add(song)

                return Response(SongSerializer(song).data, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to add song to Spotify playlist'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
