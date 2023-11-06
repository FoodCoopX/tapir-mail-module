from rest_framework import serializers

from tapir_mail.service.triggers import register_trigger
from tapir_mail.tests.integration.triggers.DummyTriggerClasses import (
    DummySerializer,
    DummyTrigger,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest


class TestTriggerSerializationMixin(TapirIntegrationTest):
    def test_isValid_invalidTriggerName_raisesException(self):
        serializer = DummySerializer(data={"trigger": "invalid trigger name"})
        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_isValid_missingFieldInTriggerData_raisesException(self):
        register_trigger(DummyTrigger)
        serializer = DummySerializer(
            data={"trigger": DummyTrigger.get_id(), "trigger_data": {}}
        )
        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_isValid_triggerDataFieldHasInvalidValue_raisesException(self):
        register_trigger(DummyTrigger)
        serializer = DummySerializer(
            data={"trigger": DummyTrigger.get_id(), "trigger_data": {"a_number": "aaa"}}
        )
        with self.assertRaises(serializers.ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_isValid_serializerHasValidData_returnsTrue(self):
        register_trigger(DummyTrigger)
        serializer = DummySerializer(
            data={"trigger": DummyTrigger.get_id(), "trigger_data": {"a_number": "123"}}
        )

        self.assertTrue(serializer.is_valid())
