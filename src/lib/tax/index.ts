/**
 * Tax Module - Main Export
 */

// Config exports
export {
  getTaxConfig,
  getAvailableFiscalYears,
  currentConfig,
  DEFAULT_FISCAL_YEAR,
  availableConfigs,
} from "./config";

export type {
  TaxConfig,
  TaxBracket,
  TaxInput,
  TaxResult,
  BracketBreakdown,
  SSFConfig,
  SSFResult,
  MaritalStatus,
  IncomeSource,
  MultiIncomeResult,
  AllowanceConfig,
} from "./config/types";

// Income tax calculation exports
export {
  calculateIncomeTax,
  calculateSimpleTax,
  calculateTaxWithSSF,
  calculateBracketBreakdown,
  calculateDeductions,
  getBrackets,
  generateTaxCurve,
} from "./income-tax";

// SSF calculation exports
export {
  calculateSSF,
  calculateSSFFromAnnual,
  calculateCustomSSF,
  getSSFLimits,
  generateSSFOptimizationData,
} from "./ssf";

// Multi-income calculation exports
export {
  calculateMultiIncomeTax,
  calculateExpectedTDS,
  createIncomeSource,
  getIncomeTypes,
} from "./multi-income";

// Utility exports
export {
  formatCurrency,
  formatPercentage,
  parseCurrency,
  validateIncome,
  validateSSFContribution,
  debounce,
  annualToMonthly,
  monthlyToAnnual,
  roundToRupee,
  generateId,
  clamp,
} from "./utils";
