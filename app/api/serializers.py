from rest_framework import serializers
from .models import Song, Playlist, PlaylistSong


class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artists", "spotify_id", "isrc", "image"]


class PlaylistSongSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)

    class Meta:
        model = PlaylistSong
        fields = ["id", "song", "order", "added_on", "removed_on"]


class PlaylistSerializer(serializers.ModelSerializer):
    songs = PlaylistSongSerializer(source="playlistsong_set", many=True, read_only=True)

    class Meta:
        model = Playlist
        fields = [
            "id",
            "name",
            "spotify_id",
            "user",
            "songs",
            "snapshot_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "user",
            "spotify_id",
            "snapshot_id",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        user = self.context["request"].user
        return Playlist.objects.create(user=user, **validated_data)
