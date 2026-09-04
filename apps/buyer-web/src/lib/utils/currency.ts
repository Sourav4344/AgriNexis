/**
 * Currency, Quantity, and Decimal Arithmetic Utilities
 * Enforces exact decimal string handling for AgriNexis
 */

export function formatCurrency(
  amount: string | number | undefined | null,
  includeDecimals = false,
  currency = "INR"
): string {
  if (amount === undefined || amount === null) return `${currency === "INR" ? "₹" : currency + " "}0`;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency === "INR" ? "₹" : currency + " "}0`;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: includeDecimals ? 2 : 0,
      minimumFractionDigits: includeDecimals ? 2 : 0,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(includeDecimals ? 2 : 0)}`;
  }
}

/**
 * Formats a quantity in kg / quintals / MT.
 */
export function formatQuantity(quantityKg: string | number | undefined | null): string {
  if (quantityKg === undefined || quantityKg === null) return "0 kg";
  const num = typeof quantityKg === "string" ? parseFloat(quantityKg) : quantityKg;
  if (isNaN(num)) return "0 kg";

  if (num >= 1000) {
    const tons = num / 1000;
    return `${tons.toLocaleString("en-IN", { maximumFractionDigits: 2 })} MT (${num.toLocaleString("en-IN")} kg)`;
  }
  return `${num.toLocaleString("en-IN")} kg`;
}

/**
 * Explicit kg to quintal conversion for APMC market arrivals
 * 1 Quintal = 100 Kilograms
 */
export function kgToQuintals(quantityKg: string | number | undefined | null): string {
  if (quantityKg === undefined || quantityKg === null) return "0 qtl";
  const num = typeof quantityKg === "string" ? parseFloat(quantityKg) : quantityKg;
  if (isNaN(num)) return "0 qtl";
  const qtl = num / 100;
  return `${qtl.toLocaleString("en-IN", { maximumFractionDigits: 2 })} qtl (${num.toLocaleString("en-IN")} kg)`;
}

/**
 * Decimal addition preserving fixed 2-decimal money representation
 */
export function addMoney(a: string, b: string): string {
  const decA = Math.round(parseFloat(a || "0") * 100);
  const decB = Math.round(parseFloat(b || "0") * 100);
  return ((decA + decB) / 100).toFixed(2);
}

/**
 * Decimal subtraction preserving fixed 2-decimal money representation
 */
export function subtractMoney(gross: string, deductions: string): string {
  const decGross = Math.round(parseFloat(gross || "0") * 100);
  const decDed = Math.round(parseFloat(deductions || "0") * 100);
  return ((decGross - decDed) / 100).toFixed(2);
}

/**
 * Calculates financial snapshot values for an offer or scenario comparison
 * Net Farmer Realization = Gross Selling Value - Total Applicable Cost
 */
export function calculateRealization(
  quantityKg: string | number,
  unitPricePerKg: string | number,
  transportCost: string | number,
  storageCost: string | number,
  handlingCost: string | number,
  otherCost: string | number
) {
  const qty = typeof quantityKg === "string" ? parseFloat(quantityKg) : quantityKg;
  const price = typeof unitPricePerKg === "string" ? parseFloat(unitPricePerKg) : unitPricePerKg;
  const t = typeof transportCost === "string" ? parseFloat(transportCost) : transportCost;
  const s = typeof storageCost === "string" ? parseFloat(storageCost) : storageCost;
  const h = typeof handlingCost === "string" ? parseFloat(handlingCost) : handlingCost;
  const o = typeof otherCost === "string" ? parseFloat(otherCost) : otherCost;

  const grossCents = Math.round(qty * price * 100);
  const totalCostCents = Math.round((t + s + h + o) * 100);
  const nfrCents = grossCents - totalCostCents;

  return {
    gross: (grossCents / 100).toFixed(2),
    totalCost: (totalCostCents / 100).toFixed(2),
    nfr: (nfrCents / 100).toFixed(2),
  };
}
