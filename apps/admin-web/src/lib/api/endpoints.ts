import { apiRequest } from './client';
import {
  Profile,
  FarmerProfile,
  BuyerProfile,
  FPOProfile,
  Crop,
  CropVariety,
  ProduceListing,
  BuyerDemand,
  Offer,
  RecommendationOption,
  LogisticsQuote,
  Order,
  OrderStatusHistory,
  Payment,
  Mandi,
  MandiPrice,
  PricePrediction,
  Grievance,
  AuditEvent,
} from './types';
import {
  DEMO_PROFILES,
  DEMO_FPOS,
  DEMO_LISTINGS,
  DEMO_DEMANDS,
  DEMO_OFFERS,
  DEMO_LOGISTICS_QUOTES,
  DEMO_RECOMMENDATIONS,
  DEMO_ORDERS,
  DEMO_ORDER_HISTORY,
  DEMO_PAYMENTS,
  DEMO_MANDIS,
  DEMO_MANDI_PRICES,
  DEMO_PREDICTION,
  DEMO_GRIEVANCES,
  DEMO_AUDIT_EVENTS,
} from '../fixtures/sihDemoData';

export interface ApiContext {
  baseUrl: string;
  token?: string;
  demoMode: boolean;
}

// 1. Me / Profile
export async function fetchCurrentProfile(ctx: ApiContext): Promise<Profile> {
  if (ctx.demoMode) {
    return DEMO_PROFILES[0];
  }
  const res = await apiRequest<Profile>(ctx.baseUrl, '/me', { token: ctx.token });
  return res.data;
}

// 2. Users / Profiles
export async function fetchFarmerProfile(ctx: ApiContext, id: string): Promise<FarmerProfile> {
  if (ctx.demoMode) {
    const p = DEMO_PROFILES.find((x) => x.id === id);
    if (!p) throw new Error('Farmer not found');
    return {
      id: p.id,
      display_name: p.display_name,
      preferred_locale: p.preferred_locale,
      farm_summary: p.farm_summary,
      district: p.farmer_district,
      state: p.farmer_state,
    };
  }
  const res = await apiRequest<FarmerProfile>(ctx.baseUrl, `/farmers/${id}`, { token: ctx.token });
  return res.data;
}

export async function fetchBuyerProfile(ctx: ApiContext, id: string): Promise<BuyerProfile> {
  if (ctx.demoMode) {
    const p = DEMO_PROFILES.find((x) => x.id === id);
    if (!p) throw new Error('Buyer not found');
    return {
      id: p.id,
      display_name: p.display_name,
      organization_name: p.organization_name,
      verification_status: p.verification_status || 'UNVERIFIED',
      reliability_status: p.reliability_status || 'ACTIVE',
    };
  }
  const res = await apiRequest<BuyerProfile>(ctx.baseUrl, `/buyers/${id}`, { token: ctx.token });
  return res.data;
}

export async function fetchFPOProfile(ctx: ApiContext, id: string): Promise<FPOProfile> {
  if (ctx.demoMode) {
    const f = DEMO_FPOS.find((x) => x.id === id);
    if (!f) throw new Error('FPO not found');
    return f;
  }
  const res = await apiRequest<FPOProfile>(ctx.baseUrl, `/fpos/${id}`, { token: ctx.token });
  return res.data;
}

export async function fetchAllUsers(ctx: ApiContext): Promise<{ profiles: Profile[]; isBackendAvailable: boolean }> {
  if (ctx.demoMode) {
    return { profiles: DEMO_PROFILES, isBackendAvailable: true };
  }
  // Executable backend does NOT have an admin user-list route
  return { profiles: [], isBackendAvailable: false };
}

export async function fetchAllFPOs(ctx: ApiContext): Promise<{ fpos: FPOProfile[]; isBackendAvailable: boolean }> {
  if (ctx.demoMode) {
    return { fpos: DEMO_FPOS, isBackendAvailable: true };
  }
  // Executable backend does NOT have an FPO list route yet (only /fpos/{id})
  return { fpos: [], isBackendAvailable: false };
}

// 3. Crops & Varieties
export async function fetchCrops(ctx: ApiContext): Promise<Crop[]> {
  if (ctx.demoMode) {
    return [
      {
        id: '30000000-0000-4000-8000-000000000001',
        canonical_code: 'TOMATO',
        name_en: 'Tomato',
        name_hi: 'टमाटर',
        name_bn: 'টমেটো',
        default_unit: 'kg',
      },
      {
        id: '30000000-0000-4000-8000-000000000002',
        canonical_code: 'ONION',
        name_en: 'Red Onion',
        name_hi: 'प्याज',
        name_bn: 'পেঁয়াজ',
        default_unit: 'kg',
      },
    ];
  }
  const res = await apiRequest<Crop[]>(ctx.baseUrl, '/crops', { token: ctx.token });
  return res.data;
}

// 4. Listings
export async function fetchListings(ctx: ApiContext): Promise<ProduceListing[]> {
  if (ctx.demoMode) {
    return DEMO_LISTINGS;
  }
  const res = await apiRequest<ProduceListing[]>(ctx.baseUrl, '/listings', { token: ctx.token });
  return res.data;
}

export async function fetchListing(ctx: ApiContext, id: string): Promise<ProduceListing> {
  if (ctx.demoMode) {
    const l = DEMO_LISTINGS.find((x) => x.id === id);
    if (!l) throw new Error('Listing not found');
    return l;
  }
  const res = await apiRequest<ProduceListing>(ctx.baseUrl, `/listings/${id}`, { token: ctx.token });
  return res.data;
}

export async function publishListing(ctx: ApiContext, id: string): Promise<ProduceListing> {
  if (ctx.demoMode) {
    const l = DEMO_LISTINGS.find((x) => x.id === id);
    if (!l) throw new Error('Listing not found');
    return { ...l, status: 'ACTIVE', version: l.version + 1 };
  }
  const res = await apiRequest<ProduceListing>(ctx.baseUrl, `/listings/${id}/publish`, {
    method: 'POST',
    token: ctx.token,
  });
  return res.data;
}

export async function cancelListing(ctx: ApiContext, id: string): Promise<ProduceListing> {
  if (ctx.demoMode) {
    const l = DEMO_LISTINGS.find((x) => x.id === id);
    if (!l) throw new Error('Listing not found');
    return { ...l, status: 'CANCELLED', version: l.version + 1 };
  }
  const res = await apiRequest<ProduceListing>(ctx.baseUrl, `/listings/${id}/cancel`, {
    method: 'POST',
    token: ctx.token,
  });
  return res.data;
}

// 5. Demands & Offers
export async function fetchDemands(ctx: ApiContext): Promise<BuyerDemand[]> {
  if (ctx.demoMode) {
    return DEMO_DEMANDS;
  }
  const res = await apiRequest<BuyerDemand[]>(ctx.baseUrl, '/demands', { token: ctx.token });
  return res.data;
}

export async function fetchOffers(ctx: ApiContext): Promise<Offer[]> {
  if (ctx.demoMode) {
    return DEMO_OFFERS;
  }
  const res = await apiRequest<Offer[]>(ctx.baseUrl, '/offers', { token: ctx.token });
  return res.data;
}

// 6. Recommendations & Logistics
export async function fetchListingRecommendations(ctx: ApiContext, listingId: string): Promise<RecommendationOption[]> {
  if (ctx.demoMode) {
    return DEMO_RECOMMENDATIONS.filter((r) => r.listing_id === listingId);
  }
  const res = await apiRequest<RecommendationOption[]>(ctx.baseUrl, `/listings/${listingId}/recommendations`, {
    token: ctx.token,
  });
  return res.data;
}

export async function fetchLogisticsQuotes(ctx: ApiContext): Promise<LogisticsQuote[]> {
  if (ctx.demoMode) {
    return DEMO_LOGISTICS_QUOTES;
  }
  // Standalone logistics quote list endpoint does not exist yet
  return [];
}

// 7. Orders
export async function fetchOrders(ctx: ApiContext): Promise<Order[]> {
  if (ctx.demoMode) {
    return DEMO_ORDERS;
  }
  const res = await apiRequest<Order[]>(ctx.baseUrl, '/orders', { token: ctx.token });
  return res.data;
}

export async function fetchOrder(ctx: ApiContext, id: string): Promise<Order> {
  if (ctx.demoMode) {
    const o = DEMO_ORDERS.find((x) => x.id === id);
    if (!o) throw new Error('Order not found');
    return o;
  }
  const res = await apiRequest<Order>(ctx.baseUrl, `/orders/${id}`, { token: ctx.token });
  return res.data;
}

export async function fetchOrderHistory(ctx: ApiContext, orderId: string): Promise<OrderStatusHistory[]> {
  if (ctx.demoMode) {
    return DEMO_ORDER_HISTORY.filter((h) => h.order_id === orderId);
  }
  const res = await apiRequest<OrderStatusHistory[]>(ctx.baseUrl, `/orders/${orderId}/history`, {
    token: ctx.token,
  });
  return res.data;
}

export async function transitionOrder(
  ctx: ApiContext,
  orderId: string,
  body: { to_status: string; version: number; note?: string }
): Promise<Order> {
  if (ctx.demoMode) {
    const o = DEMO_ORDERS.find((x) => x.id === orderId);
    if (!o) throw new Error('Order not found');
    return { ...o, status: body.to_status as any, version: o.version + 1 };
  }
  const res = await apiRequest<Order>(ctx.baseUrl, `/orders/${orderId}/transitions`, {
    method: 'POST',
    token: ctx.token,
    body: JSON.stringify(body),
  });
  return res.data;
}

// 8. Payments
export async function fetchOrderPayments(ctx: ApiContext, orderId: string): Promise<Payment[]> {
  if (ctx.demoMode) {
    return DEMO_PAYMENTS.filter((p) => p.order_id === orderId);
  }
  const res = await apiRequest<Payment[]>(ctx.baseUrl, `/orders/${orderId}/payments`, { token: ctx.token });
  return res.data;
}

export async function fetchAllPayments(ctx: ApiContext): Promise<Payment[]> {
  if (ctx.demoMode) {
    return DEMO_PAYMENTS;
  }
  // For live mode, we fetch orders and their payments
  try {
    const orders = await fetchOrders(ctx);
    const paymentsArr = await Promise.all(
      orders.map(async (o) => {
        try {
          return await fetchOrderPayments(ctx, o.id);
        } catch {
          return [];
        }
      })
    );
    return paymentsArr.flat();
  } catch {
    return [];
  }
}

export async function transitionPayment(
  ctx: ApiContext,
  paymentId: string,
  body: { expected_status: string; new_status: string; reason?: string }
): Promise<Payment> {
  if (ctx.demoMode) {
    const p = DEMO_PAYMENTS.find((x) => x.id === paymentId);
    if (!p) throw new Error('Payment not found');
    return { ...p, status: body.new_status as any };
  }
  const res = await apiRequest<Payment>(ctx.baseUrl, `/payments/${paymentId}/transitions`, {
    method: 'POST',
    token: ctx.token,
    body: JSON.stringify(body),
  });
  return res.data;
}

// 9. Markets & Prices
export async function fetchMarkets(ctx: ApiContext): Promise<Mandi[]> {
  if (ctx.demoMode) {
    return DEMO_MANDIS;
  }
  const res = await apiRequest<Mandi[]>(ctx.baseUrl, '/markets', { token: ctx.token });
  return res.data;
}

export async function fetchMarketPrices(ctx: ApiContext, cropId?: string): Promise<MandiPrice[]> {
  if (ctx.demoMode) {
    return DEMO_MANDI_PRICES;
  }
  const res = await apiRequest<MandiPrice[]>(ctx.baseUrl, '/market-prices', {
    token: ctx.token,
    params: { crop_id: cropId },
  });
  return res.data;
}

// 10. Predictions
export async function fetchPrediction(ctx: ApiContext, listingId: string): Promise<PricePrediction> {
  if (ctx.demoMode) {
    return DEMO_PREDICTION;
  }
  const res = await apiRequest<PricePrediction>(ctx.baseUrl, `/listings/${listingId}/prediction`, {
    token: ctx.token,
  });
  return res.data;
}

// 11. Grievances
export async function fetchGrievances(ctx: ApiContext): Promise<{ grievances: Grievance[]; isBackendAvailable: boolean }> {
  if (ctx.demoMode) {
    return { grievances: DEMO_GRIEVANCES, isBackendAvailable: true };
  }
  // Executable backend does NOT have a grievance route in Phase 2
  return { grievances: [], isBackendAvailable: false };
}

// 12. Audit Events
export async function fetchAuditEvents(ctx: ApiContext): Promise<{ events: AuditEvent[]; isBackendAvailable: boolean }> {
  if (ctx.demoMode) {
    return { events: DEMO_AUDIT_EVENTS, isBackendAvailable: true };
  }
  // Executable backend does NOT have a platform audit route (order history is order-specific)
  return { events: [], isBackendAvailable: false };
}
