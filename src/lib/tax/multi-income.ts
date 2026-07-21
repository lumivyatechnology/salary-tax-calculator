/**
 * Multi-Income Tax Calculation with TDS
 * 
 * Functions for handling multiple income sources and TDS reconciliation.
 */

import type {
  TaxConfig,
  IncomeSource,
  MultiIncomeResult,
  MaritalStatus,
} from "./config/types";
import { getTaxConfig } from "./config";
import { calculateIncomeTax } from "./income-tax";

/**
 * Calculate combined tax liability for multiple income sources
 */
export function calculateMultiIncomeTax(
  sources: IncomeSource[],
  maritalStatus: MaritalStatus = "unmarried",
  ssfContribution: number = 0,
  fiscalYear?: string
): MultiIncomeResult {
  // Calculate total income from all sources
  const totalIncome = sources.reduce((sum, source) => sum + source.amount, 0);

  // Calculate total TDS already paid
  const totalTDSPaid = sources.reduce(
    (sum, source) => sum + (source.hasTDS ? source.tdsAmount : 0),
    0
  );

  // Calculate tax on total combined income
  const taxResult = calculateIncomeTax(
    {
      grossIncome: totalIncome,
      maritalStatus,
      ssfContribution,
      remoteAreaAllowance: 0,
      medicalAllowance: 0,
      festivalAllowance: 0,
      otherDeductions: 0,
    },
    fiscalYear
  );

  // Calculate balance (positive = due, negative = refund)
  const balance = taxResult.totalTax - totalTDSPaid;

  return {
    sources,
    totalIncome,
    totalTaxLiability: taxResult.totalTax,
    totalTDSPaid,
    balance,
    taxResult,
  };
}

/**
 * Calculate expected TDS for an income source
 */
export function calculateExpectedTDS(
  amount: number,
  incomeType: keyof TaxConfig["tdsRates"],
  fiscalYear?: string
): number {
  const config = getTaxConfig(fiscalYear);
  const rate = config.tdsRates[incomeType];
  return amount * rate;
}

/**
 * Create a new income source with auto-calculated TDS
 */
export function createIncomeSource(
  name: string,
  amount: number,
  incomeType: keyof TaxConfig["tdsRates"],
  hasTDS: boolean = false,
  customTDSAmount?: number,
  fiscalYear?: string
): IncomeSource {
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  let tdsAmount = 0;
  if (hasTDS) {
    tdsAmount = customTDSAmount ?? calculateExpectedTDS(amount, incomeType, fiscalYear);
  }

  return {
    id,
    name,
    amount,
    hasTDS,
    tdsAmount,
    incomeType,
  };
}

/**
 * Get list of income types with labels
 */
export function getIncomeTypes(): Array<{
  value: keyof TaxConfig["tdsRates"];
  label: string;
  description: string;
}> {
  return [
    {
      value: "salary",
      label: "Salary/Wages",
      description: "Employment income",
    },
    {
      value: "interest",
      label: "Interest",
      description: "Bank deposits, bonds, etc.",
    },
    {
      value: "dividend",
      label: "Dividend",
      description: "Share dividends",
    },
    {
      value: "rental",
      label: "Rental Income",
      description: "Property rent",
    },
    {
      value: "other",
      label: "Other",
      description: "Freelance, consulting, etc.",
    },
  ];
}
