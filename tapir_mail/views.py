import json
import os

from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_GET, require_POST

# DUMMY CONTROLLERS

TEMPLATES_PATH = "email-templates"


@require_POST
def save_email_template(request):
    """
    Dummy demo controller, can be replaced with real APIs soon
    """

    data = json.loads(request.body)

    print("HTML:\n", data["html"])
    print("MJML:\n", data["json"])

    template_name = data["name"]

    if not os.path.exists(TEMPLATES_PATH):
        os.makedirs(TEMPLATES_PATH)
    # write mjml to file
    with open(f"{TEMPLATES_PATH}/{template_name}.json", "w") as f:
        f.write(json.dumps(data["json"]))

    return HttpResponse(status=200)


@require_GET
def list_email_templates(request):
    # list all files from email-templates folder
    file_names = (
        [
            f.split(".")[0]
            for f in os.listdir(TEMPLATES_PATH)
            if os.path.isfile(os.path.join(TEMPLATES_PATH, f))
        ]
        if os.path.exists(TEMPLATES_PATH)
        else []
    )

    return JsonResponse({"templates": file_names}, status=200)


@require_GET
def read_email_template(request, name):
    file_path = f"{TEMPLATES_PATH}/{name}.json"
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            file_contents = file.read()

        return HttpResponse(file_contents, content_type="application/json", status=200)
    else:
        return HttpResponse(status=404)


@require_POST
def save_mailing(request):
    print(request.body)

    return HttpResponse(status=200)
