import datetime
from dataclasses import dataclass

from rest_framework import serializers

from tapir_mail.serializers import TriggerSerializationMixin
from tapir_mail.service.triggers import Trigger, TriggerData, register_trigger
from tapir_mail.tests.test_utils import TapirIntegrationTest


class DummySerializer(TriggerSerializationMixin, serializers.Serializer):
    pass


@dataclass
class DummyTriggerData:
    a_number: float


class DummyTrigger(Trigger[DummyTriggerData]):
    @classmethod
    def get_scheduled_date(
        cls, email_configuration_version, data: TriggerData
    ) -> datetime.datetime:
        pass

    @classmethod
    def get_id(cls) -> str:
        return "dummy_trigger"

    @classmethod
    def get_display_name(cls) -> str:
        return "Dummy trigger"

    @classmethod
    def get_field_definitions(cls) -> [Trigger.FieldDefinition]:
        return [
            cls.FieldDefinition(field_name="a_number", type="number", label="A number")
        ]

    @classmethod
    def validate_data_and_return_object(cls, trigger_data):
        if not trigger_data["a_number"].isnumeric():
            raise serializers.ValidationError("a_number is not a valid number")

        return DummyTriggerData(a_number=float(trigger_data["a_number"]))


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
