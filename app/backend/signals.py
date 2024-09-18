from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile, UserSpotifyAuth
from django.utils import timezone

@receiver(post_save, sender=CustomUser)
def create_user_profile_and_spotify_auth(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        UserSpotifyAuth.objects.create(
            user=instance,
            access_token='',
            refresh_token='',
            expires_at=timezone.now()
        )

@receiver(post_save, sender=CustomUser)
def save_user_profile_and_spotify_auth(sender, instance, **kwargs):
    instance.profile.save()
    instance.spotify_auth.save()
