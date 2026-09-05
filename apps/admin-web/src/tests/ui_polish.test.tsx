import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NFRComparisonCard } from '../components/nfr/NFRComparisonCard';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { DEMO_RECOMMENDATIONS } from '../lib/fixtures/sihDemoData';
afterEach(cleanup);
describe('UI trust and keyboard regression checks', () => {
 it('uses supplied values and modes without canonical demo claims', () => {
  const options = DEMO_RECOMMENDATIONS.map((item, index) => ({ ...item, rank: index + 1, candidate_name: `Market ${index + 1}`, data_mode: 'LIVE' as const, estimated_net_farmer_realization: index === 0 ? '100.20' : '90.10' }));
  render(<NFRComparisonCard recommendations={options} />);
  expect(screen.getByText('Realization Advantage: +₹10.10')).toBeDefined();
  expect(screen.queryByText(/Rahul|3,250|DEMO DATA/)).toBeNull();
  expect(screen.getAllByText(/Live data/)).toHaveLength(2);
 });
 it('does not assign a data mode when missing', () => {
  render(<ProvenanceBadge mode={undefined} />);
  expect(screen.getByText('Data source unavailable')).toBeDefined();
 });
 it('keeps keyboard focus inside a dialog and handles Escape', () => {
  const close = vi.fn();
  render(<Modal isOpen onClose={close} title="Review offer"><button>Confirm</button></Modal>);
  const first = screen.getByRole('button', { name: 'Close modal' });
  const last = screen.getByRole('button', { name: 'Confirm' });
  expect(document.activeElement).toBe(first);
  last.focus(); fireEvent.keyDown(last, { key: 'Tab' });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: 'Escape' }); expect(close).toHaveBeenCalledOnce();
 });
 it('opens table records from the keyboard', () => {
  const open = vi.fn();
  render(<DataTable columns={[{ header: 'Name', accessor: 'name' }]} data={[{ name: 'Tomato' }]} onRowClick={open} />);
  fireEvent.keyDown(screen.getByLabelText('Open record 1'), { key: 'Enter' });
  expect(open).toHaveBeenCalledWith({ name: 'Tomato' });
 });
});
