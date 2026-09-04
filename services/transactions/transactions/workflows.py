from __future__ import annotations

from dataclasses import replace

from .errors import ErrorCode, TransactionError, sanitized_repository_error
from .models import (
    Actor,
    DataMode,
    EventType,
    Order,
    OrderStatus,
    Payment,
    PaymentStatus,
    TransactionEvent,
)
from .ports import (
    AuthorizationPolicy,
    EventRepository,
    OrderRepository,
    PaymentRepository,
    ProviderGate,
)

ORDER_TRANSITIONS: dict[OrderStatus, frozenset[OrderStatus]] = {
    OrderStatus.CONFIRMED: frozenset(
        {OrderStatus.PICKUP_SCHEDULED, OrderStatus.CANCELLED, OrderStatus.DISPUTED}
    ),
    OrderStatus.PICKUP_SCHEDULED: frozenset(
        {OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED, OrderStatus.DISPUTED}
    ),
    OrderStatus.IN_TRANSIT: frozenset({OrderStatus.DELIVERED, OrderStatus.DISPUTED}),
    OrderStatus.DELIVERED: frozenset({OrderStatus.COMPLETED, OrderStatus.DISPUTED}),
    OrderStatus.COMPLETED: frozenset(),
    OrderStatus.CANCELLED: frozenset(),
    OrderStatus.DISPUTED: frozenset(),
}

PAYMENT_TRANSITIONS: dict[PaymentStatus, frozenset[PaymentStatus]] = {
    PaymentStatus.PENDING: frozenset({PaymentStatus.PROCESSING, PaymentStatus.FAILED}),
    PaymentStatus.PROCESSING: frozenset({PaymentStatus.PAID, PaymentStatus.FAILED}),
    PaymentStatus.PAID: frozenset({PaymentStatus.REFUNDED}),
    PaymentStatus.FAILED: frozenset(),
    PaymentStatus.REFUNDED: frozenset(),
}


def validate_order_transition(current: OrderStatus, target: OrderStatus) -> None:
    if not ORDER_TRANSITIONS[current]:
        raise TransactionError(ErrorCode.TERMINAL_STATE, "Order is in a terminal state")
    if target not in ORDER_TRANSITIONS[current]:
        raise TransactionError(
            ErrorCode.INVALID_ORDER_TRANSITION, "Order transition is not allowed"
        )


def validate_payment_transition(current: PaymentStatus, target: PaymentStatus) -> None:
    if target not in PAYMENT_TRANSITIONS[current]:
        raise TransactionError(
            ErrorCode.INVALID_PAYMENT_TRANSITION, "Payment transition is not allowed"
        )


class OrderWorkflow:
    def __init__(
        self,
        repository: OrderRepository,
        authorization: AuthorizationPolicy,
        events: EventRepository,
    ) -> None:
        self._repository = repository
        self._authorization = authorization
        self._events = events

    def transition(
        self, order_id: str, target: OrderStatus, expected_version: int, actor: Actor
    ) -> Order:
        try:
            order = self._repository.get(order_id)
        except Exception as exc:
            raise sanitized_repository_error() from exc
        if order is None:
            raise TransactionError(ErrorCode.ORDER_NOT_FOUND, "Order not found")
        if not self._authorization.can_transition_order(actor.profile_id, order):
            raise TransactionError(ErrorCode.FORBIDDEN, "Order transition is forbidden")
        if order.version != expected_version:
            raise TransactionError(ErrorCode.VERSION_CONFLICT, "Order version conflict")
        validate_order_transition(order.status, target)
        candidate = replace(order, status=target, version=order.version + 1)
        try:
            saved = self._repository.save_transition(candidate, expected_version)
            if saved is None:
                raise TransactionError(ErrorCode.VERSION_CONFLICT, "Order version conflict")
            self._events.append(
                TransactionEvent.create(
                    EventType.ORDER_STATUS_CHANGED,
                    "order",
                    order.id,
                    actor.profile_id,
                    {"from_status": order.status.value, "to_status": target.value},
                )
            )
        except TransactionError:
            raise
        except Exception as exc:
            raise sanitized_repository_error() from exc
        return saved


class PaymentWorkflow:
    def __init__(
        self, repository: PaymentRepository, provider_gate: ProviderGate, events: EventRepository
    ) -> None:
        self._repository = repository
        self._provider_gate = provider_gate
        self._events = events

    def transition(
        self,
        payment_id: str,
        expected_status: PaymentStatus,
        target: PaymentStatus,
        actor: Actor,
        provider_evidence: str | None = None,
    ) -> Payment:
        try:
            payment = self._repository.get(payment_id)
        except Exception as exc:
            raise sanitized_repository_error() from exc
        if payment is None:
            raise TransactionError(ErrorCode.PAYMENT_NOT_FOUND, "Payment not found")
        if payment.status is not expected_status:
            raise TransactionError(ErrorCode.VERSION_CONFLICT, "Payment state conflict")
        validate_payment_transition(payment.status, target)
        if payment.mode is DataMode.LIVE and not self._provider_gate.verified(
            payment, provider_evidence
        ):
            raise TransactionError(
                ErrorCode.PAYMENT_PROVIDER_REQUIRED, "Verified provider evidence is required"
            )
        candidate = replace(payment, status=target)
        try:
            saved = self._repository.save_transition(candidate, expected_status.value)
            if saved is None:
                raise TransactionError(ErrorCode.VERSION_CONFLICT, "Payment state conflict")
            self._events.append(
                TransactionEvent.create(
                    EventType.PAYMENT_STATUS_CHANGED,
                    "payment",
                    payment.id,
                    actor.profile_id,
                    {
                        "from_status": payment.status.value,
                        "to_status": target.value,
                        "mode": payment.mode.value,
                    },
                )
            )
        except TransactionError:
            raise
        except Exception as exc:
            raise sanitized_repository_error() from exc
        return saved
