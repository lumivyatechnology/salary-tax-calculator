/**
 * Nepal Tax Configuration - Fiscal Year 2083/84 (2026/27 AD)
 * 
 * IMPORTANT: Update this file when tax rules change.
 * All monetary values are in Nepalese Rupees (NPR).
 * 
 * Source: Nepal Income Tax Act / IRD Nepal
 * Last Updated: July 2026
 */

import type { TaxConfig } from "./types";

export const fy2083_84: TaxConfig = {
  fiscalYear: "2083/84",
  fiscalYearDisplay: "FY 2083/84 (2026/27)",

  // Tax brackets for unmarried individuals
  // Same brackets used for married initially - update when rates differ
  unmarriedBrackets: [
    {
      min: 0,
      max: 1000000,
      rate: 0.01,
      label: "Up to Rs 10,00,000",
    },
    {
      min: 1000001,
      max: 1500000,
      rate: 0.10,
      label: "Rs 10,00,001 - 15,00,000",
    },
    {
      min: 1500001,
      max: 2500000,
      rate: 0.20,
      label: "Rs 15,00,001 - 25,00,000",
    },
    {
      min: 2500001,
      max: 4000000,
      rate: 0.27,
      label: "Rs 25,00,001 - 40,00,000",
    },
    {
      min: 4000001,
      max: null,
      rate: 0.29,
      label: "Above Rs 40,00,000",
    },
  ],

  // Tax brackets for married individuals
  // Currently same as unmarried - update when government announces different rates
  marriedBrackets: [
    {
      min: 0,
      max: 1000000,
      rate: 0.01,
      label: "Up to Rs 10,00,000",
    },
    {
      min: 1000001,
      max: 1500000,
      rate: 0.10,
      label: "Rs 10,00,001 - 15,00,000",
    },
    {
      min: 1500001,
      max: 2500000,
      rate: 0.20,
      label: "Rs 15,00,001 - 25,00,000",
    },
    {
      min: 2500001,
      max: 4000000,
      rate: 0.27,
      label: "Rs 25,00,001 - 40,00,000",
    },
    {
      min: 4000001,
      max: null,
      rate: 0.29,
      label: "Above Rs 40,00,000",
    },
  ],

  // Social Security Fund (SSF) configuration
  ssf: {
    employeeRate: 0.11, // 11%
    employerRate: 0.20, // 20%
    maxMonthlySalary: 50000, // NPR 50,000 monthly cap
    isTaxDeductible: true,
  },

  // Allowance configurations
  allowances: {
    remoteArea: {
      enabled: true,
      exemptPercentage: 0.50, // 50% exempt
    },
    medical: {
      enabled: true,
      maxExemptAmount: 75000, // Up to NPR 75,000 annually
    },
    festival: {
      enabled: true,
      exemptMonths: 1, // 1 month salary equivalent
    },
  },

  // TDS rates for different income types
  tdsRates: {
    salary: 0.0, // TDS on salary varies by bracket, calculated separately
    interest: 0.05, // 5% on interest income
    dividend: 0.05, // 5% on dividend
    rental: 0.10, // 10% on rental income
    other: 0.15, // 15% on other income
  },
};

export default fy2083_84;
