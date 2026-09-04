export type Role = 'FARMER' | 'BUYER' | 'FPO' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ReliabilityStatus = 'UNKNOWN' | 'STANDARD' | 'VERIFIED' | 'HIGH_RELIABILITY' | 'FLAGGED';
export type DataMode = 'LIVE' | 'CACHED' | 'DEMO';

export type ActionClassification =
  | 'WORKING_API'
  | 'LOCAL_UI_ONLY'
  | 'DEMO_ONLY'
  | 'BACKEND_NOT_AVAILABLE';

export interface Profile {
  id: string;
  user_id: string;
  role: Role;
  display_name: string;
  phone?: string;
  preferred_locale: 'en' | 'hi' | 'bn';
  status: UserStatus;
  created_at: string;
  updated_at: string;
  // Role specific details
  farm_summary?: string;
  farmer_district?: string;
  farmer_state?: string;
  postal_area?: string;
  organization_name?: string;
  trade_reference?: string;
  verification_status?: VerificationStatus;
  reliability_status?: ReliabilityStatus;
}

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'CANCELLED';
export type QualityGrade = 'A' | 'B' | 'C' | 'UNGRADED';

export interface QualityReport {
  id: string;
  listing_id: string;
  method: 'VISUAL_AI' | 'MANUAL_ASSESSMENT' | 'LAB_CERTIFIED';
  declared_grade: QualityGrade;
  visual_confidence: number;
  observations: {
    color_uniformity: string;
    surface_defects_percent: number;
    size_consistency: string;
    ripeness: string;
  };
  limitations: string;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface ProduceListing {
  id: string;
  farmer_profile_id: string;
  farmer_name: string;
  crop_id: string;
  crop_name: string;
  variety_id: string;
  variety_name: string;
  quantity_kg: string; // decimal string
  available_quantity_kg: string; // decimal string
  expected_price_per_kg: string; // decimal string
  unit: string;
  harvest_date: string;
  available_from: string;
  available_until?: string;
  district: string;
  state: string;
  postal_area?: string;
  distance_km?: number;
  quality_grade: QualityGrade;
  quality_summary?: Record<string, any>;
  quality_report?: QualityReport;
  status: ListingStatus;
  version: number;
  created_at: string;
  updated_at?: string;
}

export type DemandStatus = 'DRAFT' | 'ACTIVE' | 'PARTIALLY_FILLED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';

export interface BuyerDemand {
  id: string;
  buyer_profile_id?: string;
  fpo_id?: string;
  created_by_role: 'BUYER' | 'FPO';
  organization_name: string;
  crop_id: string;
  crop_name: string;
  variety_id?: string;
  variety_name?: string;
  minimum_quantity: string; // decimal string
  maximum_quantity: string; // decimal string
  fulfilled_quantity_kg?: string;
  indicative_price?: string; // decimal string
  currency: string;
  quality_requirements: {
    min_grade?: QualityGrade;
    max_defects_percent?: number;
    notes?: string;
    [key: string]: any;
  };
  delivery_from: string;
  delivery_until: string;
  delivery_district?: string;
  delivery_state: string;
  status: DemandStatus;
  created_at: string;
  version: number;
}

export type DeliveryTerms = 'buyer_pickup' | 'seller_delivery' | 'third_party_logistics' | string;
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';

export interface Offer {
  id: string;
  listing_id: string;
  listing?: ProduceListing;
  demand_id?: string;
  buyer_profile_id?: string;
  fpo_id?: string;
  buyer_name: string;
  quantity_kg: string; // decimal string
  unit_price_per_kg: string; // decimal string
  currency: string;
  delivery_terms: DeliveryTerms;
  expires_at: string;
  status: OfferStatus;
  order_id?: string;
  version: number;
  created_at: string;
}

export type OrderStatus =
  | 'CONFIRMED'
  | 'PICKUP_SCHEDULED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderFinancialSnapshot {
  snapshot_currency: string;
  snapshot_quantity_kg: string; // decimal string
  snapshot_unit_price_per_kg: string; // decimal string
  snapshot_gross_selling_value: string; // decimal string
  snapshot_transportation_cost: string; // decimal string
  snapshot_storage_cost: string; // decimal string
  snapshot_handling_cost: string; // decimal string
  snapshot_other_applicable_cost: string; // decimal string
  snapshot_total_applicable_cost: string; // decimal string
  snapshot_net_farmer_realization: string; // decimal string
  snapshot_calculation_version: string;
  snapshot_calculated_at: string;
  source_logistics_quote_id?: string;
  source_recommendation_id?: string;
}

export interface Order {
  id: string;
  farmer_profile_id: string;
  farmer_name: string;
  farmer_phone?: string;
  buyer_profile_id?: string;
  fpo_id?: string;
  buyer_name: string;
  listing_id: string;
  crop_name: string;
  variety_name: string;
  accepted_offer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_terms: DeliveryTerms;
  destination_location: string;
  origin_location: string;
  financials: OrderFinancialSnapshot;
  accepted_at: string;
  updated_at: string;
  version: number;
  tracking_number?: string;
  carrier_name?: string;
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  actor_role: Role;
  actor_name: string;
  occurred_at: string;
  note?: string;
  proof_url?: string;
}

export interface MandiPrice {
  id: string;
  mandi_id: string;
  mandi_name: string;
  district: string;
  state: string;
  crop_name: string;
  variety_name: string;
  min_price_per_kg: string; // decimal string
  modal_price_per_kg: string; // decimal string
  max_price_per_kg: string; // decimal string
  arrival_quantity_kg: string; // decimal string
  observed_at: string;
  data_mode: DataMode;
  provenance: string;
}

export type PriceTrend = 'RISING' | 'STABLE' | 'FALLING' | 'INSUFFICIENT_DATA';
export type PriceAdvisory = 'SELL_NOW' | 'WAIT' | 'INSUFFICIENT_DATA';

export interface PricePrediction {
  crop_name: string;
  variety_name: string;
  current_modal_price: string;
  forecast_days_1: string;
  forecast_days_3: string;
  trend: PriceTrend;
  confidence_score: number | null; // 0..1 or null when confidence is uncalibrated / not available
  sell_wait_signal: PriceAdvisory;
  drivers: string[];
  calculated_at: string;
  warnings?: string[];
}

export interface Warehouse {
  id: string;
  name: string;
  operator_name: string;
  district: string;
  state: string;
  total_capacity_mt: number;
  available_capacity_mt: number;
  rate_per_quintal_per_month: string;
  temperature_controlled: boolean;
  supported_crops: string[];
  verification_status: VerificationStatus;
}

export interface TransportProvider {
  id: string;
  company_name: string;
  contact_number: string;
  vehicle_types: string[];
  service_districts: string[];
  base_rate_per_km: string;
  capacity_tons: number;
  verification_status: VerificationStatus;
}

export interface Grievance {
  id: string;
  order_id?: string;
  complainant_role: Role;
  complainant_name: string;
  category: 'QUALITY_MISMATCH' | 'WEIGHT_DISCREPANCY' | 'DELIVERY_DELAY' | 'PAYMENT_ISSUE' | 'OTHER';
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  created_at: string;
  updated_at: string;
}

export interface FPOMember {
  id: string;
  fpo_id: string;
  farmer_profile_id: string;
  farmer_name: string;
  phone?: string;
  district?: string;
  membership_role: 'MEMBER' | 'LEAD_FARMER' | 'DIRECTOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  primary_crops: string[];
  active_listings_count: number;
  active_supply_kg: number;
  created_at: string;
}
