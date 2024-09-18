from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import UserPreferredGenre, UserProfile, Genre
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    try:
        user = request.user
        data = request.data

        # Extract data from the request
        username = data.get('username')
        birthdate = data.get('birthdate')
        user_type = data.get('user_type')
        profession = data.get('profession')
        preferred_genres = data.getlist('preferred_genres')
        profile_image = request.FILES.get('profile_image')

        # Update user profile
        profile, created = UserProfile.objects.get_or_create(user=user)

        if username:
            profile.username = username
        if birthdate:
            profile.birthdate = birthdate
        if user_type:
            profile.user_type = user_type
        if profession:
            profile.profession = profession

        # Handle profile image
        if profile_image:
            # Generate a unique filename
            file_name = f'profile_image_{user.id}{os.path.splitext(profile_image.name)[1]}'
            file_path = default_storage.save(f'profile_images/{file_name}', ContentFile(profile_image.read()))
            profile.profile_image = file_path

        profile.save()

        # Handle preferred genres
        if preferred_genres:
            # Clear existing preferred genres
            UserPreferredGenre.objects.filter(user=user).delete()

            # Add new preferred genres
            for genre_name in preferred_genres:
                genre, _ = Genre.objects.get_or_create(name=genre_name)
                UserPreferredGenre.objects.create(user=user, genre=genre)

        user.onboarding_completed = True
        user.save()

        return Response({'message': 'Onboarding completed successfully'}, status=status.HTTP_200_OK)

    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(traceback.format_exc())
        # Return a JSON response even for unexpected errors
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
