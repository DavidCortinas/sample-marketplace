from django.core.management.base import BaseCommand
from backend.models import CustomUser, UserProfile

class Command(BaseCommand):
    help = 'Creates user profiles for users without one'

    def handle(self, *args, **options):
        users_without_profile = CustomUser.objects.filter(profile__isnull=True)
        for user in users_without_profile:
            UserProfile.objects.create(user=user)
            self.stdout.write(self.style.SUCCESS(f'Created profile for user {user.email}'))
