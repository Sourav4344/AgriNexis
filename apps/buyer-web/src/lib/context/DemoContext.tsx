"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ProduceListing,
  BuyerDemand,
  Offer,
  Order,
  OrderStatus,
  Grievance,
  DeliveryTerms,
} from "../types";
import {
  MOCK_LISTINGS,
  MOCK_DEMANDS,
  MOCK_OFFERS,
  MOCK_ORDERS,
  MOCK_GRIEVANCES,
} from "../mockData";

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (mode: boolean) => void;
  listings: ProduceListing[];
  demands: BuyerDemand[];
  offers: Offer[];
  orders: Order[];
  grievances: Grievance[];
  createDemand: (demand: Omit<BuyerDemand, "id" | "created_at" | "version" | "fulfilled_quantity_kg" | "status">) => Promise<BuyerDemand>;
  closeDemand: (id: string) => Promise<void>;
  createOffer: (offerData: {
    listing_id: string;
    demand_id?: string;
    quantity_kg: string;
    unit_price_per_kg: string;
    delivery_terms: DeliveryTerms;
    expires_in_days?: number;
  }) => Promise<Offer>;
  withdrawOffer: (id: string) => Promise<void>;
  transitionOrderStatus: (orderId: string, toStatus: OrderStatus, note?: string) => Promise<void>;
  createGrievance: (grievance: Omit<Grievance, "id" | "created_at" | "updated_at" | "status">) => Promise<Grievance>;
  resetDemoData: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // NEXT_PUBLIC_DEMO_MODE defaults to false
  const [isDemoMode, setDemoMode] = useState<boolean>(
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
  const [listings, setListings] = useState<ProduceListing[]>(MOCK_LISTINGS);
  const [demands, setDemands] = useState<BuyerDemand[]>(MOCK_DEMANDS);
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [grievances, setGrievances] = useState<Grievance[]>(MOCK_GRIEVANCES);

  // Load saved state in demo mode from localStorage if available
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("agrinexis_demo_mode_active");
      if (savedMode !== null) {
        setDemoMode(savedMode === "true");
      }
      const savedDemands = localStorage.getItem("agrinexis_demo_demands");
      if (savedDemands) setDemands(JSON.parse(savedDemands));
      const savedOffers = localStorage.getItem("agrinexis_demo_offers");
      if (savedOffers) setOffers(JSON.parse(savedOffers));
      const savedOrders = localStorage.getItem("agrinexis_demo_orders");
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch {
      // Ignore storage errors in SSR
    }
  }, []);

  const handleSetDemoMode = (mode: boolean) => {
    setDemoMode(mode);
    try {
      localStorage.setItem("agrinexis_demo_mode_active", String(mode));
    } catch {
      // ignore
    }
  };

  const saveToStorage = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const createDemand = async (
    demandData: Omit<BuyerDemand, "id" | "created_at" | "version" | "fulfilled_quantity_kg" | "status">
  ): Promise<BuyerDemand> => {
    const newDemand: BuyerDemand = {
      ...demandData,
      id: `d-${Date.now()}`,
      fulfilled_quantity_kg: "0.000",
      status: "ACTIVE",
      version: 1,
      created_at: new Date().toISOString(),
    };
    const updated = [newDemand, ...demands];
    setDemands(updated);
    saveToStorage("agrinexis_demo_demands", updated);
    return newDemand;
  };

  const closeDemand = async (id: string): Promise<void> => {
    const updated = demands.map((d) =>
      d.id === id ? { ...d, status: "CANCELLED" as const, version: d.version + 1 } : d
    );
    setDemands(updated);
    saveToStorage("agrinexis_demo_demands", updated);
  };

  const createOffer = async (offerData: {
    listing_id: string;
    demand_id?: string;
    quantity_kg: string;
    unit_price_per_kg: string;
    delivery_terms: DeliveryTerms;
    expires_in_days?: number;
  }): Promise<Offer> => {
    const listing = listings.find((l) => l.id === offerData.listing_id);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (offerData.expires_in_days || 5));

    const newOffer: Offer = {
      id: `o-${Date.now()}`,
      listing_id: offerData.listing_id,
      listing,
      demand_id: offerData.demand_id,
      buyer_name: "FreshDirect Agri Procurement Ltd.",
      quantity_kg: offerData.quantity_kg,
      unit_price_per_kg: offerData.unit_price_per_kg,
      currency: "INR",
      delivery_terms: offerData.delivery_terms,
      expires_at: expiryDate.toISOString(),
      status: "PENDING",
      version: 1,
      created_at: new Date().toISOString(),
    };

    const updated = [newOffer, ...offers];
    setOffers(updated);
    saveToStorage("agrinexis_demo_offers", updated);
    return newOffer;
  };

  const withdrawOffer = async (id: string): Promise<void> => {
    const updated = offers.map((o) =>
      o.id === id ? { ...o, status: "WITHDRAWN" as const, version: o.version + 1 } : o
    );
    setOffers(updated);
    saveToStorage("agrinexis_demo_offers", updated);
  };

  const transitionOrderStatus = async (
    orderId: string,
    toStatus: OrderStatus,
    note?: string
  ): Promise<void> => {
    const updated = orders.map((ord) => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: toStatus,
          version: ord.version + 1,
          updated_at: new Date().toISOString(),
        };
      }
      return ord;
    });
    setOrders(updated);
    saveToStorage("agrinexis_demo_orders", updated);
  };

  const createGrievance = async (
    data: Omit<Grievance, "id" | "created_at" | "updated_at" | "status">
  ): Promise<Grievance> => {
    const newGrievance: Grievance = {
      ...data,
      id: `grv-${Date.now()}`,
      status: "OPEN",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newGrievance, ...grievances];
    setGrievances(updated);
    return newGrievance;
  };

  const resetDemoData = () => {
    setListings(MOCK_LISTINGS);
    setDemands(MOCK_DEMANDS);
    setOffers(MOCK_OFFERS);
    setOrders(MOCK_ORDERS);
    setGrievances(MOCK_GRIEVANCES);
    localStorage.removeItem("agrinexis_demo_demands");
    localStorage.removeItem("agrinexis_demo_offers");
    localStorage.removeItem("agrinexis_demo_orders");
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setDemoMode: handleSetDemoMode,
        listings,
        demands,
        offers,
        orders,
        grievances,
        createDemand,
        closeDemand,
        createOffer,
        withdrawOffer,
        transitionOrderStatus,
        createGrievance,
        resetDemoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
