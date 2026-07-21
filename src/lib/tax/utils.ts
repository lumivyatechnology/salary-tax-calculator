/**
 * Tax Utility Functions
 * 
 * Shared helpers for formatting, validation, and common operations.
 */

/**
 * Format number as Nepalese Rupees
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
  }
): string {
  const { showSymbol = true, decimals = 0 } = options ?? {};
  
  const formatted = new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return showSymbol ? `Rs ${formatted}` : formatted;
}

/**
 * Format percentage
 */
export function formatPercentage(
  decimal: number,
  decimals: number = 2
): string {
  return `${(decimal * 100).toFixed(decimals)}%`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[Rs\s,]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate income amount
 */
export function validateIncome(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (isNaN(amount)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  if (amount < 0) {
    return { valid: false, error: "Income cannot be negative" };
  }
  if (amount > 1000000000) {
    return { valid: false, error: "Income amount seems unrealistic" };
  }
  return { valid: true };
}

/**
 * Validate SSF contribution
 */
export function validateSSFContribution(
  contribution: number,
  maxAllowed: number
): { valid: boolean; error?: string } {
  if (isNaN(contribution)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  if (contribution < 0) {
    return { valid: false, error: "Contribution cannot be negative" };
  }
  if (contribution > maxAllowed) {
    return {
      valid: false,
      error: `Contribution cannot exceed ${formatCurrency(maxAllowed)}`,
    };
  }
  return { valid: true };
}

/**
 * Debounce function for reactive calculations
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Convert annual to monthly
 */
export function annualToMonthly(annual: number): number {
  return annual / 12;
}

/**
 * Convert monthly to annual
 */
export function monthlyToAnnual(monthly: number): number {
  return monthly * 12;
}

/**
 * Round to nearest rupee
 */
export function roundToRupee(amount: number): number {
  return Math.round(amount);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
