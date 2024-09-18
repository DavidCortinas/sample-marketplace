from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth import get_user_model

User = get_user_model()

@require_http_methods(["POST"])
def resend_verification_email(request):
    email = request.POST.get('email')
    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if user.is_active:
        return JsonResponse({"error": "User is already verified"}, status=400)

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verification_url = request.build_absolute_uri(f'/verify-email/{uid}/{token}/')

    send_mail(
        'Verify your email for AUDAFACT',
        f'Please click the following link to verify your email: {verification_url}',
        'noreply@audafact.com',
        [user.email],
        fail_silently=False,
    )

    return JsonResponse({"message": "Verification email resent successfully"})
