# Design system foundation

## Product experience

The farmer home experience must answer **“What should I do with my crop today?”** within the first viewport: Sell Now/Wait, best buyer, best market, expected price, Net Farmer Realization, and why. Raw charts and model detail are secondary disclosures. Buyer/FPO and admin dashboards may be denser but retain clear hierarchy and plain language.

Visual direction: modern agricultural technology, professional, trustworthy, clean, accessible, and appropriate for a government hackathon. Avoid cartoon imagery, novelty agriculture motifs, excessive gradients, heavy animation, or “futuristic” decoration.

## Foundations

- Typography: highly legible system or open-source families with verified Latin, Devanagari, and Bengali coverage. Base farmer text at least 16px equivalent; generous line height; never encode meaning through font weight alone.
- Color: neutral surfaces, a restrained agricultural green primary, one accessible accent, and semantic success/warning/error/info palettes. All text and controls meet WCAG 2.2 AA contrast; never use color as the sole status signal.
- Spacing: a 4px base scale; common steps 4, 8, 12, 16, 24, 32, 48. Maintain touch targets of at least 44×44 logical pixels.
- Shape/elevation: moderate radii and subtle elevation. Borders remain visible in high contrast and without shadows.
- Icons: familiar outlined icons paired with labels for critical actions; consistent stroke and accessible names.

## Components

- Cards: one decision or entity per card; clear title, primary value, freshness/provenance, and one primary action. Recommendation cards show gross, itemized costs, NFR, and reason without hiding deductions.
- Buttons: primary, secondary, tertiary, and destructive variants; verbs as labels; disabled state is not the only feedback. Prevent double submission and show progress.
- Forms: persistent labels, examples in helper text, localized validation beside fields, appropriate keyboards, explicit units, and save/recovery for long farmer flows.
- Charts: simple, labelled, accessible summaries; axes and units always visible; predicted and observed data visually distinct; uncertainty shown; tabular/text alternative provided.
- Status badges: text + color + optional icon using shared status vocabulary. Do not invent client-only states.
- Navigation: farmer app uses shallow mobile navigation and task-oriented actions. Dashboards use responsive sidebar/top navigation with keyboard support and breadcrumbs for deep admin views.

## System states

- Loading: skeletons for layout stability; determinate progress for uploads; never show stale data as freshly loaded.
- Empty: explain why it is empty and give one relevant next action.
- Error: plain-language cause, what remains safe, retry/recovery action, and request ID for support.
- Offline/degraded: distinguish cached/demo/live data; show last-updated time. Queue only safe operations and request confirmation before replaying time-sensitive financial actions.
- Success: confirm the resulting state and next step; financial acceptances repeat the agreed snapshot.

## Responsive and multilingual behavior

Design mobile-first for farmer flows at 320px and up. Dashboards support narrow tablet through desktop without horizontal page scrolling; data tables may become cards or controlled horizontal regions. No hardcoded farmer strings in Flutter widgets: use localization keys and ARB/message catalogs for `en`, `hi`, and `bn`. Use locale-aware number/date/currency formatting and test 30–50% text expansion, wrapping, mixed numerals, and screen readers. Do not place text inside raster images.

## Accessibility acceptance criteria

Keyboard access and visible focus on web; screen-reader names, roles, state, and logical reading order everywhere; adequate contrast; target sizes; error summaries; reduced motion; zoom/text scaling without loss; captions/transcripts for instructional media. Recommendations must remain understandable without charts, color, or animation.

## Content and trust

Use short, respectful sentences and concrete reasons: “Buyer B leaves you ₹3,250 more after transport and handling.” Always label price source, observation time, calculation time, confidence, and `LIVE`, `CACHED`, or `DEMO` mode. Quality assistance must state its limitations and manual verification status.
