/**
 * Money utilities preserving decimal strings to avoid IEEE 754 floating point drift.
 * All monetary amounts are formatted in INR unless specified.
 */

/**
 * Parses a decimal string or number to scaled integer cents/paise (2 decimal places)
 */
function toPaise(val: string | number | null | undefined): bigint {
  if (val === null || val === undefined || val === '') return 0n;
  const str = typeof val === 'number' ? val.toFixed(2) : String(val).trim();
  const negative = str.startsWith('-');
  const cleanStr = negative ? str.substring(1) : str;
  const parts = cleanStr.split('.');
  const whole = BigInt(parts[0] || '0');
  let fraction = parts[1] || '00';
  if (fraction.length === 1) fraction += '0';
  if (fraction.length > 2) fraction = fraction.substring(0, 2);
  const total = whole * 100n + BigInt(fraction);
  return negative ? -total : total;
}

/**
 * Converts BigInt paise back to a 2-decimal place string (e.g., "32000.00")
 */
function fromPaise(paise: bigint): string {
  const negative = paise < 0n;
  const abs = negative ? -paise : paise;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const fracStr = frac < 10n ? `0${frac}` : `${frac}`;
  return `${negative ? '-' : ''}${whole}.${fracStr}`;
}

/**
 * Adds two decimal string money amounts losslessly.
 */
export function addMoney(a: string | number, b: string | number): string {
  return fromPaise(toPaise(a) + toPaise(b));
}

/**
 * Subtracts b from a losslessly (a - b).
 */
export function subtractMoney(a: string | number, b: string | number): string {
  return fromPaise(toPaise(a) - toPaise(b));
}

/**
 * Multiplies quantity (string or number, up to 3 decimals) by unit price (2 decimals) losslessly.
 */
export function multiplyMoneyQuantity(unitPrice: string | number, quantityKg: string | number): string {
  const pricePaise = toPaise(unitPrice);
  const qStr = typeof quantityKg === 'number' ? quantityKg.toFixed(3) : String(quantityKg).trim();
  const qParts = qStr.split('.');
  const qWhole = BigInt(qParts[0] || '0');
  let qFrac = qParts[1] || '000';
  while (qFrac.length < 3) qFrac += '0';
  if (qFrac.length > 3) qFrac = qFrac.substring(0, 3);
  const qMilli = qWhole * 1000n + BigInt(qFrac);
  // (pricePaise * qMilli) / 1000 gives paise
  const totalPaise = (pricePaise * qMilli + 500n) / 1000n;
  return fromPaise(totalPaise);
}

/**
 * Computes canonical Net Farmer Realization (NFR)
 * NFR = Gross - (Transport + Storage + Handling + Other)
 */
export function calculateNFR(
  gross: string | number,
  transport: string | number,
  storage: string | number,
  handling: string | number,
  other: string | number
): { totalCost: string; nfr: string } {
  const totalCostPaise = toPaise(transport) + toPaise(storage) + toPaise(handling) + toPaise(other);
  const nfrPaise = toPaise(gross) - totalCostPaise;
  return {
    totalCost: fromPaise(totalCostPaise),
    nfr: fromPaise(nfrPaise),
  };
}

/**
 * Formats a decimal money string for Indian Rupee presentation (e.g. ₹32,000.00 or ₹32,000)
 */
export function formatINR(val: string | number | null | undefined, showDecimals: boolean = true): string {
  if (val === null || val === undefined || val === '') return '₹0.00';
  const paise = toPaise(val);
  const negative = paise < 0n;
  const abs = negative ? -paise : paise;
  const whole = abs / 100n;
  const frac = abs % 100n;

  // Format whole number in Indian number system (Lakhs, Crores)
  const wholeStr = whole.toString();
  let lastThree = wholeStr.substring(wholeStr.length - 3);
  const otherNumbers = wholeStr.substring(0, wholeStr.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedWhole = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  if (!showDecimals) {
    return `${negative ? '-' : ''}₹${formattedWhole}`;
  }
  const fracStr = frac < 10n ? `0${frac}` : `${frac}`;
  return `${negative ? '-' : ''}₹${formattedWhole}.${fracStr}`;
}

/**
 * Safe conversion to number for visualization charts only.
 */
export function moneyToNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}
