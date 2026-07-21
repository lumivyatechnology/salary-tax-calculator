/**
 * Social Security Fund (SSF) Calculation Functions
 * 
 * Pure functions for calculating Nepal SSF contributions.
 */

import type { TaxConfig, SSFResult } from "./config/types";
import { getTaxConfig } from "./config";

/**
 * Calculate SSF contributions based on monthly salary
 */
export function calculateSSF(
  monthlyBaseSalary: number,
  fiscalYear?: string
): SSFResult {
  const config = getTaxConfig(fiscalYear);
  const { employeeRate, employerRate, maxMonthlySalary } = config.ssf;

  // Apply salary cap if applicable
  const capApplied = monthlyBaseSalary > maxMonthlySalary;
  const effectiveMonthlySalary = Math.min(monthlyBaseSalary, maxMonthlySalary);

  // Calculate monthly contributions
  const employeeMonthly = effectiveMonthlySalary * employeeRate;
  const employerMonthly = effectiveMonthlySalary * employerRate;

  // Calculate annual contributions (12 months)
  const employeeAnnual = employeeMonthly * 12;
  const employerAnnual = employerMonthly * 12;
  const totalAnnual = employeeAnnual + employerAnnual;

  return {
    monthlyBaseSalary,
    annualBaseSalary: monthlyBaseSalary * 12,
    employeeMonthly,
    employerMonthly,
    employeeAnnual,
    employerAnnual,
    totalAnnual,
    capApplied,
  };
}

/**
 * Calculate SSF from annual salary
 */
export function calculateSSFFromAnnual(
  annualBaseSalary: number,
  fiscalYear?: string
): SSFResult {
  const monthlyBaseSalary = annualBaseSalary / 12;
  return calculateSSF(monthlyBaseSalary, fiscalYear);
}

/**
 * Get minimum and maximum SSF contribution amounts
 */
export function getSSFLimits(fiscalYear?: string): {
  minMonthly: number;
  maxMonthly: number;
  minAnnual: number;
  maxAnnual: number;
  employeeRate: number;
  employerRate: number;
  maxMonthlySalary: number;
} {
  const config = getTaxConfig(fiscalYear);
  const { employeeRate, employerRate, maxMonthlySalary } = config.ssf;

  // Minimum is 0 (for very low salaries or no enrollment)
  const minMonthly = 0;
  // Maximum is based on salary cap
  const maxMonthly = maxMonthlySalary * employeeRate;

  return {
    minMonthly,
    maxMonthly,
    minAnnual: minMonthly * 12,
    maxAnnual: maxMonthly * 12,
    employeeRate,
    employerRate,
    maxMonthlySalary,
  };
}

/**
 * Calculate custom SSF contribution (for optimizer)
 * Allows specifying a custom contribution amount within limits
 */
export function calculateCustomSSF(
  monthlyBaseSalary: number,
  customEmployeeContribution: number,
  fiscalYear?: string
): SSFResult {
  const config = getTaxConfig(fiscalYear);
  const { employerRate, maxMonthlySalary } = config.ssf;

  // Cap the base salary for employer calculation
  const effectiveMonthlySalary = Math.min(monthlyBaseSalary, maxMonthlySalary);
  const capApplied = monthlyBaseSalary > maxMonthlySalary;

  // Employer contribution is always based on rate
  const employerMonthly = effectiveMonthlySalary * employerRate;

  // Use custom employee contribution
  const employeeMonthly = customEmployeeContribution;

  return {
    monthlyBaseSalary,
    annualBaseSalary: monthlyBaseSalary * 12,
    employeeMonthly,
    employerMonthly,
    employeeAnnual: employeeMonthly * 12,
    employerAnnual: employerMonthly * 12,
    totalAnnual: (employeeMonthly + employerMonthly) * 12,
    capApplied,
  };
}

/**
 * Generate SSF optimization comparison data
 * Shows tax impact at different SSF contribution levels
 */
export function generateSSFOptimizationData(
  annualGrossSalary: number,
  steps: number = 10,
  fiscalYear?: string
): Array<{
  ssfContribution: number;
  taxableIncome: number;
  taxPayable: number;
  netIncome: number;
  taxSavings: number;
}> {
  // Import dynamically to avoid circular dependency
  const { calculateTaxWithSSF, calculateSimpleTax } = require("./income-tax");
  
  const limits = getSSFLimits(fiscalYear);
  const maxAnnualContribution = limits.maxAnnual;
  
  // Calculate baseline tax (no SSF)
  const baselineTax = calculateSimpleTax(annualGrossSalary, "unmarried", fiscalYear);
  
  const data: Array<{
    ssfContribution: number;
    taxableIncome: number;
    taxPayable: number;
    netIncome: number;
    taxSavings: number;
  }> = [];

  const stepSize = maxAnnualContribution / steps;

  for (let i = 0; i <= steps; i++) {
    const ssfContribution = stepSize * i;
    const result = calculateTaxWithSSF(
      annualGrossSalary,
      ssfContribution,
      "unmarried",
      fiscalYear
    );

    data.push({
      ssfContribution,
      taxableIncome: result.taxableIncome,
      taxPayable: result.totalTax,
      netIncome: result.takeHome,
      taxSavings: baselineTax.totalTax - result.totalTax,
    });
  }

  return data;
}
