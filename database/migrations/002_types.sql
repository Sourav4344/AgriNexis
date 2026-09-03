-- Rollback: drop these types in reverse order after dependent objects are removed.
create type public.app_role as enum ('FARMER', 'BUYER', 'FPO', 'ADMIN');
create type public.account_status as enum ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
create type public.record_status as enum ('ACTIVE', 'INACTIVE');
create type public.verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
create type public.membership_status as enum ('ACTIVE', 'INACTIVE');
create type public.data_mode as enum ('LIVE', 'CACHED', 'DEMO');
create type public.listing_status as enum ('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED', 'CANCELLED');
create type public.demand_status as enum ('DRAFT', 'ACTIVE', 'PARTIALLY_FILLED', 'FULFILLED', 'EXPIRED', 'CANCELLED');
create type public.offer_status as enum ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');
create type public.order_status as enum ('CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED');
create type public.adjustment_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.payment_status as enum ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');
create type public.payment_mode as enum ('LIVE', 'SANDBOX', 'DEMO');
create type public.rating_moderation_status as enum ('PENDING', 'VISIBLE', 'HIDDEN');
create type public.notification_status as enum ('QUEUED', 'SENT', 'FAILED');
create type public.grievance_status as enum ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');
create type public.idempotency_status as enum ('IN_PROGRESS', 'SUCCEEDED', 'FAILED');
