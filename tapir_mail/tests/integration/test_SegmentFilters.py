from tapir_mail.registries import filter_registry
from tapir_mail.service.segment import (
    _apply_complex_filters,
    register_filter,
)
from tapir_mail.tests.test_utils import TapirIntegrationTest
from tapir_mail_server.dummy_accounts.models import DummyTapirUser, DummyPickupLocation
from tapir_mail_server.dummy_accounts.tests.factories import (
    DummyTapirUserFactory,
    DummyPickupLocationFactory,
)


class TestSegmentFilters(TapirIntegrationTest):
    PREFIX_FILTER_PICKUPLOCATION = "pickup_location_is_"
    FILTER_HAS_COOP_SHARES = "has_coop_shares"
    PICKUP_LOCATION_NAME_WIRGARTEN = "Wirgarten"
    PICKUP_LOCATION_NAME_EDEKA = "Edeka"
    PICKUP_LOCATION_NAME_GARAGE = "Garage"
    PICKUP_LOCATIONS = [
        PICKUP_LOCATION_NAME_WIRGARTEN,
        PICKUP_LOCATION_NAME_EDEKA,
        PICKUP_LOCATION_NAME_GARAGE,
    ]

    def setUp(self):
        for name in self.PICKUP_LOCATIONS:
            DummyPickupLocationFactory.create(name=name)

        DummyTapirUserFactory.create(
            id=1,
            pickup_location=DummyPickupLocation.objects.get(
                name=self.PICKUP_LOCATION_NAME_WIRGARTEN
            ),
            has_coop_shares=False,
        )
        DummyTapirUserFactory.create(
            id=2,
            pickup_location=DummyPickupLocation.objects.get(
                name=self.PICKUP_LOCATION_NAME_EDEKA
            ),
            has_coop_shares=True,
        )
        DummyTapirUserFactory.create(
            id=3,
            pickup_location=DummyPickupLocation.objects.get(
                name=self.PICKUP_LOCATION_NAME_GARAGE
            ),
            has_coop_shares=False,
        )
        DummyTapirUserFactory.create(
            id=4,
            pickup_location=DummyPickupLocation.objects.get(
                name=self.PICKUP_LOCATION_NAME_WIRGARTEN
            ),
            has_coop_shares=True,
        )

        def pickup_location_filter(location):
            return lambda qs: qs.filter(pickup_location__name=location)

        for pl in self.PICKUP_LOCATIONS:
            filter_name = self.PREFIX_FILTER_PICKUPLOCATION + pl
            filter_registry[filter_name] = pickup_location_filter(pl)

        def has_coop_shares_filter(qs):
            return qs.filter(has_coop_shares=True)

        register_filter(self.FILTER_HAS_COOP_SHARES, has_coop_shares_filter)

    def test_applyComplexFilter_singleFilter_returnsCorrectResult(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN
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
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN,
            ")",
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(set(result), set(DummyTapirUser.objects.filter(id__in=[1, 4])))

    def test_applyComplexFilter_multiFiltersWithAnd_returnsCorrectResult(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_EDEKA,
            "AND",
            self.FILTER_HAS_COOP_SHARES,
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(list(result), [DummyTapirUser.objects.get(id=2)])

    def test_applyComplexFilter_multiFiltersWithOr_returnsCorrectResult(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN,
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
            {DummyTapirUser.objects.get(id=1), DummyTapirUser.objects.get(id=3)},
        )

    def test_applyComplexFilter_nestedBrackets_returnsCorrectResult(self):
        filter_list = [
            "(",
            self.FILTER_HAS_COOP_SHARES,
            "AND",
            "(",
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN,
            "OR",
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_EDEKA,
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
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN,
        ]
        queryset = DummyTapirUser.objects.all()
        with self.assertRaises(ValueError):
            _apply_complex_filters(queryset, filter_list)

    def test_applyComplexFilter_unsupportedOperators_raisesValueError(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN,
            "XOR",
            self.FILTER_HAS_COOP_SHARES,
        ]
        queryset = DummyTapirUser.objects.all()
        with self.assertRaises(ValueError):
            _apply_complex_filters(queryset, filter_list)

    def test_applyComplexFilter_deeplyNestedFilters_returnsCorrectResult(self):
        filter_list = (
            ["("] * 50
            + [self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN]
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
            {DummyTapirUser.objects.get(id=1), DummyTapirUser.objects.get(id=3)},
        )

    def test_applyComplexFilter_multiFilterAllOperators_returnsCorrectResult(self):
        filter_list = [
            "(",
            "NOT",
            self.FILTER_HAS_COOP_SHARES,
            "AND",
            "(",
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_EDEKA,
            "OR",
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN,
            ")",
            ")",
        ]
        queryset = DummyTapirUser.objects.all()
        result = _apply_complex_filters(queryset, filter_list)
        self.assertEqual(list(result), [DummyTapirUser.objects.get(id=1)])

    def test_applyComplexFilter_endsWithOperator_raisesValueError(self):
        filter_list = [
            self.PREFIX_FILTER_PICKUPLOCATION + self.PICKUP_LOCATION_NAME_WIRGARTEN,
            "AND",
        ]
        queryset = DummyTapirUser.objects.all()
        with self.assertRaises(ValueError):
            _apply_complex_filters(queryset, filter_list)
