/**
 * Income Tax Calculation Functions
 * 
 * Pure functions for calculating Nepal income tax.
 * Keep this file free of React/UI code for testability.
 */

import type {
  TaxConfig,
  TaxInput,
  TaxResult,
  BracketBreakdown,
  TaxBracket,
  MaritalStatus,
} from "./config/types";
import { getTaxConfig } from "./config";

/**
 * Calculate tax for a single bracket
 */
function calculateBracketTax(
  income: number,
  bracket: TaxBracket,
  previousBracketMax: number
): { taxableInBracket: number; taxAmount: number } {
  if (income <= previousBracketMax) {
    return { taxableInBracket: 0, taxAmount: 0 };
  }

  const bracketFloor = bracket.min;
  const bracketCeiling = bracket.max ?? Infinity;
  
  // Income that falls within this bracket
  const incomeInBracket = Math.min(income, bracketCeiling) - Math.max(previousBracketMax, bracketFloor - 1);
  const taxableInBracket = Math.max(0, incomeInBracket);
  const taxAmount = taxableInBracket * bracket.rate;

  return { taxableInBracket, taxAmount };
}

/**
 * Calculate tax breakdown by bracket
 */
export function calculateBracketBreakdown(
  taxableIncome: number,
  brackets: TaxBracket[]
): BracketBreakdown[] {
  const breakdown: BracketBreakdown[] = [];
  let previousMax = 0;

  for (const bracket of brackets) {
    const { taxableInBracket, taxAmount } = calculateBracketTax(
      taxableIncome,
      bracket,
      previousMax
    );

    breakdown.push({
      bracket,
      taxableInBracket,
      taxAmount,
    });

    previousMax = bracket.max ?? Infinity;
  }

  return breakdown;
}

/**
 * Calculate total deductions from income
 */
export function calculateDeductions(
  input: TaxInput,
  config: TaxConfig
): number {
  let totalDeductions = 0;

  // SSF contribution is tax deductible
  if (config.ssf.isTaxDeductible) {
    totalDeductions += input.ssfContribution;
  }

  // Remote area allowance exemption
  if (config.allowances.remoteArea.enabled && input.remoteAreaAllowance > 0) {
    const exempt = input.remoteAreaAllowance * config.allowances.remoteArea.exemptPercentage;
    totalDeductions += exempt;
  }

  // Medical allowance exemption
  if (config.allowances.medical.enabled && input.medicalAllowance > 0) {
    const exempt = Math.min(
      input.medicalAllowance,
      config.allowances.medical.maxExemptAmount
    );
    totalDeductions += exempt;
  }

  // Festival allowance - typically 1 month salary is exempt
  // For simplicity, treating it as a fixed deduction if provided
  if (config.allowances.festival.enabled && input.festivalAllowance > 0) {
    // Assuming festival allowance up to 1 month equivalent is exempt
    const monthlyGross = input.grossIncome / 12;
    const exemptAmount = monthlyGross * config.allowances.festival.exemptMonths;
    const exempt = Math.min(input.festivalAllowance, exemptAmount);
    totalDeductions += exempt;
  }

  // Other deductions
  totalDeductions += input.otherDeductions;

  return totalDeductions;
}

/**
 * Get appropriate tax brackets based on marital status
 */
export function getBrackets(
  config: TaxConfig,
  maritalStatus: MaritalStatus
): TaxBracket[] {
  return maritalStatus === "married"
    ? config.marriedBrackets
    : config.unmarriedBrackets;
}

/**
 * Main income tax calculation function
 */
export function calculateIncomeTax(
  input: TaxInput,
  fiscalYear?: string
): TaxResult {
  const config = getTaxConfig(fiscalYear);
  const brackets = getBrackets(config, input.maritalStatus);

  // Calculate deductions
  const totalDeductions = calculateDeductions(input, config);

  // Calculate taxable income
  const taxableIncome = Math.max(0, input.grossIncome - totalDeductions);

  // Calculate bracket breakdown
  const bracketBreakdown = calculateBracketBreakdown(taxableIncome, brackets);

  // Sum up total tax
  const totalTax = bracketBreakdown.reduce(
    (sum, bracket) => sum + bracket.taxAmount,
    0
  );

  // Calculate effective rate
  const effectiveRate = input.grossIncome > 0 ? totalTax / input.grossIncome : 0;

  // Calculate take-home (gross - tax - SSF employee contribution)
  const takeHome = input.grossIncome - totalTax - input.ssfContribution;

  return {
    grossIncome: input.grossIncome,
    totalDeductions,
    taxableIncome,
    totalTax,
    effectiveRate,
    takeHome,
    bracketBreakdown,
  };
}

/**
 * Calculate tax for a simple scenario (just income, no deductions)
 */
export function calculateSimpleTax(
  grossIncome: number,
  maritalStatus: MaritalStatus = "unmarried",
  fiscalYear?: string
): TaxResult {
  return calculateIncomeTax(
    {
      grossIncome,
      maritalStatus,
      ssfContribution: 0,
      remoteAreaAllowance: 0,
      medicalAllowance: 0,
      festivalAllowance: 0,
      otherDeductions: 0,
    },
    fiscalYear
  );
}

/**
 * Calculate tax with SSF deduction
 */
export function calculateTaxWithSSF(
  grossIncome: number,
  ssfContribution: number,
  maritalStatus: MaritalStatus = "unmarried",
  fiscalYear?: string
): TaxResult {
  return calculateIncomeTax(
    {
      grossIncome,
      maritalStatus,
      ssfContribution,
      remoteAreaAllowance: 0,
      medicalAllowance: 0,
      festivalAllowance: 0,
      otherDeductions: 0,
    },
    fiscalYear
  );
}

/**
 * Estimate tax at different income levels (for charts/comparisons)
 */
export function generateTaxCurve(
  minIncome: number,
  maxIncome: number,
  steps: number,
  maritalStatus: MaritalStatus = "unmarried",
  fiscalYear?: string
): Array<{ income: number; tax: number; effectiveRate: number }> {
  const curve: Array<{ income: number; tax: number; effectiveRate: number }> = [];
  const stepSize = (maxIncome - minIncome) / steps;

  for (let i = 0; i <= steps; i++) {
    const income = minIncome + stepSize * i;
    const result = calculateSimpleTax(income, maritalStatus, fiscalYear);
    curve.push({
      income,
      tax: result.totalTax,
      effectiveRate: result.effectiveRate,
    });
  }

  return curve;
}
