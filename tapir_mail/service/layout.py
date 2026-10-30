import re

from tapir_mail.exceptions import TapirMailException

# Matches a full <mj-body ...>...</mj-body> element and captures its inner content.
MJ_BODY_RE = re.compile(r"<mj-body[^>]*>(.*)</mj-body>", re.DOTALL)

# Matches the {{Body}} placeholder, tolerating whitespace: {{ Body }}.
BODY_TOKEN_RE = re.compile(r"\{\{\s*Body\s*\}\}")


def extract_mj_body_inner(mjml: str) -> str:
    """
    Return the inner content of the <mj-body> element of a full MJML document.
    If the document has no <mj-body> (e.g. a fragment), the input is returned unchanged.
    """
    match = MJ_BODY_RE.search(mjml or "")
    if match is None:
        return mjml
    return match.group(1)


def layout_contains_body_token(content: str) -> bool:
    return BODY_TOKEN_RE.search(content or "") is not None


def apply_layout(body_mjml: str, layout_mjml: str) -> str:
    """
    Wrap an email body into a layout template by replacing the {{Body}} placeholder
    of the layout with the inner content of the body's <mj-body> element.
    """
    if not layout_contains_body_token(layout_mjml):
        raise TapirMailException("Layout-Vorlage enthält keinen {{Body}}-Platzhalter.")

    body_inner = extract_mj_body_inner(body_mjml)
    return BODY_TOKEN_RE.sub(lambda _: body_inner, layout_mjml)


def get_effective_layout(version):
    """
    Resolve the layout template that applies to a version at send time.

    - Versions that existed before the layout feature (layout_enabled == False) never
      get a layout, so their behaviour stays unchanged.
    - Otherwise the explicitly chosen layout is used, falling back to the global
      default layout (which is resolved live at send time).
    """
    if not getattr(version, "layout_enabled", False):
        return None

    if version.layout_template_id:
        return version.layout_template

    from tapir_mail.models import EmailTemplate, EmailTemplateType

    return EmailTemplate.objects.filter(
        template_type=EmailTemplateType.LAYOUT,
        is_default_layout=True,
    ).first()


def render_email_mjml(version) -> str:
    """
    Return the MJML that should actually be rendered for a version: the body wrapped
    in the effective layout, or the raw content when no layout applies.
    """
    layout = get_effective_layout(version)
    if layout is None:
        return version.content
    return apply_layout(version.content, layout.content)
