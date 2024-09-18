from django.core.management.base import BaseCommand
from django.conf import settings
import requests
from backend.models import Genre
from api.spotify.views import SpotifyClientCredentialsView
from django.test import RequestFactory
import json

class Command(BaseCommand):
    help = 'Updates genres from Spotify API'

    def get_spotify_token(self):
        # Create a dummy request
        factory = RequestFactory()
        request = factory.get('/dummy-url')

        # Use the SpotifyClientCredentialsView to get the token
        view = SpotifyClientCredentialsView()
        response = view.get(request)
        
        # Parse the JSON content of the response
        response_data = json.loads(response.content)

        if 'access_token' in response_data:
            return response_data['access_token']
        else:
            raise Exception("Failed to obtain Spotify token")

    def handle(self, *args, **options):
        try:
            access_token = self.get_spotify_token()
            url = 'https://api.spotify.com/v1/recommendations/available-genre-seeds'
            headers = {'Authorization': f'Bearer {access_token}'}
            
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                genres = response.json()['genres']
                for genre in genres:
                    Genre.objects.update_or_create(name=genre)
                
                self.stdout.write(self.style.SUCCESS(f'Successfully updated {len(genres)} genres'))
            else:
                self.stdout.write(self.style.ERROR(f'Failed to fetch genres from Spotify: {response.status_code} - {response.text}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error updating genres: {str(e)}'))
