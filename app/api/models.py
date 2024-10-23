from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Song(models.Model):
    title = models.CharField(max_length=255)
    artists = models.JSONField()
    spotify_id = models.CharField(max_length=255, unique=True)
    isrc = models.CharField(max_length=12, unique=True, db_index=True)
    image = models.URLField()

    def __str__(self):
        return f"{self.title} - {', '.join(artist['name'] for artist in self.artists)}"


class Playlist(models.Model):
    name = models.CharField(max_length=255)
    spotify_id = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="playlists")
    songs = models.ManyToManyField(Song, through="PlaylistSong")
    snapshot_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ("user", "spotify_id")


class PlaylistSong(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    added_on = models.DateTimeField(auto_now_add=True)
    removed_on = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.song.title} in {self.playlist.name}"

    class Meta:
        ordering = ["order"]
        unique_together = ["playlist", "song"]
