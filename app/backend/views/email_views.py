from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.http import HttpResponse
from backend.models import CustomUser


def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = CustomUser.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.email_verified = True
        user.save()
        status = "success"
    else:
        status = "error"

    redirect_url = f"http://localhost:5173/email-verified?status={status}"

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting...</title>
        <script>
            window.location.href = "{redirect_url}";
        </script>
    </head>
    <body>
        <p>Verifying your email... If you are not redirected, <a href="{redirect_url}">click here</a>.</p>
    </body>
    </html>
    """

    return HttpResponse(html)
