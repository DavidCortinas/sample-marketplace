from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    AuthStatusView,
    UserDetailsView,
    google_callback,
)
from .auth_views import resend_verification_email

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("user/details/", UserDetailsView.as_view(), name="user-details"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("status/", AuthStatusView.as_view(), name="auth_status"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(
        "resend-verification-email/",
        resend_verification_email,
        name="resend_verification_email",
    ),
    path("google/callback/", google_callback, name="google_callback"),
]
