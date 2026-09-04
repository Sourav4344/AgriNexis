'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useDemo } from '../../../lib/config/demoContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { NFRComparisonCard } from '../../../components/nfr/NFRComparisonCard';
import {
  fetchListing,
  fetchListingRecommendations,
  fetchPrediction,
} from '../../../lib/api/endpoints';
import {
  ProduceListing,
  RecommendationOption,
  PricePrediction,
} from '../../../lib/api/types';
import { formatDateOnly, formatDateTime } from '../../../lib/utils/dates';
import { formatQuantity } from '../../../lib/utils/units';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { demoMode, apiBaseUrl, authToken } = useDemo();

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<ProduceListing | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationOption[]>([]);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!listingId) return;
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const l = await fetchListing(ctx, listingId);
        setListing(l);

        try {
          const recs = await fetchListingRecommendations(ctx, listingId);
          setRecommendations(recs);
        } catch (e) {
          setRecommendations([]);
        }

        try {
          const pred = await fetchPrediction(ctx, listingId);
          setPrediction(pred);
          setPredictionError(null);
        } catch (e: any) {
          setPrediction(null);
          setPredictionError(
            e.code === 'PREDICTION_ENGINE_NOT_CONFIGURED'
              ? 'Agent 7 Prediction Engine adapter returns 503 (Configuration pending)'
              : e.message || 'Prediction unavailable'
          );
        }
      } catch (err) {
        console.error('Failed to load listing detail:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId, demoMode, apiBaseUrl, authToken]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading listing details...</span>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Listing Not Found</h2>
        <p className="text-xs text-slate-500">The requested listing UUID does not exist or is unauthorized.</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/listings')}>
          Back to Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/listings')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Listings
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Listing Detail: {listing.crop_name || 'Produce Listing'}
          </h1>
          <div className="text-xs text-slate-500 font-mono">UUID: {listing.id}</div>
        </div>
      </div>

      {/* Listing Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Supply Specifications" className="md:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Crop:</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{listing.crop_name || 'Tomato'}</div>
            </div>
            <div>
              <span className="text-slate-500">Variety:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{listing.variety_name || 'Standard'}</div>
            </div>
            <div>
              <span className="text-slate-500">Quantity:</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {formatQuantity(listing.available_quantity)} / {formatQuantity(listing.quantity)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Availability:</span>
              <div className="font-medium text-slate-800 mt-0.5">
                {formatDateOnly(listing.available_from)} to {formatDateOnly(listing.available_until)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Location (Coarse):</span>
              <div className="font-medium text-slate-800 mt-0.5">
                {listing.district}, {listing.state}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Listing Status:</span>
              <div className="mt-0.5">
                <Badge variant={listing.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                  {listing.status} (v{listing.version})
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Quality & AI Prediction Signal */}
        <Card title="Quality & Price Signals">
          <div className="space-y-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 font-medium">Declared Quality:</div>
              <div className="font-bold text-slate-800 mt-0.5">
                Grade {listing.quality_summary?.declared_grade || 'A (Standard)'}
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between text-blue-900 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                  Price Forecast (Agent 7)
                </span>
              </div>
              {prediction ? (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800">
                    Trend: <Badge variant="warning" size="sm">{prediction.trend}</Badge>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {prediction.warnings?.join(' ') || 'Forecast ready.'}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  {predictionError || 'Prediction signal unavailable.'}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* NFR Recommendations Showcase for this Listing */}
      {recommendations.length > 0 && (
        <NFRComparisonCard
          recommendations={recommendations}
          cropName={listing.crop_name || 'Tomato'}
          quantityKg={listing.quantity}
        />
      )}
    </div>
  );
}
