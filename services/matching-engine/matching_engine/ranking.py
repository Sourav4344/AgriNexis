from __future__ import annotations

from collections import defaultdict

from .models import CoverageClass, RankedOption, VerificationStatus


def rank_options(options: list[RankedOption]) -> list[RankedOption]:
    grouped: dict[CoverageClass, list[RankedOption]] = defaultdict(list)
    for option in options:
        grouped[option.coverage_class].append(option)
    ranked: list[RankedOption] = []
    for coverage_class in (CoverageClass.FULL_LOT, CoverageClass.PARTIAL_LOT):
        group = grouped[coverage_class]
        quantities_differ = len({item.quantity_kg for item in group}) > 1
        distances_comparable = bool(group) and all(item.distance_km is not None for item in group)

        def key(
            item: RankedOption,
            quantities_differ: bool = quantities_differ,
            distances_comparable: bool = distances_comparable,
        ) -> tuple[object, ...]:
            economics = item.economics
            primary = (
                economics.net_farmer_realization_per_kg
                if quantities_differ
                else economics.net_farmer_realization
            )
            secondary = (
                economics.net_farmer_realization
                if quantities_differ
                else economics.net_farmer_realization_per_kg
            )
            distance = item.distance_km if distances_comparable else 0
            verified = item.verification_status is VerificationStatus.VERIFIED
            return (
                -primary,
                -secondary,
                economics.total_applicable_cost,
                distance,
                -int(verified),
                item.valid_until,
                str(item.candidate_id),
            )

        ranked.extend(sorted(group, key=key))
    return [item.model_copy(update={"rank": index}) for index, item in enumerate(ranked, 1)]
