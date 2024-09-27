from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile, MusicServiceConnection
from django.utils import timezone
from django.db import transaction

@receiver(post_save, sender=CustomUser)
def create_user_profile_and_music_connections(sender, instance, created, **kwargs):
    if created:
        try:
            with transaction.atomic():
                UserProfile.objects.get_or_create(user=instance)
                MusicServiceConnection.objects.get_or_create(
                    user=instance,
                    service_name='spotify',
                    defaults={
                        'is_connected': False,
                        'last_connected': None,
                        'access_token': '',
                        'refresh_token': '',
                        'token_expires_at': timezone.now()
                    }
                )
        except Exception as e:
            print(f"Error creating profile or music service connection for user {instance.id}: {str(e)}")
