from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_acceptance_uses_hardened_function_signature() -> None:
    source = (ROOT / "app" / "routes.py").read_text(encoding="utf-8")
    assert "internal.accept_offer($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)" in source
    assert "body.acknowledged_amounts.currency" in source
    assert "body.recommendation_option_id" in source


def test_payment_transitions_use_trusted_function() -> None:
    source = (ROOT / "app" / "routes.py").read_text(encoding="utf-8")
    assert "internal.transition_payment" in source
    assert 'payment["mode"] == "LIVE"' in source


def test_fpo_authority_uses_operator_association_not_membership() -> None:
    source = (ROOT / "app" / "routes.py").read_text(encoding="utf-8")
    assert "public.fpo_operators" in source
    assert "public.fpo_members" not in source


def test_general_listing_queries_do_not_join_private_locations() -> None:
    source = (ROOT / "app" / "routes.py").read_text(encoding="utf-8")
    before_private_route = source.split('@router.get("/listings/{listing_id}/private-location"')[0]
    assert "listing_private_locations" not in before_private_route


def test_no_http_demo_reset_route() -> None:
    source = (ROOT / "app" / "routes.py").read_text(encoding="utf-8")
    assert "reset_sih_demo" not in source


def test_demo_warning_is_not_live_labelled() -> None:
    source = (ROOT / "app" / "routes.py").read_text(encoding="utf-8")
    assert "DEMO DATA — NOT LIVE GOVERNMENT DATA" in source
