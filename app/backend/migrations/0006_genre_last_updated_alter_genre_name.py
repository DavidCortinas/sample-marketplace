# Generated by Django 4.2.16 on 2024-09-17 02:40

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0005_userprofile_username_alter_userprofile_profession_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="genre",
            name="last_updated",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="genre",
            name="name",
            field=models.CharField(max_length=100, unique=True),
        ),
    ]
