from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.providers.oauth2.views import OAuth2LoginView
from allauth.socialaccount.helpers import complete_social_login
from dj_rest_auth.registration.views import SocialLoginView
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate, login, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from backend.models import CustomUser
from allauth.account.models import EmailAddress
import logging
import json
from django.http import JsonResponse, HttpResponseRedirect
from allauth.socialaccount.models import SocialApp
import jwt
import traceback
from django.db import IntegrityError
from allauth.account.utils import user_email, user_field, user_username

logger = logging.getLogger(__name__)

User = get_user_model()


@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"success": "CSRF cookie set"})


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if CustomUser.objects.filter(email=email).exists():
            logger.info(f"Registration attempt with existing email: {email}")
            return JsonResponse(
                {"success": False, "error": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.create_user(email=email, password=password)
        if user:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            verification_url = request.build_absolute_uri(
                reverse("verify_email", kwargs={"uidb64": uid, "token": token})
            )

            send_mail(
                "Verify your email for AUDAFACT",
                f"Please click the following link to verify your email: {verification_url}",
                "noreply@audafact.com",
                [user.email],
                fail_silently=False,
            )

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            logger.info(f"New user registered: {email}")
            response_data = {
                "success": True,
                "message": "Registration successful",
                "access": access_token,
                "refresh": refresh_token,
            }

            return JsonResponse(response_data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Registration failed for email: {email}")
            return JsonResponse(
                {"success": False, "error": "Registration failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(request, username=email, password=password)

        if user:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            logger.info(f"User logged in: {email}")

            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "message": "Login successful",
                    "onboarding_required": not user.onboarding_completed,
                },
                status=status.HTTP_200_OK,
            )
        logger.warning(f"Failed login attempt for email: {email}")
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


class CustomGoogleOAuth2Adapter(GoogleOAuth2Adapter):
    def complete_login(self, request, app, token, **kwargs):
        try:
            login = super().complete_login(request, app, token, **kwargs)
            return login
        except Exception as e:
            logger.error(f"Error in complete_login: {str(e)}", exc_info=True)
            raise


@method_decorator(csrf_exempt, name="dispatch")
class GoogleAuth(SocialLoginView):
    adapter_class = CustomGoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = f"{settings.FRONTEND_URL}/api/auth/google/callback"

    def post(self, request, *args, **kwargs):
        try:
            provider = self.adapter_class(request).get_provider()
            app = SocialApp.objects.get(provider=provider.id)

            client = self.client_class(
                request,
                app.client_id,
                app.secret,
                self.adapter_class.access_token_url,
                self.adapter_class.authorize_url,
                self.callback_url,
            )

            scopes = ["profile", "email"]

            redirect_data = client.get_redirect_url(
                self.adapter_class.authorize_url, scopes, provider.get_auth_params()
            )

            logger.info("Google auth redirect URL generated successfully")
            return JsonResponse({"auth_url": redirect_data})

        except SocialApp.DoesNotExist:
            logger.error("Google authentication is not properly configured")
            return JsonResponse(
                {"error": "Google authentication is not properly configured"},
                status=400,
            )

        except Exception as e:
            logger.error(
                f"Unexpected error during Google auth: {str(e)}", exc_info=True
            )
            return JsonResponse({"error": "An unexpected error occurred"}, status=500)

    def complete_login(self, request, app, token, **kwargs):
        try:
            login = super().complete_login(request, app, token, **kwargs)
            return login
        except Exception as e:
            logger.error(f"Error in complete_login: {str(e)}", exc_info=True)
            return None


class UserDetailsView(APIView):
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        try:
            data = dict(serializer.data)
        except Exception as e:
            logger.error(f"Error accessing serializer data: {str(e)}", exc_info=True)
            data = {}

        return Response(
            {
                "status": "success",
                "message": "User details retrieved successfully",
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        print(f"Received logout request with headers: {request.headers}")
        print(f"Received logout request with body: {request.data}")
        
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User logged out: {request.user.email}")
            response = Response(
                {"detail": "Successfully logged out."}, status=status.HTTP_200_OK
            )
            print(f"Sending response with status: {response.status_code}")
            print(f"Sending response with body: {response.data}")
            return response
        except Exception as e:
            logger.warning(f"Logout failed for user: {request.user.email}")
            logger.error(f"Logout error: {str(e)}")
            response = Response(
                {"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST
            )
            print(f"Sending response with status: {response.status_code}")
            print(f"Sending response with body: {response.data}")
            return response


class AuthStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                access_token = AccessToken(token)
                user = access_token.payload.get("user_id")
                if user:
                    user_instance = CustomUser.objects.get(id=user)
                    logger.info(f"Auth status checked for user: {user_instance.email}")
                    return Response(
                        {"is_authenticated": True, "email": user_instance.email}
                    )
            except (TokenError, CustomUser.DoesNotExist):
                logger.warning("Invalid token or user not found in auth status check")
                pass
        logger.info("Unauthenticated auth status check")
        return Response({"is_authenticated": False, "email": None})


@csrf_exempt
def google_callback(request):
    try:
        code = json.loads(request.body).get("code")
        logger.info(f"Received code: {code}")

        adapter = GoogleOAuth2Adapter(request)
        provider = adapter.get_provider()
        app = SocialApp.objects.get(provider=provider.id)

        callback_url = f"{settings.FRONTEND_URL}/api/auth/google/callback"

        client = OAuth2Client(
            request,
            app.client_id,
            app.secret,
            adapter.access_token_method,
            adapter.access_token_url,
            callback_url,
        )

        token = client.get_access_token(code)
        logger.info(f"Received token: {token}")

        id_token = token.get("id_token")
        decoded_token = jwt.decode(id_token, options={"verify_signature": False})

        email = decoded_token["email"]

        user = User.objects.filter(email=email).first()

        if user:
            logger.info(f"Existing user logged in with Google: {email}")
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            print(f"Access token if user exists: {access_token}")
            return JsonResponse(
                {
                    "success": True,
                    "access": access_token,
                    "refresh": str(refresh),
                    "email": user.email,
                    "onboarding_required": not user.onboarding_completed,
                    "message": "Logged in successfully",
                }
            )
        else:
            response = {
                "id": decoded_token["sub"],
                "email": email,
                "name": decoded_token.get("name"),
                "given_name": decoded_token.get("given_name"),
                "family_name": decoded_token.get("family_name"),
                "picture": decoded_token.get("picture"),
            }
            social_login = provider.sociallogin_from_response(request, response)
            social_login.state["process"] = "connect"
            result = complete_social_login(request, social_login)

            if isinstance(result, User):
                user = result
                refresh = RefreshToken.for_user(user)
                logger.info(f"New user account created for email {email}")
                return JsonResponse(
                    {
                        "success": True,
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                        "email": user.email,
                        "onboarding_required": True,
                        "message": "Account created successfully",
                    }
                )
            elif isinstance(result, HttpResponseRedirect):
                logger.warning(
                    f"Received redirect during account creation for email {email}. This likely means the account already exists."
                )
                user = User.objects.filter(email=email).first()
                if user:
                    logger.info(f"User found after redirect for email {email}")
                    refresh = RefreshToken.for_user(user)
                    return JsonResponse(
                        {
                            "success": True,
                            "access": str(refresh.access_token),
                            "refresh": str(refresh),
                            "email": user.email,
                            "onboarding_required": not user.onboarding_completed,
                            "message": "Logged in successfully",
                        }
                    )
                else:
                    logger.warning(
                        f"User not found after redirect for email {email}. Creating new user."
                    )
                    new_user = User.objects.create_user(email=email)
                    user_email(new_user, email)
                    user_username(new_user, email)
                    new_user.set_unusable_password()
                    new_user.save()

                    refresh = RefreshToken.for_user(new_user)

                    return JsonResponse(
                        {
                            "success": True,
                            "access": str(refresh.access_token),
                            "refresh": str(refresh),
                            "email": new_user.email,
                            "onboarding_required": True,
                            "message": "Account created successfully",
                        }
                    )
            else:
                logger.error(
                    f"Unknown result type during account creation for email {email}: {type(result)}"
                )
                return JsonResponse(
                    {
                        "success": False,
                        "error": "Unknown error during account creation",
                    },
                    status=400,
                )
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return JsonResponse(
            {"success": False, "error": "Invalid JSON in request"}, status=400
        )
    except SocialApp.DoesNotExist:
        logger.error("Google SocialApp does not exist")
        return JsonResponse(
            {
                "success": False,
                "error": "Google authentication is not properly configured",
            },
            status=500,
        )
    except Exception as e:
        logger.error(f"Unexpected error in google_callback: {str(e)}")
        logger.error(traceback.format_exc())
        return JsonResponse(
            {
                "success": False,
                "error": "unexpected_error",
                "message": "An unexpected error occurred",
            },
            status=500,
        )
