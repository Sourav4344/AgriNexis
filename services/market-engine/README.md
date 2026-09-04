# AgriNexis market engine

Server-side ingestion and observed-price intelligence for AgriNexis. The package
validates provider records, normalizes exact decimal prices and arrival volumes,
persists immutable observations, derives history, compares markets, and applies
the explicit LIVE -> CACHED -> DEMO fallback policy. It does not forecast prices,
rank buyers, calculate logistics or NFR, or implement HTTP authentication.

No live government source is bundled unless separately configured. In particular,
the engine does not scrape or imply an eNAM or Agmarknet integration.

## Configuration

| Variable | Default | Meaning |
|---|---:|---|
| `DATABASE_URL` | unset | Trusted server-side PostgreSQL connection |
| `MARKET_DATA_PROVIDER` | unset | Explicit configured provider name |
| `MARKET_LIVE_MAX_AGE_MINUTES` | `180` | Maximum age for a newly fetched LIVE result |
| `MARKET_CACHE_MAX_AGE_HOURS` | `48` | Maximum age for cached current-price fallback |
| `MARKET_SOURCE_TIMEZONE` | `Asia/Kolkata` | Timezone used to derive history dates |
| `MARKET_DEMO_FALLBACK_ENABLED` | `false` | Allows explicit deterministic DEMO fallback |

Provider secrets, when a real adapter is added, must remain server-only and must
not be returned or logged.

## Normalization contract

Persisted prices are INR/kg using `Decimal` and database-compatible half-up
rounding to two places. Supported inputs are INR/kg, INR/quintal, INR/q,
INR/tonne, and INR/metric_ton. Quintal prices are divided by 100 and tonne prices
by 1000. Arrival quantities are normalized to kilograms at three decimal places;
supported units are kg, quintal/q, and tonne/metric_ton. Unlabelled or unsupported
units and non-INR currencies are rejected. Floats are rejected.

All datetimes are timezone-aware. `price_history.price_date` is derived in the
configured source timezone, which defaults to Asia/Kolkata. A supplied variety is
validated as belonging to the resolved crop.

## Freshness and fallback

A genuine provider result no older than the live limit is delivered as LIVE.
When the provider is unavailable or bypassed, a previously persisted genuine LIVE
observation no older than the cache limit may be delivered as CACHED. The stored
row remains LIVE: CACHED is delivery metadata, and no duplicate row is inserted.
Older observations remain available only as history.

DEMO fallback requires explicit configuration and is used only when no eligible
genuine result exists. Demo records remain DEMO, use source `AGRINEXIS_DEMO` and
dataset `SIH-2026-TOMATO-V1`, and always carry:

`DEMO DATA — NOT LIVE GOVERNMENT DATA`

Database and configuration failures are not silently converted into DEMO.

## Adding a provider

Implement `MarketSource`, give it a stable provider identity and documented
offline payload fixtures, map provider-specific units explicitly, and inject it
into `MarketService`. Do not normalize provider identity unless that behavior is
part of the adapter's documented contract. Never add credentials to source code.

## Tests

From this directory:

```powershell
python -m pip install -e ".[dev]"
pytest
ruff check .
mypy market_engine
```

Database integration tests require `MARKET_INTEGRATION_DATABASE_URL` pointing to
a disposable database with migrations 001-019 applied. They are skipped otherwise.
