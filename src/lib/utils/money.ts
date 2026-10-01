/**
 * Safe Financial & Money Calculation Utilities
 * Avoids floating point inaccuracies by calculating in cents/paisa (x100 integer)
 * or precise rounding.
 */

export const toPaisa = (amount: number): number => {
  return Math.round((Number(amount) || 0) * 100);
};

export const fromPaisa = (paisa: number): number => {
  return Math.round(Number(paisa) || 0) / 100;
};

export const roundMoney = (amount: number): number => {
  return Math.round((Number(amount) || 0) * 100) / 100;
};

export const addMoney = (...amounts: number[]): number => {
  const sumPaisa = amounts.reduce((acc, curr) => acc + toPaisa(curr), 0);
  return fromPaisa(sumPaisa);
};

export const subtractMoney = (a: number, b: number): number => {
  return fromPaisa(toPaisa(a) - toPaisa(b));
};

export const multiplyMoney = (amount: number, factor: number): number => {
  // Multiply amount by factor with exact rounding
  const result = Math.round(toPaisa(amount) * Number(factor)) / 100;
  return roundMoney(result);
};

export const divideMoney = (amount: number, divisor: number): number => {
  if (!divisor) return 0;
  const result = toPaisa(amount) / Number(divisor) / 100;
  return roundMoney(result);
};

/**
 * Converts English digits to Bangla numerals (e.g., 1234 -> ১২৩৪)
 */
export const toBanglaDigits = (num: number | string): string => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (digit) => banglaDigits[Number(digit)]);
};

/**
 * Format BDT currency with standard Bangladesh comma grouping
 * e.g., 1,50,000.00
 */
export const formatBDT = (
  amount: number,
  options?: { showSymbol?: boolean; useBanglaDigits?: boolean }
): string => {
  const safeAmount = roundMoney(amount);
  const { showSymbol = true, useBanglaDigits = false } = options || {};

  const parts = Math.abs(safeAmount).toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // South Asian numbering system: last 3 digits, then groups of 2 digits
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  const sign = safeAmount < 0 ? '-' : '';
  const formatted = `${sign}${integerPart}.${decimalPart}`;

  let result = formatted;
  if (useBanglaDigits) {
    result = toBanglaDigits(formatted);
  }

  if (showSymbol) {
    return `৳ ${result}`;
  }
  return result;
};
