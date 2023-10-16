from tapir_mail.service.segment import (
    _apply_complex_filters,
    filter_registry,
    register_filter,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest
from tapir_mail_server.dummy_accounts.models import DummyTapirUser
from tapir_mail_server.dummy_accounts.tests.factories import (
    DummyPickupLocations,
    DummyTapirUserFactory,
)


class TestSegmentFilters(TapirIntegrationTest):
    PREFIX_FILTER_PICKUPLOCATION = "pickup_location_is_"
    FILTER_HAS_COOP_SHARES = "has_coop_shares"

    def setUp(self):
        DummyTapirUserFactory.create(
            id=1,
            first_name="Alice",
            last_name="Smith",
            email="alice@example.com",
            pickup_location=DummyPickupLocations.WIRGARTEN,
            has_coop_shares=False,
        )
        DummyTapirUserFactory.create(
            id=2,
            first_name="Bob",
            last_name="Jones",
            email="bob@example.com",
            pickup_location=DummyPickupLocations.EDEKA,
            has_coop_shares=True,
        )
        DummyTapirUserFactory.create(
            id=3,
            first_name="Charlie",
            last_name="Brown",
            email="charlie@example.com",
            pickup_location=DummyPickupLocations.GARAGE,
            has_coop_shares=False,
        )
        DummyTapirUserFactory.create(
            id=4,
            first_name="Dave",
            last_name="Miller",
            email="dave@example.com",
            pickup_location=DummyPickupLocations.WIRGARTEN,
            has_coop_shares=True,
        )

        # Register filters
        pickup_locations = [
            DummyPickupLocations.WIRGARTEN,
            DummyPickupLocations.EDEKA,
            DummyPickupLocations.GARAGE,
        ]

        def pickup_location_filter(location):
            return lambda qs: qs.filter(pickup_location=location)

        for pl in pickup_locations:
            filter_name = self.PREFIX_FILTER_PICKUPLOCATION + pl
            filter_registry[filter_name] = pickup_location_filter(pl)

        def has_coop_shares_filter(qs):
            return qs.filter(has_coop_shares=True)

        register_filter(self.FILTER_HAS_COOP_SHARES, has_coop_shares_filter)

    def test_applyComplexFilter_singleFilter_returnsCorrectResult(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(set(result), set(DummyTapirUser.objects.filter(id__in=[1, 4])))

        filter_list = [self.FILTER_HAS_COOP_SHARES]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(set(result), set(DummyTapirUser.objects.filter(id__in=[2, 4])))

    def test_applyComplexFilter_singleFilterWithBrackets_returnsCorrectResult(self):
        filter_list = [
            "(",
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN,
            ")",
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(set(result), set(DummyTapirUser.objects.filter(id__in=[1, 4])))

    def test_applyComplexFilter_multiFiltersWithAnd_returnsCorrectResult(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.EDEKA,
            "AND",
            self.FILTER_HAS_COOP_SHARES,
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(list(result), [DummyTapirUser.objects.get(id=2)])

    def test_applyComplexFilter_multiFiltersWithOr_returnsCorrectResult(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN,
            "OR",
            self.FILTER_HAS_COOP_SHARES,
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        print(list(result))
        self.assertEqual(
            set(result),
            set(DummyTapirUser.objects.filter(id__in=[1, 2, 4])),
        )

    def test_applyComplexFilter_singleFilterWithNot_returnsCorrectResult(self):
        filter_list = ["NOT", self.FILTER_HAS_COOP_SHARES]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(
            set(result),
            set([DummyTapirUser.objects.get(id=1), DummyTapirUser.objects.get(id=3)]),
        )

    def test_applyComplexFilter_nestedBrackets_returnsCorrectResult(self):
        filter_list = [
            "(",
            self.FILTER_HAS_COOP_SHARES,
            "AND",
            "(",
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN,
            "OR",
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.EDEKA,
            ")",
            ")",
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(set(result), set(DummyTapirUser.objects.filter(id__in=[2, 4])))

    def test_applyComplexFilter_emptyInput_returnsCorrectResult(self):
        filter_list = []
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(set(result), set(queryset))

    def test_applyComplexFilter_mismatchedBrackets_raisesValueError(self):
        filter_list = [
            "(",
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN,
        ]
        queryset = DummyTapirUser.objects.all()
        with self.assertRaises(ValueError):
            _apply_complex_filters(queryset, filter_list)

    def test_applyComplexFilter_unsupportedOperators_raisesValueError(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN,
            "XOR",
            self.FILTER_HAS_COOP_SHARES,
        ]
        queryset = DummyTapirUser.objects.all()
        with self.assertRaises(ValueError):
            _apply_complex_filters(queryset, filter_list)

    def test_applyComplexFilter_deeplyNestedFilters_returnsCorrectResult(self):
        filter_list = (
            ["("] * 50
            + [self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN]
            + [")"] * 50
        )
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(set(result), set(DummyTapirUser.objects.filter(id__in=[1, 4])))

    def test_applyComplexFilter_chainingNotOperator_returnsCorrectResult(self):
        filter_list = [
            "NOT",
            "(",
            "NOT",
            "(",
            "NOT",
            self.FILTER_HAS_COOP_SHARES,
            ")",
            ")",
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(
            set(result),
            set([DummyTapirUser.objects.get(id=1), DummyTapirUser.objects.get(id=3)]),
        )

    def test_applyComplexFilter_multiFilterAllOperators_returnsCorrectResult(self):
        filter_list = [
            "(",
            "NOT",
            self.FILTER_HAS_COOP_SHARES,
            "AND",
            "(",
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.EDEKA,
            "OR",
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN,
            ")",
            ")",
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(list(result), [DummyTapirUser.objects.get(id=1)])

    def test_applyComplexFIlter_endsWithOperator_raisesValueError(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + DummyPickupLocations.WIRGARTEN,
            "AND",
        ]
        queryset = DummyTapirUser.objects.all()
        with self.assertRaises(ValueError):
            _apply_complex_filters(queryset, filter_list)
