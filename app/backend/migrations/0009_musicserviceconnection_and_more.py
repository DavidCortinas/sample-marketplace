# Generated by Django 4.2.16 on 2024-09-25 13:41

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0008_customuser_spotify_expires_in"),
    ]

    operations = [
        migrations.CreateModel(
            name="MusicServiceConnection",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("service_name", models.CharField(max_length=50)),
                ("is_connected", models.BooleanField(default=False)),
                ("last_connected", models.DateTimeField(blank=True, null=True)),
                (
                    "service_user_id",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                ("access_token", models.TextField(blank=True, null=True)),
                ("refresh_token", models.TextField(blank=True, null=True)),
                ("token_expires_at", models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.RemoveField(
            model_name="customuser",
            name="spotify_access_token",
        ),
        migrations.RemoveField(
            model_name="customuser",
            name="spotify_expires_in",
        ),
        migrations.RemoveField(
            model_name="customuser",
            name="spotify_id",
        ),
        migrations.RemoveField(
            model_name="customuser",
            name="spotify_refresh_token",
        ),
        migrations.DeleteModel(
            name="UserSpotifyAuth",
        ),
        migrations.AddField(
            model_name="musicserviceconnection",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="music_service_connections",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterUniqueTogether(
            name="musicserviceconnection",
            unique_together={("user", "service_name")},
        ),
    ]
