/**
 * AgriNexis API Client
 * Connects to FastAPI backend at /api/v1 with standard envelope support
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
    details?: Array<{ field: string; reason: string }>;
    request_id: string;
  };
}

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: ApiErrorPayload;
      try {
        errorData = await response.json();
      } catch {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async getMe() {
    return this.request<any>("/me");
  }

  async getProduceListings(params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/produce-listings${query ? `?${query}` : ""}`);
  }

  async getListingDetails(id: string) {
    return this.request<any>(`/produce-listings/${id}`);
  }

  async getBuyerDemands() {
    return this.request<any[]>("/buyer-demands");
  }

  async createBuyerDemand(data: any) {
    return this.request<any>("/buyer-demands", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOffers() {
    return this.request<any[]>("/offers");
  }

  async createOffer(data: any) {
    return this.request<any>("/offers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOrders() {
    return this.request<any[]>("/orders");
  }

  async getOrderDetails(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async transitionOrder(id: string, data: { to_status: string; version: number; note?: string }) {
    return this.request<any>(`/orders/${id}/transitions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMarketPrices(crop?: string, district?: string) {
    const params: Record<string, string> = {};
    if (crop) params.crop = crop;
    if (district) params.district = district;
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/markets${query ? `?${query}` : ""}`);
  }
}

export const apiClient = new ApiClient();
