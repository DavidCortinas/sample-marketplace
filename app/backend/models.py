from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    email_verified = models.BooleanField(default=False)
    spotify_id = models.CharField(max_length=255, blank=True, null=True)
    spotify_access_token = models.TextField(blank=True, null=True)
    spotify_refresh_token = models.TextField(blank=True, null=True)
    onboarding_completed = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="profile"
    )
    username = models.CharField(max_length=30, unique=True, null=True, blank=True)
    profile_image = models.ImageField(
        upload_to="profile_images/", null=True, blank=True
    )
    birthdate = models.DateField(null=True, blank=True)
    USER_TYPE_CHOICES = [
        ("fan", "Fan"),
        ("professional", "Professional"),
    ]
    user_type = models.CharField(
        max_length=15, choices=USER_TYPE_CHOICES, default="fan"
    )
    profession = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.username or self.user.email


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class UserSpotifyAuth(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="spotify_auth"
    )
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
    expires_at = models.DateTimeField()


class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class UserPreferredGenre(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="preferred_genres"
    )
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "genre")

    def __str__(self):
        return f"{self.user.email} - {self.genre.name}"


class Query(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="queries"
    )
    name = models.CharField(max_length=255)
    parameters = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.name}"

    class Meta:
        ordering = ["-updated_at"]
        verbose_name_plural = "Queries"
