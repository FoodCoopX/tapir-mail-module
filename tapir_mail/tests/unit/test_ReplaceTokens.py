from unittest.mock import patch

from tapir_mail.service.token import (
    TOKEN_TYPE_DYNAMIC,
    TOKEN_TYPE_GENERAL,
    TOKEN_TYPE_RECIPIENT,
    replace_tokens,
    token_registry,
)
from tapir_mail.tests.test_utils import TapirUnitTest


class ReplaceTokensTest(TapirUnitTest):
    @staticmethod
    def _build_registry(general_tokens: dict) -> dict:
        return {
            TOKEN_TYPE_RECIPIENT: {},
            TOKEN_TYPE_GENERAL: general_tokens,
            TOKEN_TYPE_DYNAMIC: {},
        }

    def test_replaceTokens_givenCache_passesItToAllGeneralTokens(self):
        received_caches = []

        def general_token(cache: dict):
            received_caches.append(cache)
            return "value"

        given_cache = {}
        with patch.dict(
            token_registry,
            self._build_registry({"A": general_token, "B": general_token}),
        ):
            result = replace_tokens(
                "{{Allgemein.A}} {{Allgemein.B}}", cache=given_cache
            )

        self.assertEqual("value value", result)
        self.assertEqual(2, len(received_caches))
        self.assertIs(given_cache, received_caches[0])
        self.assertIs(given_cache, received_caches[1])

    def test_replaceTokens_noCacheGiven_usesAFreshCacheForEachCall(self):
        def general_token(cache: dict):
            cache["calls"] = cache.get("calls", 0) + 1
            return cache["calls"]

        with patch.dict(token_registry, self._build_registry({"A": general_token})):
            first = replace_tokens("{{Allgemein.A}}")
            second = replace_tokens("{{Allgemein.A}}")

        self.assertEqual("1", first)
        self.assertEqual("1", second)

    def test_replaceTokens_generalTokenIsString_replacesWithString(self):
        with patch.dict(token_registry, self._build_registry({"A": "static"})):
            result = replace_tokens("{{Allgemein.A}}")

        self.assertEqual("static", result)
