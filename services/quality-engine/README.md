# Quality engine

Conservative, process-local visual produce-quality evidence for AgriNexis. Results are always
labelled `ASSISTIVE_VISUAL_ASSESSMENT_ONLY`, require manual verification, and never represent
food-safety, regulatory, laboratory, chemical, pesticide, Brix, moisture, internal-defect, or
disease-free certification.

## Contract

`QualityRequest` accepts request/listing UUIDs, a private `asset_id` plus non-secret image
metadata, crop/optional variety, timezone-aware `as_of`, `configuration_version`, and one of the
existing `LIVE`, `CACHED`, or `DEMO` modes. It deliberately does not accept a URL.

`QualityResult` returns availability, individual nullable observations, individual nullable
confidence, verification state, versioned provenance, warnings, and limitations. There is no
combined confidence and no universal grade. Unsupported observations remain `null`.

The initial implementation has only fixed deterministic tomato and potato demo fixtures. It
never labels those fixtures live, never claims real model inference, and returns an unavailable
result for live/cached requests until a configured visual model adapter is provided.

## Development

```powershell
python -m pip install -e ".[dev]"
pytest
ruff format --check .
ruff check .
mypy quality_engine
python -m compileall quality_engine
```
