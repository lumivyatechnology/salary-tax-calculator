/**
 * Nepal Income Tax Calculator - Calculation Logic
 * 
 * Tax Year: FY 2083/84 (2026/27)
 */

// ============================================================================
// Types
// ============================================================================

export type SalaryMode = "monthly" | "ctc";
export type Gender = "male" | "female";
export type FundType = "epf" | "ssf";

export interface TaxInput {
  salaryMode: SalaryMode;
  // Monthly mode: Monthly Basic Salary | CTC mode: Annual CTC
  basicSalary: number;
  // Monthly mode: Monthly Allowance (extra) | CTC mode: Annual Allowance (part of CTC)
  allowance: number;
  // Annual bonus - Monthly mode: added to annual | CTC mode: part of CTC
  bonus: number;
  gender: Gender;
  fundType: FundType;
  lifeInsurance: number;
  medicalInsurance: number;
  citContribution: number;
}

export interface SSFBreakdown {
  // Employee (11%)
  employeePF: number;         // 10%
  employeeAdditional: number; // 1%
  employeeContribution: number;      // 11%

  // Employer (20%)
  employerPF: number;         // 10%
  employerGratuity: number;   // 8.33%
  employerAdditional: number; // 1.67%
  employerContribution: number;      // 20%

  // SST
  sst: number;                // 1%

  // Totals
  totalContribution: number;  // 31%
}

export interface EPFBreakdown {
  employeeContribution: number;  // 10%
  employerContribution: number;  // 10%
  totalContribution: number;     // 20%
}

export interface TaxBracketResult {
  label: string;
  min: number;
  max: number | null;
  rate: number;
  incomeInBracket: number;
  taxAmount: number;
  waived: boolean;  // True if bracket waived due to SSF contribution
}

export interface DeductionBreakdown {
  retirementFundDeduction: number;  // SSF/EPF employee + CIT (capped by 1/3 rule)
  lifeInsuranceDeduction: number;   // Max 40,000
  medicalInsuranceDeduction: number; // Max 20,000
  totalDeductions: number;
}

export interface TaxResult {
  // Income
  annualGrossIncome: number;
  monthlyGrossIncome: number;
  annualBasicSalary: number;

  // Fund contributions
  fundType: FundType;
  ssfBreakdown: SSFBreakdown | null;
  epfBreakdown: EPFBreakdown | null;
  employerContribution: number | null;

  // Deductions
  oneThirdLimit: number;
  maxRetirementDeduction: number;
  deductions: DeductionBreakdown;

  // Taxable income
  taxableIncome: number;

  // Tax calculation
  bracketBreakdown: TaxBracketResult[];
  grossTax: number;
  femaleRebate: number;
  finalTax: number;
  effectiveRate: number;
  ssfWaiverAmount: number;  // Amount saved by 1% bracket waiver for SSF contributors

  // Take-home
  annualTakeHome: number;
  monthlyTakeHome: number;

  // In-Hand (after personal deductions)
  annualInHand: number;
  monthlyInHand: number;

  // Bonus
  bonus: number; // Annual bonus amount (for display in breakdown)

  // Monthly breakdown
  monthlyTax: number;
  monthlyEmployeeContribution: number;
}

// ============================================================================
// Constants
// ============================================================================

export const TAX_BRACKETS = [
  { min: 0, max: 1000000, rate: 0.01, label: "Up to Rs 10,00,000" },
  { min: 1000000, max: 1500000, rate: 0.10, label: "Rs 10,00,001 - 15,00,000" },
  { min: 1500000, max: 2500000, rate: 0.20, label: "Rs 15,00,001 - 25,00,000" },
  { min: 2500000, max: 4000000, rate: 0.27, label: "Rs 25,00,001 - 40,00,000" },
  { min: 4000000, max: null, rate: 0.29, label: "Above Rs 40,00,000" },
] as const;

export const LIMITS = {
  LIFE_INSURANCE_MAX: 40000,
  MEDICAL_INSURANCE_MAX: 20000,
  ONE_THIRD_RULE_MAX: 500000,
  FEMALE_REBATE_RATE: 0.10,
} as const;

export const SSF_RATES = {
  EMPLOYEE_PF: 0.10,
  EMPLOYEE_ADDITIONAL: 0.01,
  EMPLOYEE_TOTAL: 0.11,
  EMPLOYER_PF: 0.10,
  EMPLOYER_GRATUITY: 0.0833,
  EMPLOYER_ADDITIONAL: 0.0167,
  EMPLOYER_TOTAL: 0.20,
  SST: 0.01,
  TOTAL: 0.31,
} as const;

export const EPF_RATES = {
  EMPLOYEE: 0.10,
  EMPLOYER: 0.10,
  TOTAL: 0.20,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate annual gross income and basic salary from input
 * 
 * Monthly mode:
 *   - Basic = basicSalary * 12
 *   - Gross = (basicSalary + allowance) * 12 + bonus
 * 
 * CTC mode:
 *   - Gross = basicSalary (CTC)
 *   - Basic = CTC - allowance - bonus
 */
export function calculateIncomeFromInput(input: TaxInput): {
  annualGrossIncome: number;
  annualBasicSalary: number;
  annualAllowance: number;
  annualBonus: number;
} {
  if (input.salaryMode === "monthly") {
    // Monthly mode: basic and allowance are monthly, bonus is annual
    const annualBasicSalary = input.basicSalary * 12;
    const annualAllowance = input.allowance * 12;
    const annualBonus = input.bonus;
    const annualGrossIncome = annualBasicSalary + annualAllowance + annualBonus;

    return {
      annualGrossIncome,
      annualBasicSalary,
      annualAllowance,
      annualBonus,
    };
  } else {
    // CTC mode: basicSalary field holds CTC, allowance and bonus are parts of CTC
    const annualCTC = input.basicSalary;
    const annualAllowance = input.allowance;
    const annualBonus = input.bonus;
    const annualBasicSalary = annualCTC - annualAllowance - annualBonus;

    return {
      annualGrossIncome: annualCTC,
      annualBasicSalary: Math.max(0, annualBasicSalary), // Ensure non-negative
      annualAllowance,
      annualBonus,
    };
  }
}

/**
 * Calculate SSF contributions breakdown
 */
export function calculateSSF(annualBasicSalary: number): SSFBreakdown {
  const employeePF = annualBasicSalary * SSF_RATES.EMPLOYEE_PF;
  const employeeAdditional = annualBasicSalary * SSF_RATES.EMPLOYEE_ADDITIONAL;
  const employeeContribution = annualBasicSalary * SSF_RATES.EMPLOYEE_TOTAL;

  const employerPF = annualBasicSalary * SSF_RATES.EMPLOYER_PF;
  const employerGratuity = annualBasicSalary * SSF_RATES.EMPLOYER_GRATUITY;
  const employerAdditional = annualBasicSalary * SSF_RATES.EMPLOYER_ADDITIONAL;
  const employerContribution = annualBasicSalary * SSF_RATES.EMPLOYER_TOTAL;

  const sst = annualBasicSalary * SSF_RATES.SST;

  return {
    employeePF: Math.round(employeePF),
    employeeAdditional: Math.round(employeeAdditional),
    employeeContribution: Math.round(employeeContribution),
    employerPF: Math.round(employerPF),
    employerGratuity: Math.round(employerGratuity),
    employerAdditional: Math.round(employerAdditional),
    employerContribution: Math.round(employerContribution),
    sst: Math.round(sst),
    totalContribution: Math.round(annualBasicSalary * SSF_RATES.TOTAL),
  };
}

/**
 * Calculate EPF contributions breakdown
 */
export function calculateEPF(annualBasicSalary: number): EPFBreakdown {
  return {
    employeeContribution: Math.round(annualBasicSalary * EPF_RATES.EMPLOYEE),
    employerContribution: Math.round(annualBasicSalary * EPF_RATES.EMPLOYER),
    totalContribution: Math.round(annualBasicSalary * EPF_RATES.TOTAL),
  };
}

/**
 * Calculate tax using progressive brackets
 * @param taxableIncome - Total taxable income
 * @param isSSFContributor - If true, first bracket (1%) is waived
 */
export function calculateBracketTax(taxableIncome: number, isSSFContributor: boolean = false): TaxBracketResult[] {
  const results: TaxBracketResult[] = [];
  let remainingIncome = taxableIncome;

  for (const bracket of TAX_BRACKETS) {
    const bracketMin = bracket.min;
    const bracketMax = bracket.max ?? Infinity;
    const bracketSize = bracketMax - bracketMin;

    // Check if this is the first bracket (1%) and SSF contributor gets waiver
    const isFirstBracket = bracket.min === 0 && bracket.rate === 0.01;
    const isWaived = isFirstBracket && isSSFContributor;

    if (remainingIncome <= 0) {
      results.push({
        label: isWaived ? `${bracket.label} (SSF Waived)` : bracket.label,
        min: bracket.min,
        max: bracket.max,
        rate: bracket.rate,
        incomeInBracket: 0,
        taxAmount: 0,
        waived: isWaived,
      });
      continue;
    }

    const incomeInBracket = Math.min(remainingIncome, bracketSize);
    // If waived, tax amount is 0 regardless of income in bracket
    const taxAmount = isWaived ? 0 : incomeInBracket * bracket.rate;

    results.push({
      label: isWaived ? `${bracket.label} (SSF Waived)` : bracket.label,
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      incomeInBracket: Math.round(incomeInBracket),
      taxAmount: Math.round(taxAmount),
      waived: isWaived,
    });

    remainingIncome -= incomeInBracket;
  }

  return results;
}

// ============================================================================
// Main Calculation Function
// ============================================================================

export function calculateIncomeTax(input: TaxInput): TaxResult {
  // 1. Calculate annual gross income and basic salary based on mode
  const { annualGrossIncome, annualBasicSalary, annualBonus } = calculateIncomeFromInput(input);
  const monthlyGrossIncome = annualGrossIncome / 12;

  // 2. Basic salary already calculated from input
  // (No percentage calculation needed anymore)

  // 3. Calculate fund contributions
  const ssfBreakdown = input.fundType === "ssf"
    ? calculateSSF(annualBasicSalary)
    : null;
  const epfBreakdown = input.fundType === "epf"
    ? calculateEPF(annualBasicSalary)
    : null;

  // Employee contribution for deduction calculation
  const employeeContribution = input.fundType === "ssf"
    ? ssfBreakdown!.employeeContribution
    : epfBreakdown!.employeeContribution;
  const employerContribution = input.fundType === "ssf"
    ? ssfBreakdown!.employerContribution
    : epfBreakdown!.employerContribution;

  // 4. Calculate 1/3 rule limit
  const oneThirdLimit = Math.min(
    annualGrossIncome / 3,
    LIMITS.ONE_THIRD_RULE_MAX
  );

  // Total retirement fund (employee SSF/EPF + CIT)
  const totalRetirementContribution = employeeContribution + input.citContribution + employerContribution;
  const retirementFundDeduction = Math.min(totalRetirementContribution, oneThirdLimit);

  // 5. Calculate insurance deductions
  const lifeInsuranceDeduction = Math.min(input.lifeInsurance, LIMITS.LIFE_INSURANCE_MAX);
  const medicalInsuranceDeduction = Math.min(input.medicalInsurance, LIMITS.MEDICAL_INSURANCE_MAX);

  // 6. Total deductions
  const totalDeductions = retirementFundDeduction + lifeInsuranceDeduction + medicalInsuranceDeduction;

  const deductions: DeductionBreakdown = {
    retirementFundDeduction: Math.round(retirementFundDeduction),
    lifeInsuranceDeduction: Math.round(lifeInsuranceDeduction),
    medicalInsuranceDeduction: Math.round(medicalInsuranceDeduction),
    totalDeductions: Math.round(totalDeductions),
  };

  // 7. Calculate taxable income
  const taxableIncome = Math.max(0, annualGrossIncome - totalDeductions);

  // 8. Calculate tax by brackets (SSF contributors get 1% bracket waived)
  const isSSFContributor = input.fundType === "ssf";
  const bracketBreakdown = calculateBracketTax(taxableIncome, isSSFContributor);
  const grossTax = bracketBreakdown.reduce((sum, b) => sum + b.taxAmount, 0);

  // 8.1 Calculate SSF waiver amount (1% of income in first bracket, max 10L)
  const ssfWaiverAmount = isSSFContributor
    ? Math.round(Math.min(taxableIncome, 1000000) * 0.01)
    : 0;

  // 9. Female rebate
  const femaleRebate = input.gender === "female"
    ? Math.round(grossTax * LIMITS.FEMALE_REBATE_RATE)
    : 0;

  // 10. Final tax
  const finalTax = grossTax - femaleRebate;
  const effectiveRate = annualGrossIncome > 0 ? finalTax / annualGrossIncome : 0;

  // 11. Take-home calculation
  // Take-home = Gross - Tax - Employee contribution
  const annualTakeHome = annualGrossIncome - finalTax - employeeContribution;
  const monthlyTakeHome = annualTakeHome / 12;

  // 12. In-hand calculation (actual cash after personal deductions)
  // Bonus is paid yearly, not monthly, so deduct from in-hand
  const annualInHand = annualTakeHome - input.citContribution - input.lifeInsurance - input.medicalInsurance - annualBonus;
  const monthlyInHand = annualInHand / 12;

  return {
    annualGrossIncome: Math.round(annualGrossIncome),
    monthlyGrossIncome: Math.round(monthlyGrossIncome),
    annualBasicSalary: Math.round(annualBasicSalary),

    fundType: input.fundType,
    ssfBreakdown,
    epfBreakdown,
    employerContribution,

    oneThirdLimit: Math.round(oneThirdLimit),
    maxRetirementDeduction: LIMITS.ONE_THIRD_RULE_MAX,
    deductions,

    taxableIncome: Math.round(taxableIncome),

    bracketBreakdown,
    grossTax: Math.round(grossTax),
    femaleRebate: Math.round(femaleRebate),
    finalTax: Math.round(finalTax),
    effectiveRate,
    ssfWaiverAmount,

    annualTakeHome: Math.round(annualTakeHome),
    monthlyTakeHome: Math.round(monthlyTakeHome),

    annualInHand: Math.round(annualInHand),
    monthlyInHand: Math.round(monthlyInHand),

    bonus: annualBonus,

    monthlyTax: Math.round(finalTax / 12),
    monthlyEmployeeContribution: Math.round(employeeContribution / 12),
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `Rs ${new Intl.NumberFormat("en-NP").format(Math.round(amount))}`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(decimal: number, decimals: number = 2): string {
  return `${(decimal * 100).toFixed(decimals)}%`;
}
