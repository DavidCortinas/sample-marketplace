import jwt
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

logger = logging.getLogger(__name__)

class CustomJWTAuthentication(JWTAuthentication):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ensure AUTH_HEADER_TYPES is set
        if not hasattr(self, 'AUTH_HEADER_TYPES'):
            self.AUTH_HEADER_TYPES = ('Bearer',)
        logger.debug(f"AUTH_HEADER_TYPES: {self.AUTH_HEADER_TYPES}")

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
            # Log the full header and raw token
            logger.debug(f"Full Authorization header: {header}")
            logger.debug(f"Raw token: {raw_token}")

            # Attempt to decode the token without verification
            unverified_payload = jwt.decode(raw_token, options={"verify_signature": False})
            logger.debug(f"Unverified payload: {unverified_payload}")

            # Now attempt to get the validated token
            validated_token = self.get_validated_token(raw_token)
            logger.info("Token successfully validated")

            user = self.get_user(validated_token)
            logger.info(f"User authenticated: {user}")

            return user, validated_token
        except TokenError as e:
            logger.error(f"TokenError: {str(e)}")
            raise InvalidToken(str(e))
        except Exception as e:
            logger.exception("An unexpected error occurred during authentication")
            raise

    def get_header(self, request):
        header = super().get_header(request)
        logger.debug(f"Authorization header: {header}")
        return header

    def get_raw_token(self, header):
        raw_token = super().get_raw_token(header)
        if raw_token is None:
            logger.warning("Failed to extract raw token from header")
        else:
            logger.debug(f"Extracted raw token: {raw_token}")
        return raw_token
