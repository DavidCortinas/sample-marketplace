# Generated by Django 4.2.16 on 2024-09-27 02:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0009_musicserviceconnection_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="query",
            name="recommendations",
            field=models.JSONField(default=list),
        ),
    ]