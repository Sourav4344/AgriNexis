from __future__ import annotations

from dataclasses import FrozenInstanceError
from decimal import Decimal

import pytest

from transactions import (
    Actor,
    ActorRole,
    DataMode,
    ErrorCode,
    EventType,
    FinancialSnapshot,
    IdempotencyGuard,
    IdempotencyRecord,
    IdempotencyStatus,
    Order,
    OrderStatus,
    OrderWorkflow,
    Payment,
    PaymentStatus,
    PaymentWorkflow,
    TransactionError,
    TransactionEvent,
    fingerprint,
    validate_order_transition,
    validate_payment_transition,
)
from transactions.idempotency import InMemoryIdempotencyRepository


def snapshot() -> FinancialSnapshot:
    return FinancialSnapshot(
        "inr",
        Decimal("1000"),
        Decimal("31"),
        Decimal("31000"),
        Decimal("1500"),
        Decimal("300"),
        Decimal("300"),
        Decimal("150"),
        Decimal("2250"),
        Decimal("28750"),
    )


VALID_ORDER_TRANSITIONS = [
    (OrderStatus.CONFIRMED, OrderStatus.PICKUP_SCHEDULED),
    (OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
    (OrderStatus.CONFIRMED, OrderStatus.DISPUTED),
    (OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_TRANSIT),
    (OrderStatus.PICKUP_SCHEDULED, OrderStatus.CANCELLED),
    (OrderStatus.PICKUP_SCHEDULED, OrderStatus.DISPUTED),
    (OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED),
    (OrderStatus.IN_TRANSIT, OrderStatus.DISPUTED),
    (OrderStatus.DELIVERED, OrderStatus.COMPLETED),
    (OrderStatus.DELIVERED, OrderStatus.DISPUTED),
]


@pytest.mark.parametrize(("current", "target"), VALID_ORDER_TRANSITIONS)
def test_all_valid_order_transitions(current: OrderStatus, target: OrderStatus) -> None:
    validate_order_transition(current, target)


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (OrderStatus.CONFIRMED, OrderStatus.COMPLETED),
        (OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED),
    ],
)
def test_invalid_order_transitions(current: OrderStatus, target: OrderStatus) -> None:
    with pytest.raises(TransactionError, match="not allowed") as caught:
        validate_order_transition(current, target)
    assert caught.value.code is ErrorCode.INVALID_ORDER_TRANSITION


@pytest.mark.parametrize(
    "terminal", [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DISPUTED]
)
def test_terminal_order_states(terminal: OrderStatus) -> None:
    with pytest.raises(TransactionError) as caught:
        validate_order_transition(terminal, OrderStatus.CONFIRMED)
    assert caught.value.code is ErrorCode.TERMINAL_STATE


def test_snapshot_preserves_decimal_strings() -> None:
    assert snapshot().decimal_strings() == {
        "currency": "INR",
        "quantity_kg": "1000.000",
        "unit_price_per_kg": "31.00",
        "gross": "31000.00",
        "transportation": "1500.00",
        "storage": "300.00",
        "handling": "300.00",
        "other": "150.00",
        "total_cost": "2250.00",
        "net_farmer_realization": "28750.00",
    }


def test_snapshot_is_immutable() -> None:
    with pytest.raises(FrozenInstanceError):
        snapshot().gross = Decimal("0")  # type: ignore[misc]


@pytest.mark.parametrize(
    "field,value",
    [("gross", "1"), ("total_cost", "1"), ("net_farmer_realization", "1")],
)
def test_snapshot_rejects_broken_formulas(field: str, value: str) -> None:
    values = (
        dict(snapshot().__dict__)
        if hasattr(snapshot(), "__dict__")
        else {
            "currency": "INR",
            "quantity_kg": Decimal("1000"),
            "unit_price_per_kg": Decimal("31"),
            "gross": Decimal("31000"),
            "transportation": Decimal("1500"),
            "storage": Decimal("300"),
            "handling": Decimal("300"),
            "other": Decimal("150"),
            "total_cost": Decimal("2250"),
            "net_farmer_realization": Decimal("28750"),
        }
    )
    values[field] = Decimal(value)
    with pytest.raises(ValueError):
        FinancialSnapshot(**values)


def test_fingerprint_is_deterministic_and_order_independent() -> None:
    assert fingerprint({"amount": Decimal("31.00"), "id": "x"}) == fingerprint(
        {"id": "x", "amount": Decimal("31.00")}
    )


def test_idempotent_replay_returns_original_result() -> None:
    guard = IdempotencyGuard(InMemoryIdempotencyRepository())
    record, replay = guard.begin_or_replay("ORDER", "actor", "key", "fp")
    assert not replay
    guard.succeed(record, "order-1")
    replayed, replay = guard.begin_or_replay("ORDER", "actor", "key", "fp")
    assert replay and replayed.result == "order-1"


def test_idempotency_fingerprint_conflict() -> None:
    guard = IdempotencyGuard(InMemoryIdempotencyRepository())
    guard.begin_or_replay("ORDER", "actor", "key", "fp1")
    with pytest.raises(TransactionError) as caught:
        guard.begin_or_replay("ORDER", "actor", "key", "fp2")
    assert caught.value.code is ErrorCode.IDEMPOTENCY_CONFLICT


def test_in_progress_duplicate_conflicts() -> None:
    guard = IdempotencyGuard(InMemoryIdempotencyRepository())
    guard.begin_or_replay("ORDER", "actor", "key", "fp")
    with pytest.raises(TransactionError) as caught:
        guard.begin_or_replay("ORDER", "actor", "key", "fp")
    assert caught.value.code is ErrorCode.IDEMPOTENCY_CONFLICT


def test_failed_record_can_retry() -> None:
    repository = InMemoryIdempotencyRepository()
    repository.begin(IdempotencyRecord("ORDER", "actor", "key", "fp", IdempotencyStatus.FAILED))
    record, replay = IdempotencyGuard(repository).begin_or_replay("ORDER", "actor", "key", "fp")
    assert record.status is IdempotencyStatus.IN_PROGRESS and not replay


class Events:
    def __init__(self) -> None:
        self.items: list[TransactionEvent] = []

    def append(self, event: TransactionEvent) -> None:
        self.items.append(event)


class Orders:
    def __init__(self, order: Order | None, fail: bool = False) -> None:
        self.order = order
        self.fail = fail

    def get(self, order_id: str) -> Order | None:
        if self.fail:
            raise RuntimeError("secret database diagnostic")
        return self.order if self.order and self.order.id == order_id else None

    def save_transition(self, order: Order, expected_version: int) -> Order | None:
        if self.fail:
            raise RuntimeError("password=secret")
        if self.order is None or self.order.version != expected_version:
            return None
        self.order = order
        return order


class Authorization:
    def __init__(self, allowed: bool) -> None:
        self.allowed = allowed

    def can_transition_order(self, actor_id: str, order: Order) -> bool:
        return self.allowed


def actor() -> Actor:
    return Actor("actor-1", ActorRole.FARMER)


def test_order_workflow_transition_and_event() -> None:
    repository = Orders(Order("order-1", OrderStatus.CONFIRMED, 1, snapshot()))
    events = Events()
    result = OrderWorkflow(repository, Authorization(True), events).transition(
        "order-1", OrderStatus.PICKUP_SCHEDULED, 1, actor()
    )
    assert result.version == 2
    assert events.items[0].event_type is EventType.ORDER_STATUS_CHANGED
    assert events.items[0].facts["from_status"] == "CONFIRMED"


def test_order_not_found() -> None:
    with pytest.raises(TransactionError) as caught:
        OrderWorkflow(Orders(None), Authorization(True), Events()).transition(
            "missing", OrderStatus.CANCELLED, 1, actor()
        )
    assert caught.value.code is ErrorCode.ORDER_NOT_FOUND


def test_authorization_denial() -> None:
    repository = Orders(Order("order-1", OrderStatus.CONFIRMED, 1, snapshot()))
    with pytest.raises(TransactionError) as caught:
        OrderWorkflow(repository, Authorization(False), Events()).transition(
            "order-1", OrderStatus.CANCELLED, 1, actor()
        )
    assert caught.value.code is ErrorCode.FORBIDDEN


def test_order_version_conflict() -> None:
    repository = Orders(Order("order-1", OrderStatus.CONFIRMED, 2, snapshot()))
    with pytest.raises(TransactionError) as caught:
        OrderWorkflow(repository, Authorization(True), Events()).transition(
            "order-1", OrderStatus.CANCELLED, 1, actor()
        )
    assert caught.value.code is ErrorCode.VERSION_CONFLICT


def test_repository_failure_is_sanitized() -> None:
    with pytest.raises(TransactionError) as caught:
        OrderWorkflow(Orders(None, fail=True), Authorization(True), Events()).transition(
            "order-1", OrderStatus.CANCELLED, 1, actor()
        )
    assert caught.value.code is ErrorCode.REPOSITORY_FAILURE
    assert "secret" not in str(caught.value)


VALID_PAYMENT_TRANSITIONS = [
    (PaymentStatus.PENDING, PaymentStatus.PROCESSING),
    (PaymentStatus.PENDING, PaymentStatus.FAILED),
    (PaymentStatus.PROCESSING, PaymentStatus.PAID),
    (PaymentStatus.PROCESSING, PaymentStatus.FAILED),
    (PaymentStatus.PAID, PaymentStatus.REFUNDED),
]


@pytest.mark.parametrize(("current", "target"), VALID_PAYMENT_TRANSITIONS)
def test_valid_payment_transitions(current: PaymentStatus, target: PaymentStatus) -> None:
    validate_payment_transition(current, target)


def test_invalid_payment_transition() -> None:
    with pytest.raises(TransactionError) as caught:
        validate_payment_transition(PaymentStatus.PENDING, PaymentStatus.PAID)
    assert caught.value.code is ErrorCode.INVALID_PAYMENT_TRANSITION


class Payments:
    def __init__(self, payment: Payment | None) -> None:
        self.payment = payment

    def get(self, payment_id: str) -> Payment | None:
        return self.payment if self.payment and self.payment.id == payment_id else None

    def save_transition(self, payment: Payment, expected_status: str) -> Payment | None:
        if self.payment is None or self.payment.status.value != expected_status:
            return None
        self.payment = payment
        return payment


class Gate:
    def __init__(self, allowed: bool) -> None:
        self.allowed = allowed

    def verified(self, payment: Payment, evidence: str | None) -> bool:
        return self.allowed and evidence == "verified"


def test_live_payment_requires_provider_gate() -> None:
    payment = Payment("payment-1", PaymentStatus.PENDING, DataMode.LIVE)
    with pytest.raises(TransactionError) as caught:
        PaymentWorkflow(Payments(payment), Gate(False), Events()).transition(
            payment.id, payment.status, PaymentStatus.PROCESSING, actor()
        )
    assert caught.value.code is ErrorCode.PAYMENT_PROVIDER_REQUIRED


def test_live_payment_with_verified_provider_evidence() -> None:
    payment = Payment("payment-1", PaymentStatus.PROCESSING, DataMode.LIVE)
    events = Events()
    result = PaymentWorkflow(Payments(payment), Gate(True), events).transition(
        payment.id, payment.status, PaymentStatus.PAID, actor(), "verified"
    )
    assert result.status is PaymentStatus.PAID
    assert events.items[0].event_type is EventType.PAYMENT_STATUS_CHANGED


@pytest.mark.parametrize("mode", [DataMode.DEMO, DataMode.SANDBOX])
def test_non_live_deterministic_payment_transition(mode: DataMode) -> None:
    payment = Payment("payment-1", PaymentStatus.PENDING, mode)
    result = PaymentWorkflow(Payments(payment), Gate(False), Events()).transition(
        payment.id, payment.status, PaymentStatus.FAILED, actor()
    )
    assert result.status is PaymentStatus.FAILED


def test_payment_expected_state_conflict() -> None:
    payment = Payment("payment-1", PaymentStatus.PROCESSING, DataMode.DEMO)
    with pytest.raises(TransactionError) as caught:
        PaymentWorkflow(Payments(payment), Gate(False), Events()).transition(
            payment.id, PaymentStatus.PENDING, PaymentStatus.FAILED, actor()
        )
    assert caught.value.code is ErrorCode.VERSION_CONFLICT


def test_payment_not_found() -> None:
    with pytest.raises(TransactionError) as caught:
        PaymentWorkflow(Payments(None), Gate(False), Events()).transition(
            "missing", PaymentStatus.PENDING, PaymentStatus.FAILED, actor()
        )
    assert caught.value.code is ErrorCode.PAYMENT_NOT_FOUND


def test_event_facts_are_immutable() -> None:
    event = TransactionEvent.create(
        EventType.ORDER_CREATED, "order", "1", None, {"status": "CONFIRMED"}
    )
    with pytest.raises(TypeError):
        event.facts["status"] = "COMPLETED"  # type: ignore[index]
