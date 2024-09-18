from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

@login_required
def check_email_verification(request):
    return JsonResponse({'emailVerified': request.user.email_verified})


