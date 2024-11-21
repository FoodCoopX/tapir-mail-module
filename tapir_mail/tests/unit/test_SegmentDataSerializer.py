from unittest.mock import patch, Mock

from rest_framework import serializers

from tapir_mail.serializers import SegmentDataSerializer
from tapir_mail.service.segment import register_segment, register_filter
from tapir_mail.tests.test_utils import TapirUnitTest


class SegmentDataSerializerTest(TapirUnitTest):
    @patch.object(SegmentDataSerializer, "validate_add_segments")
    @patch.object(SegmentDataSerializer, "validate_remove_segments")
    @patch.object(SegmentDataSerializer, "validate_filter_list")
    @patch.object(SegmentDataSerializer, "validate_static_segments")
    @patch.object(SegmentDataSerializer, "validate_static_segments_subtractive")
    def test_isValid_default_callsAllFieldValidationFunctions(self, *mocks):
        SegmentDataSerializer(data={}).is_valid()

        for mock in mocks:
            mock.asssert_called_once()

    @patch.object(SegmentDataSerializer, "validate_segments")
    def test_validateAddSegments_default_callsValidateSegments(
        self, mock_validate_segments: Mock
    ):
        add_segments = Mock()

        SegmentDataSerializer().validate_add_segments(add_segments)

        mock_validate_segments.assert_called_once_with(add_segments)

    @patch.object(SegmentDataSerializer, "validate_segments")
    def test_validateRemoveSegments_default_callsValidateSegments(
        self, mock_validate_segments: Mock
    ):
        add_segments = Mock()

        SegmentDataSerializer().validate_remove_segments(add_segments)

        mock_validate_segments.assert_called_once_with(add_segments)

    def test_validateSegments_validSegment_returnsInput(self):
        register_segment("a_valid_segment", lambda _: True)

        result = SegmentDataSerializer().validate_segments(["a_valid_segment"])

        self.assertEqual(["a_valid_segment"], result)

    def test_validateSegments_invalidSegment_raisesError(self):
        register_segment("a_valid_segment", lambda _: True)

        with self.assertRaises(serializers.ValidationError):
            SegmentDataSerializer().validate_segments(["an_invalid_segment"])

    def test_validateFilterList_validFilter_returnsInput(self):
        register_filter("a_valid_filter", lambda _: True)

        result = SegmentDataSerializer().validate_filter_list(["a_valid_filter", "AND"])

        self.assertEqual(["a_valid_filter", "AND"], result)

    def test_validateFilterList_invalidFilter_raisesError(self):
        register_filter("a_valid_filter", lambda _: True)

        with self.assertRaises(serializers.ValidationError):
            SegmentDataSerializer().validate_filter_list(["an_invalid_filter"])

    @patch.object(SegmentDataSerializer, "validate_static_segments")
    def test_validateStaticSegments_default_callsValidateSegmentsGeneral(
        self, mock_validate_static_segments_general: Mock
    ):
        segments_additive = Mock()

        SegmentDataSerializer().validate_static_segments(segments_additive)

        mock_validate_static_segments_general.assert_called_once_with(segments_additive)

    @patch.object(SegmentDataSerializer, "validate_static_segments_general")
    def test_validateStaticSegmentsSubtractive_default_callsValidateSegments(
        self, mock_validate_static_segments_general: Mock
    ):
        segments_subtractive = Mock()

        SegmentDataSerializer().validate_static_segments_subtractive(
            segments_subtractive
        )

        mock_validate_static_segments_general.assert_called_once_with(
            segments_subtractive
        )

    @patch("tapir_mail.models.StaticSegment.objects.values_list")
    def test_validateStaticSegments_validSegments_returnsInput(
        self, mock_values_list: Mock
    ):
        mock_values_list.return_value = ["a_valid_static_segment"]

        result = SegmentDataSerializer().validate_static_segments_general(
            ["a_valid_static_segment"]
        )

        self.assertEqual(["a_valid_static_segment"], result)

    @patch("tapir_mail.models.StaticSegment.objects.values_list")
    def test_validateStaticSegments_invalidSegments_raisesError(
        self, mock_values_list: Mock
    ):
        mock_values_list.return_value = ["a_valid_static_segment"]

        with self.assertRaises(serializers.ValidationError):
            SegmentDataSerializer().validate_static_segments_general(
                ["an_invalid_static_segment"]
            )
