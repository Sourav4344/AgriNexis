/**
 * Agricultural unit conversion and formatting utilities.
 * Canonical internal arrival and listing quantity is in kilograms (kg).
 * 1 Quintal = 100 kg
 */

/**
 * Converts kg to quintals losslessly as a decimal string (2 decimal places)
 * quintals = kg / 100
 */
export function kgToQuintals(kgStrOrNum: string | number | null | undefined): string {
  if (kgStrOrNum === null || kgStrOrNum === undefined || kgStrOrNum === '') return '0.00';
  const val = typeof kgStrOrNum === 'number' ? kgStrOrNum.toString() : String(kgStrOrNum).trim();
  const parts = val.split('.');
  const whole = BigInt(parts[0] || '0');
  let frac = parts[1] || '000';
  while (frac.length < 3) frac += '0';
  if (frac.length > 3) frac = frac.substring(0, 3);

  // total grams = whole * 1000 + frac
  const totalGrams = whole * 1000n + BigInt(frac);

  // 1 quintal = 100 kg = 100,000 grams
  // We want hundredths of a quintal (2 decimal places):
  // (totalGrams * 100) / 100,000 = totalGrams / 1,000
  const quintalHundredths = totalGrams / 1000n;
  const qWhole = quintalHundredths / 100n;
  const qFrac = quintalHundredths % 100n;
  const qFracStr = qFrac < 10n ? `0${qFrac}` : `${qFrac}`;
  return `${qWhole}.${qFracStr}`;
}

/**
 * Converts quintal price (INR/quintal) to kg price (INR/kg)
 * price_per_kg = price_per_quintal / 100
 */
export function quintalPriceToKgPrice(quintalPrice: string | number): string {
  return kgToQuintals(quintalPrice);
}

/**
 * Converts kg price (INR/kg) to quintal price (INR/quintal)
 * price_per_quintal = price_per_kg * 100
 */
export function kgPriceToQuintalPrice(kgPrice: string | number): string {
  if (!kgPrice) return '0.00';
  const str = typeof kgPrice === 'number' ? kgPrice.toFixed(2) : String(kgPrice).trim();
  const parts = str.split('.');
  const whole = BigInt(parts[0] || '0');
  let frac = parts[1] || '00';
  if (frac.length === 1) frac += '0';
  if (frac.length > 2) frac = frac.substring(0, 2);
  const totalPaise = whole * 100n + BigInt(frac);
  const quintalPaise = totalPaise * 100n;
  const qWhole = quintalPaise / 100n;
  const qFrac = quintalPaise % 100n;
  const qFracStr = qFrac < 10n ? `0${qFrac}` : `${qFrac}`;
  return `${qWhole}.${qFracStr}`;
}

/**
 * Format quantity in kg or quintals for display.
 */
export function formatQuantity(kg: string | number | null | undefined, unit: 'kg' | 'quintal' = 'kg'): string {
  if (kg === null || kg === undefined || kg === '') return '0 kg';
  if (unit === 'quintal') {
    return `${kgToQuintals(kg)} quintals (${kg} kg)`;
  }
  const str = typeof kg === 'number' ? kg.toLocaleString('en-IN') : kg;
  return `${str} kg`;
}
