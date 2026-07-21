/**
 * Tax Configuration Types
 * These types define the structure for tax rules that can be easily
 * updated when tax laws change. All monetary values are in NPR.
 */

export interface TaxBracket {
  /** Minimum income for this bracket (inclusive) */
  min: number;
  /** Maximum income for this bracket (inclusive), null = no upper limit */
  max: number | null;
  /** Tax rate as decimal (0.01 = 1%, 0.10 = 10%) */
  rate: number;
  /** Human-readable label for display */
  label?: string;
}

export interface SSFConfig {
  /** Employee contribution rate as decimal */
  employeeRate: number;
  /** Employer contribution rate as decimal */
  employerRate: number;
  /** Maximum monthly base salary for SSF calculation */
  maxMonthlySalary: number;
  /** Whether SSF contribution is tax deductible */
  isTaxDeductible: boolean;
}

export interface AllowanceConfig {
  /** Remote area allowance */
  remoteArea: {
    enabled: boolean;
    /** Percentage of basic salary that's tax-exempt */
    exemptPercentage: number;
  };
  /** Medical allowance */
  medical: {
    enabled: boolean;
    /** Maximum annual exempt amount */
    maxExemptAmount: number;
  };
  /** Festival allowance (Dashain, etc.) */
  festival: {
    enabled: boolean;
    /** Number of months salary equivalent that's exempt */
    exemptMonths: number;
  };
}

export interface TaxConfig {
  /** Fiscal year identifier (e.g., "2083/84") */
  fiscalYear: string;
  /** Display name for the fiscal year */
  fiscalYearDisplay: string;
  /** Tax brackets for unmarried individuals */
  unmarriedBrackets: TaxBracket[];
  /** Tax brackets for married individuals */
  marriedBrackets: TaxBracket[];
  /** Social Security Fund configuration */
  ssf: SSFConfig;
  /** Allowance rules */
  allowances: AllowanceConfig;
  /** TDS (Tax Deducted at Source) rates for different income types */
  tdsRates: {
    salary: number;
    interest: number;
    dividend: number;
    rental: number;
    other: number;
  };
}

export type MaritalStatus = "unmarried" | "married";

export interface TaxInput {
  /** Annual gross income */
  grossIncome: number;
  /** Marital status */
  maritalStatus: MaritalStatus;
  /** Annual SSF contribution (employee portion) */
  ssfContribution: number;
  /** Remote area allowance received */
  remoteAreaAllowance: number;
  /** Medical allowance received */
  medicalAllowance: number;
  /** Festival allowance received */
  festivalAllowance: number;
  /** Other deductions */
  otherDeductions: number;
}

export interface BracketBreakdown {
  /** Bracket info */
  bracket: TaxBracket;
  /** Amount of income taxed in this bracket */
  taxableInBracket: number;
  /** Tax amount for this bracket */
  taxAmount: number;
}

export interface TaxResult {
  /** Original gross income */
  grossIncome: number;
  /** Total deductions applied */
  totalDeductions: number;
  /** Taxable income after deductions */
  taxableIncome: number;
  /** Total tax liability */
  totalTax: number;
  /** Effective tax rate as decimal */
  effectiveRate: number;
  /** Net take-home after tax and SSF */
  takeHome: number;
  /** Detailed breakdown by bracket */
  bracketBreakdown: BracketBreakdown[];
}

export interface SSFResult {
  /** Monthly base salary used for calculation */
  monthlyBaseSalary: number;
  /** Annual base salary */
  annualBaseSalary: number;
  /** Employee monthly contribution */
  employeeMonthly: number;
  /** Employer monthly contribution */
  employerMonthly: number;
  /** Employee annual contribution */
  employeeAnnual: number;
  /** Employer annual contribution */
  employerAnnual: number;
  /** Total annual contribution (employee + employer) */
  totalAnnual: number;
  /** Whether salary cap was applied */
  capApplied: boolean;
}

export interface IncomeSource {
  /** Unique identifier */
  id: string;
  /** Source name/description */
  name: string;
  /** Annual income amount */
  amount: number;
  /** Whether TDS was already deducted */
  hasTDS: boolean;
  /** TDS amount already deducted (if applicable) */
  tdsAmount: number;
  /** Income type for TDS rate lookup */
  incomeType: keyof TaxConfig["tdsRates"];
}

export interface MultiIncomeResult {
  /** All income sources */
  sources: IncomeSource[];
  /** Total combined income */
  totalIncome: number;
  /** Total tax liability on combined income */
  totalTaxLiability: number;
  /** Total TDS already paid */
  totalTDSPaid: number;
  /** Balance: positive = due, negative = refund */
  balance: number;
  /** Detailed tax calculation result */
  taxResult: TaxResult;
}
