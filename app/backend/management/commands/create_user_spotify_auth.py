from django.core.management.base import BaseCommand
from django.utils import timezone
from backend.models import CustomUser, MusicServiceConnection


class Command(BaseCommand):
    help = "Creates MusicServiceConnection for Spotify for users without one"

    def handle(self, *args, **options):
        users_without_spotify_connection = CustomUser.objects.exclude(
            music_service_connections__service_name="spotify"
        )
        for user in users_without_spotify_connection:
            MusicServiceConnection.objects.create(
                user=user,
                service_name="spotify",
                is_connected=False,
                last_connected=None,
                access_token="",
                refresh_token="",
                token_expires_at=timezone.now(),
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created Spotify MusicServiceConnection for user {user.email}"
                )
            )
