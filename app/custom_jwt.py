import jwt
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

logger = logging.getLogger(__name__)

class CustomJWTAuthentication(JWTAuthentication):
    AUTH_HEADER_TYPES = ('Bearer',)

    def authenticate(self, request):
        logger.info("CustomJWTAuthentication.authenticate method called")
        logger.debug(f"Full request headers: {request.headers}")
        
        header = self.get_header(request)
        if header is None:
            logger.warning("No Authorization header found")
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            logger.warning("No token found in the Authorization header")
            return None

        try:
            logger.debug(f"Full Authorization header: {header}")
            logger.debug(f"Raw token: {raw_token}")

            validated_token = self.get_validated_token(raw_token)
            logger.info("Token successfully validated")

            user = self.get_user(validated_token)
            logger.info(f"User authenticated: {user}")

            return (user, validated_token)
        except TokenError as e:
            logger.error(f"TokenError: {str(e)}")
            raise InvalidToken(str(e))
        except Exception as e:
            logger.exception("An unexpected error occurred during authentication")
            return None

    def get_header(self, request):
        header = super().get_header(request)
        logger.debug(f"Authorization header: {header}")
        return header

    def get_raw_token(self, header):
        raw_token = super().get_raw_token(header)
        if raw_token is None:
            logger.warning("Failed to extract raw token from header")
        else:
            logger.debug(f"Extracted raw token: {raw_token[:10]}...")  # Log only the first 10 characters for security
        return raw_token

    def get_validated_token(self, raw_token):
        try:
            return super().get_validated_token(raw_token)
        except TokenError as e:
            logger.error(f"Token validation failed: {str(e)}")
            raise

    def get_user(self, validated_token):
        try:
            user = super().get_user(validated_token)
            logger.info(f"Retrieved user: {user}")
            return user
        except Exception as e:
            logger.error(f"Failed to get user from token: {str(e)}")
            raise
