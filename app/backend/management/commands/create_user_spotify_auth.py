from django.core.management.base import BaseCommand
from django.utils import timezone
from backend.models import CustomUser, UserSpotifyAuth

class Command(BaseCommand):
    help = 'Creates UserSpotifyAuth for users without one'

    def handle(self, *args, **options):
        users_without_spotify_auth = CustomUser.objects.filter(spotify_auth__isnull=True)
        for user in users_without_spotify_auth:
            UserSpotifyAuth.objects.create(
                user=user,
                access_token='',
                refresh_token='',
                expires_at=timezone.now()
            )
            self.stdout.write(self.style.SUCCESS(f'Created UserSpotifyAuth for user {user.email}'))
