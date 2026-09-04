from __future__ import annotations

from typing import Protocol

from .models import Order, Payment, TransactionEvent


class OrderRepository(Protocol):
    def get(self, order_id: str) -> Order | None: ...

    def save_transition(self, order: Order, expected_version: int) -> Order | None: ...


class PaymentRepository(Protocol):
    def get(self, payment_id: str) -> Payment | None: ...

    def save_transition(self, payment: Payment, expected_status: str) -> Payment | None: ...


class EventRepository(Protocol):
    def append(self, event: TransactionEvent) -> None: ...


class AuthorizationPolicy(Protocol):
    def can_transition_order(self, actor_id: str, order: Order) -> bool: ...


class ProviderGate(Protocol):
    def verified(self, payment: Payment, evidence: str | None) -> bool: ...
