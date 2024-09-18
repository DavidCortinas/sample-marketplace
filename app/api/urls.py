from django.urls import path, include
from . import views
from backend.views.user_views import get_genres
from backend.views.onboarding_views import complete_onboarding

urlpatterns = [
    path('spotify/', include('api.spotify.urls')),
    path('check-email-verification/', views.check_email_verification, name='check_email_verification'),
    path('genres/', get_genres, name='get_genres'),
    path('complete-onboarding/', complete_onboarding, name='complete_onboarding'),
]
