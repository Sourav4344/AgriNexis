DISCLAIMER = "ASSISTIVE_VISUAL_ASSESSMENT_ONLY"
DEMO_DISCLAIMER = "DEMO DATA — ASSISTIVE VISUAL ASSESSMENT ONLY"

UNSUPPORTED_CLAIMS = (
    "pesticide_residue",
    "chemical_composition",
    "food_safety_certification",
    "brix_or_internal_sugar",
    "exact_moisture_content",
    "disease_free_guarantee",
    "laboratory_grade",
    "regulatory_certification",
    "internal_defects",
)

SUPPORTED_MIME_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
MIN_DIMENSION_PX = 256
MIN_PRODUCE_AREA_RATIO = 0.20
