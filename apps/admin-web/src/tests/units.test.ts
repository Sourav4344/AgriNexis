import { describe, it, expect } from 'vitest';
import {
  kgToQuintals,
  kgPriceToQuintalPrice,
  quintalPriceToKgPrice,
  formatQuantity,
} from '../lib/utils/units';

describe('Agricultural Unit Conversion Utilities', () => {
  it('converts kilograms to quintals losslessly (100 kg = 1 quintal)', () => {
    expect(kgToQuintals('100.000')).toBe('1.00');
    expect(kgToQuintals('1000.000')).toBe('10.00');
    expect(kgToQuintals('15000.000')).toBe('150.00');
    expect(kgToQuintals('250.500')).toBe('2.50');
  });

  it('converts kg prices to quintal prices (price * 100)', () => {
    expect(kgPriceToQuintalPrice('32.00')).toBe('3200.00');
    expect(kgPriceToQuintalPrice('31.50')).toBe('3150.00');
    expect(kgPriceToQuintalPrice('28.00')).toBe('2800.00');
  });

  it('converts quintal prices to kg prices (price / 100)', () => {
    expect(quintalPriceToKgPrice('3200.00')).toBe('32.00');
    expect(quintalPriceToKgPrice('3100.00')).toBe('31.00');
  });

  it('formats quantities with appropriate unit suffixes', () => {
    expect(formatQuantity('1000.000', 'kg')).toBe('1000.000 kg');
    expect(formatQuantity('1000.000', 'quintal')).toBe('10.00 quintals (1000.000 kg)');
  });
});
