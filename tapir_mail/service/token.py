import logging
import re

from tapir_mail.service.segment import _check_base_queryset

LOG = logging.getLogger(__name__)

TOKEN_TYPE_RECIPIENT = "Empfänger"
TOKEN_TYPE_GENERAL = "Allgemein"

token_registry = {TOKEN_TYPE_RECIPIENT: {}, TOKEN_TYPE_GENERAL: {}}


def _register_user_tokens(user_tokens: dict):
    _check_base_queryset()

    LOG.info(f"Registering tokens {user_tokens}")

    from tapir_mail.service.segment import BASE_QUERYSET

    for label, value in user_tokens.items():
        if not hasattr(BASE_QUERYSET.model, value):
            raise ValueError(
                f"Model {BASE_QUERYSET.model} does not have attribute {value}! Check your token registration for {label}."
            )

    token_registry[TOKEN_TYPE_RECIPIENT].update(user_tokens)


def _register_general_tokens(general_tokens: dict):
    LOG.info(f"Registering general tokens {general_tokens}")

    for k, v in general_tokens.items():
        if not callable(v) and not isinstance(v, str):
            raise ValueError(
                f"General token {k} is not a string or callable! Check your token registration."
            )

    token_registry[TOKEN_TYPE_GENERAL].update(general_tokens)


def register_tokens(user_tokens: dict, general_tokens: dict):
    _register_user_tokens(user_tokens)
    _register_general_tokens(general_tokens)


def replace_tokens(mjml, recipient=None):
    def _do_replace(current_mjml, key, value):
        if value is None:
            value = ""
        return re.sub(
            re.compile(r"\{\{\s*(" + re.escape(key) + r")\s*\}\}"),
            str(value),
            current_mjml,
        )

    for token_type, tokens in token_registry.items():
        if token_type == TOKEN_TYPE_RECIPIENT:
            for key, value in tokens.items():
                mjml = _do_replace(
                    mjml,
                    f"{token_type}.{key}",
                    getattr(recipient, value, "") if recipient != None else "",
                )
        elif token_type == TOKEN_TYPE_GENERAL:
            for key, value in tokens.items():
                mjml = _do_replace(
                    mjml, f"{token_type}.{key}", value() if callable(value) else value
                )

    return mjml
