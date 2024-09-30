from rest_framework_simplejwt.authentication import JWTAuthentication


class DebugJWTAuthentication(JWTAuthentication):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("DebugJWTAuthentication initialized")

    def authenticate(self, request):
        print("DebugJWTAuthentication.authenticate method called")
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        print(f"Authorization header: {auth_header}")

        result = super().authenticate(request)
        if result:
            user, token = result
            print(f"Authentication successful for user: {user}")
        else:
            print("Authentication failed")
        return result
