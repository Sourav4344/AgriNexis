export type Role = 'FARMER' | 'BUYER' | 'FPO' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type RecordStatus = 'ACTIVE' | 'INACTIVE';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type MembershipStatus = 'ACTIVE' | 'INACTIVE';
export type DataMode = 'LIVE' | 'CACHED' | 'DEMO';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'CANCELLED';
export type DemandStatus = 'DRAFT' | 'ACTIVE' | 'PARTIALLY_FILLED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
export type OrderStatus = 'CONFIRMED' | 'PICKUP_SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMode = 'LIVE' | 'SANDBOX' | 'DEMO';
export type GrievanceStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type RatingModerationStatus = 'PENDING' | 'VISIBLE' | 'HIDDEN';

export type ActionCapability = 'WORKING_API' | 'READ_ONLY' | 'DEMO_ONLY' | 'BACKEND_NOT_AVAILABLE';

export interface Profile {
  id: string;
  user_id: string;
  role: Role;
  display_name: string;
  phone?: string | null;
  preferred_locale: 'en' | 'hi' | 'bn';
  status: AccountStatus;
  created_at: string;
  updated_at?: string;
  farm_summary?: string | null;
  farmer_district?: string | null;
  farmer_state?: string | null;
  postal_area?: string | null;
  organization_name?: string | null;
  trade_reference?: string | null;
  verification_status?: VerificationStatus;
  reliability_status?: RecordStatus;
}

export interface FarmerProfile {
  id: string;
  display_name: string;
  preferred_locale: string;
  farm_summary?: string | null;
  district?: string | null;
  state?: string | null;
}

export interface BuyerProfile {
  id: string;
  display_name: string;
  organization_name?: string | null;
  verification_status: VerificationStatus;
  reliability_status: RecordStatus;
}

export interface FPOProfile {
  id: string;
  legal_name?: string;
  display_name: string;
  registration_reference?: string | null;
  district?: string | null;
  state?: string | null;
  verification_status: VerificationStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Crop {
  id: string;
  canonical_code: string;
  name_en: string;
  name_hi: string;
  name_bn: string;
  default_unit: string;
  created_at?: string;
}

export interface CropVariety {
  id: string;
  crop_id: string;
  canonical_name: string;
  name_en: string;
  name_hi?: string;
  name_bn?: string;
}

export interface ProduceListing {
  id: string;
  farmer_profile_id: string;
  crop_id: string;
  variety_id?: string | null;
  quantity: string;
  available_quantity: string;
  unit: string;
  harvest_date?: string | null;
  available_from: string;
  available_until?: string | null;
  district: string;
  state: string;
  postal_area?: string | null;
  quality_summary: Record<string, any>;
  status: ListingStatus;
  version: number;
  created_at: string;
  updated_at: string;
  // enriched fields
  crop_name?: string;
  variety_name?: string;
  farmer_name?: string;
}

export interface BuyerDemand {
  id: string;
  buyer_profile_id?: string | null;
  fpo_id?: string | null;
  crop_id: string;
  variety_id?: string | null;
  minimum_quantity: string;
  maximum_quantity: string;
  unit: string;
  quality_requirements: Record<string, any>;
  delivery_from: string;
  delivery_until: string;
  delivery_district?: string | null;
  delivery_state: string;
  indicative_price?: string | null;
  currency: string;
  status: DemandStatus;
  version?: number;
  created_at: string;
  updated_at?: string;
  // enriched
  crop_name?: string;
  buyer_name?: string;
}

export interface Offer {
  id: string;
  listing_id: string;
  demand_id?: string | null;
  buyer_profile_id?: string | null;
  fpo_id?: string | null;
  offered_quantity: string;
  unit: string;
  unit_price: string;
  currency: string;
  delivery_terms: string;
  expires_at: string;
  status: OfferStatus;
  idempotency_key?: string | null;
  version?: number;
  created_at: string;
  // enriched
  buyer_name?: string;
  farmer_name?: string;
  crop_name?: string;
}

export interface RecommendationOption {
  id: string;
  farmer_profile_id: string;
  listing_id: string;
  candidate_buyer_profile_id?: string | null;
  candidate_fpo_id?: string | null;
  candidate_mandi_id?: string | null;
  candidate_name?: string;
  demand_id?: string | null;
  logistics_quote_id?: string | null;
  estimated_quantity_kg: string;
  estimated_unit_price_per_kg: string;
  estimated_gross_selling_value: string;
  estimated_transportation_cost: string;
  estimated_storage_cost: string;
  estimated_handling_cost: string;
  estimated_other_applicable_cost: string;
  estimated_total_applicable_cost: string;
  estimated_net_farmer_realization: string;
  rank: number;
  sell_wait: 'SELL_NOW' | 'WAIT' | 'INSUFFICIENT_DATA';
  timing_reason?: string | null;
  explanation_facts: string[];
  confidence: number | null;
  data_mode: DataMode;
  source_name: string;
  dataset_id?: string;
  engine_version: string;
  input_metadata?: Record<string, any>;
  calculated_at: string;
  expires_at: string;
  difference_from_best?: string;
  data_warning?: string;
  distance_km?: number;
  assumptions?: Record<string, any>;
  logistics_source_version?: string;
}

export interface LogisticsQuote {
  id: string;
  listing_id: string;
  demand_id?: string | null;
  transportation_cost: string;
  storage_cost: string;
  handling_cost: string;
  other_applicable_cost: string;
  total_applicable_cost: string;
  distance_km: number;
  assumptions: Record<string, any>;
  source_name: string;
  data_mode: DataMode;
  confidence: number | null;
  dataset_id?: string;
  source_version: string;
  checksum?: string;
  calculated_at: string;
  expires_at: string;
}

export interface Order {
  id: string;
  farmer_profile_id: string;
  buyer_profile_id?: string | null;
  fpo_id?: string | null;
  listing_id: string;
  accepted_offer_id: string;
  accepted_quantity_kg: string;
  accepted_unit_price_per_kg: string;
  // Immutable snapshot fields
  snapshot_currency: string;
  snapshot_quantity_kg: string;
  snapshot_unit_price_per_kg: string;
  snapshot_gross_selling_value: string;
  snapshot_transportation_cost: string;
  snapshot_storage_cost: string;
  snapshot_handling_cost: string;
  snapshot_other_applicable_cost: string;
  snapshot_total_applicable_cost: string;
  snapshot_net_farmer_realization: string;
  snapshot_calculation_version?: string;
  snapshot_calculated_at?: string;
  logistics_quote_id?: string | null;
  recommendation_id?: string | null;
  status: OrderStatus;
  version: number;
  accepted_at: string;
  created_at: string;
  updated_at: string;
  // Enriched
  farmer_name?: string;
  buyer_name?: string;
  crop_name?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  actor_profile_id: string;
  reason?: string | null;
  changed_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: string;
  currency: string;
  provider_name?: string | null;
  provider_reference?: string | null;
  mode: PaymentMode;
  status: PaymentStatus;
  method?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mandi {
  id: string;
  provider_name: string;
  external_id?: string | null;
  name: string;
  district: string;
  state: string;
  active: boolean;
  created_at?: string;
}

export interface MandiPrice {
  id: string;
  mandi_id: string;
  crop_id: string;
  variety_id?: string | null;
  min_price: string;
  modal_price: string;
  max_price: string;
  arrival_quantity_kg?: string;
  normalized_unit: string;
  currency: string;
  observed_at: string;
  fetched_at: string;
  source_name: string;
  source_id?: string;
  provenance: Record<string, any>;
  data_mode: DataMode;
  dataset_id?: string;
  source_version?: string;
  checksum?: string;
  data_warning?: string;
  // Enriched
  mandi_name?: string;
  crop_name?: string;
  variety_name?: string;
}

export interface PricePrediction {
  id: string;
  crop_id: string;
  horizon_days: number;
  trend: 'RISING' | 'STABLE' | 'FALLING' | 'INSUFFICIENT_DATA';
  predicted_price_per_kg?: string | null;
  min_price_per_kg?: string | null;
  max_price_per_kg?: string | null;
  confidence: number | null;
  warnings: string[];
  data_mode: DataMode;
  calculated_at: string;
  source: string;
}

export interface Grievance {
  id: string;
  order_id?: string | null;
  complainant_profile_id: string;
  complainant_name?: string;
  category: string;
  description: string;
  status: GrievanceStatus;
  assignee_profile_id?: string | null;
  resolution_summary?: string | null;
  created_at: string;
  updated_at: string;
  data_mode?: DataMode;
}

export interface AuditEvent {
  id: string;
  actor_profile_id?: string | null;
  actor_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    request_id: string;
    next_cursor?: string | null;
    limit?: number;
  };
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; reason: string }>;
    request_id: string;
  };
}
