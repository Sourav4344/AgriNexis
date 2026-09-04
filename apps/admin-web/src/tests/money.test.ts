import { describe, it, expect } from 'vitest';
import {
  addMoney,
  subtractMoney,
  multiplyMoneyQuantity,
  calculateNFR,
  formatINR,
  moneyToNumber,
} from '../lib/utils/money';

describe('Money Utilities & Decimal String Precision', () => {
  it('adds decimal strings losslessly without float rounding errors', () => {
    expect(addMoney('0.10', '0.20')).toBe('0.30');
    expect(addMoney('1500.50', '2250.75')).toBe('3751.25');
  });

  it('subtracts decimal strings losslessly', () => {
    expect(subtractMoney('32000.00', '6500.00')).toBe('25500.00');
    expect(subtractMoney('31000.00', '2250.00')).toBe('28750.00');
  });

  it('multiplies price by quantity losslessly', () => {
    expect(multiplyMoneyQuantity('32.00', '1000.000')).toBe('32000.00');
    expect(multiplyMoneyQuantity('31.00', '1000.000')).toBe('31000.00');
    expect(multiplyMoneyQuantity('25.50', '500.000')).toBe('12750.00');
  });

  it('calculates canonical Net Farmer Realization (NFR)', () => {
    // Buyer A: Gross ₹32,000; Transport ₹5,500; Storage ₹500; Handling ₹300; Other ₹200
    const buyerA = calculateNFR('32000.00', '5500.00', '500.00', '300.00', '200.00');
    expect(buyerA.totalCost).toBe('6500.00');
    expect(buyerA.nfr).toBe('25500.00');

    // Buyer B: Gross ₹31,000; Transport ₹1,500; Storage ₹300; Handling ₹300; Other ₹150
    const buyerB = calculateNFR('31000.00', '1500.00', '300.00', '300.00', '150.00');
    expect(buyerB.totalCost).toBe('2250.00');
    expect(buyerB.nfr).toBe('28750.00');

    // Realization advantage for Farmer Rahul
    const diff = subtractMoney(buyerB.nfr, buyerA.nfr);
    expect(diff).toBe('3250.00');
  });

  it('formats INR correctly with Indian thousand/lakh separators', () => {
    expect(formatINR('32000.00')).toBe('₹32,000.00');
    expect(formatINR('28750.00')).toBe('₹28,750.00');
    expect(formatINR('1250000.00')).toBe('₹12,50,000.00');
    expect(formatINR('0.00')).toBe('₹0.00');
  });

  it('safely converts decimal string to number for visualization charts only', () => {
    expect(moneyToNumber('28750.00')).toBe(28750);
    expect(moneyToNumber('0.00')).toBe(0);
    expect(moneyToNumber(null)).toBe(0);
  });
});
