"use client";

import React, { useState } from "react";
import { ProduceListing, DeliveryTerms } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { useDemo } from "@/lib/context/DemoContext";
import { Handshake, AlertCircle, Info, ShieldCheck } from "lucide-react";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ProduceListing;
  onSuccess?: () => void;
}

export function MakeOfferModal({
  isOpen,
  onClose,
  listing,
  onSuccess,
}: MakeOfferModalProps) {
  const { createOffer } = useDemo();
  const [quantityKg, setQuantityKg] = useState<string>(listing.available_quantity_kg);
  const [unitPrice, setUnitPrice] = useState<string>("31.00");
  const [deliveryTerms, setDeliveryTerms] = useState<DeliveryTerms>("buyer_pickup");
  const [expiryDays, setExpiryDays] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseFloat(quantityKg) || 0;
  const price = parseFloat(unitPrice) || 0;
  const grossValue = qty * price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const available = parseFloat(listing.available_quantity_kg) || 0;
    if (qty <= 0 || (available > 0 && qty > available)) {
      setError(`Quantity must be between 1 and ${listing.available_quantity_kg} kg.`);
      return;
    }

    if (price <= 0) {
      setError("Unit price must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOffer({
        listing_id: listing.id,
        quantity_kg: qty.toFixed(3),
        unit_price_per_kg: price.toFixed(2),
        delivery_terms: deliveryTerms,
        expires_in_days: expiryDays,
      });
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Failed to submit offer.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Make Offer on ${listing.crop_name}`}
      description={`Farmer Lot: ${listing.id.slice(0, 8)} • Location: ${listing.district}, ${listing.state}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Quantity (kg) *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max={listing.available_quantity_kg}
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Available: {formatQuantity(listing.available_quantity_kg)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Offered Unit Price (₹ / kg) *
            </label>
            <input
              type="number"
              step="0.25"
              min="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Delivery Terms *
            </label>
            <select
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value as DeliveryTerms)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="buyer_pickup">Buyer Pickup at Farm Gate</option>
              <option value="third_party_logistics">3PL Managed Freight</option>
              <option value="seller_delivery">Farmer Delivers to Hub</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Offer Expiry Window
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value={1}>1 Day (Urgent)</option>
              <option value={3}>3 Days (Fast response)</option>
              <option value={5}>5 Days (Standard)</option>
              <option value={7}>7 Days (Extended window)</option>
            </select>
          </div>
        </div>

        {/* Offer Summary & Contract Terms */}
        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Gross Contract Value:</span>
            <span className="font-bold text-base text-white font-mono">{formatCurrency(grossValue)}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>NFR Integrity Policy:</strong> Buyers submit gross unit price and volume. Logistics deductions, distance slabs, and net farmer realization are calculated authoritatively by the backend matching engine.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <Handshake className="w-4 h-4 mr-1.5" />
            Submit Binding Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
