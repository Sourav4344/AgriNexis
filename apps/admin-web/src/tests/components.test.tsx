import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/ui/Badge';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge';
import { BackendUnavailable } from '../components/ui/BackendUnavailable';
import { NFRComparisonCard } from '../components/nfr/NFRComparisonCard';
import { DEMO_RECOMMENDATIONS } from '../lib/fixtures/sihDemoData';

describe('UI Components & Presentation Standards', () => {
  it('renders Badge with correct text and variant classes', () => {
    render(<Badge variant="success">ACTIVE</Badge>);
    expect(screen.getByText('ACTIVE')).toBeDefined();
  });

  it('renders ProvenanceBadge for DEMO mode with non-promoted label', () => {
    render(<ProvenanceBadge mode="DEMO" source="AGRINEXIS_DEMO" />);
    expect(screen.getByText(/DEMO/i)).toBeDefined();
  });

  it('renders ProvenanceBadge for LIVE mode with pulse indicator', () => {
    render(<ProvenanceBadge mode="LIVE" source="AGMARKNET" />);
    expect(screen.getByText(/LIVE/i)).toBeDefined();
  });

  it('renders BackendUnavailable component with planned endpoint and agent assignment', () => {
    render(
      <BackendUnavailable
        featureName="Buyer Verification Mutation"
        plannedEndpoint="POST /admin/verifications"
        assignedAgent="Agent 4"
      />
    );
    expect(screen.getByText('Buyer Verification Mutation')).toBeDefined();
    expect(screen.getByText(/BACKEND_NOT_AVAILABLE/i)).toBeDefined();
    expect(screen.getByText(/POST \/admin\/verifications/i)).toBeDefined();
  });

  it('renders NFRComparisonCard highlighting canonical ₹3,250 realization advantage', () => {
    render(
      <NFRComparisonCard
        recommendations={DEMO_RECOMMENDATIONS}
        cropName="Tomato"
        quantityKg="1000.000"
      />
    );
    expect(screen.getAllByText(/Net Farmer Realization/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Buyer B/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Buyer A/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Realization Advantage: \+₹3,250\.00/i)).toBeDefined();
  });
});
