from django.views.decorators.http import require_POST
from django.http import HttpResponse


@require_POST
def log_email_html(request):
    """
    Dummy demo controller, can be replaced with real APIs soon
    """
    print(request.body)

    return HttpResponse(status=200)
