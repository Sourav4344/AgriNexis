import { ActionClassification } from "./types";

export interface ActionCapability {
  name: string;
  classification: ActionClassification;
  description: string;
  backendRoute?: string;
}

export const APP_CAPABILITIES: Record<string, ActionCapability> = {
  CREATE_DEMAND: {
    name: "Create Demand",
    classification: "WORKING_API",
    description: "Creates a new buyer or FPO procurement demand in DRAFT state",
    backendRoute: "POST /api/v1/demands",
  },
  EDIT_DEMAND: {
    name: "Edit Demand",
    classification: "WORKING_API",
    description: "Updates fields on an owned DRAFT demand",
    backendRoute: "PATCH /api/v1/demands/{id}",
  },
  PUBLISH_DEMAND: {
    name: "Publish Demand",
    classification: "WORKING_API",
    description: "Publishes a DRAFT demand to ACTIVE state",
    backendRoute: "POST /api/v1/demands/{id}/publish",
  },
  CANCEL_DEMAND: {
    name: "Cancel Demand",
    classification: "WORKING_API",
    description: "Cancels an active or draft demand",
    backendRoute: "POST /api/v1/demands/{id}/cancel",
  },
  CREATE_OFFER: {
    name: "Create Offer",
    classification: "WORKING_API",
    description: "Submits a binding purchase offer on a farmer listing",
    backendRoute: "POST /api/v1/offers",
  },
  WITHDRAW_OFFER: {
    name: "Withdraw Offer",
    classification: "WORKING_API",
    description: "Withdraws a pending offer before farmer acceptance",
    backendRoute: "POST /api/v1/offers/{id}/withdraw",
  },
  VIEW_RECOMMENDATION: {
    name: "View Farmer Recommendation",
    classification: "BACKEND_NOT_AVAILABLE",
    description: "Direct recommendations endpoint (/listings/{id}/recommendations) is farmer/admin scoped. Buyer UI displays transparent NFR economics calculation only.",
    backendRoute: "GET /api/v1/listings/{id}/recommendations (Farmer-only)",
  },
  ORDER_TRANSITION: {
    name: "Order State Transition",
    classification: "WORKING_API",
    description: "Applies an allowed order status transition (e.g. PICKUP_SCHEDULED, IN_TRANSIT, DELIVERED, COMPLETED)",
    backendRoute: "POST /api/v1/orders/{id}/transitions",
  },
  PAYMENT_ACTION: {
    name: "Direct Payment Execution",
    classification: "BACKEND_NOT_AVAILABLE",
    description: "Live payment transitions require webhook provider confirmation (/payments/{id}/transitions is ADMIN only). Buyer UI is read-only.",
    backendRoute: "POST /api/v1/payments/{id}/transitions (Admin-only)",
  },
  QUALITY_UPLOAD: {
    name: "Quality Image Upload",
    classification: "BACKEND_NOT_AVAILABLE",
    description: "Visual quality asset upload is owned by the Farmer during listing creation. Buyer dashboard inspects verified quality observations.",
    backendRoute: "POST /api/v1/quality-reports (Farmer-only)",
  },
  PROFILE_UPDATE: {
    name: "Update Profile",
    classification: "WORKING_API",
    description: "Updates organization trade name and preferences",
    backendRoute: "PATCH /api/v1/me",
  },
};
