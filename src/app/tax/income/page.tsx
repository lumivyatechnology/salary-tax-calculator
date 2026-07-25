"use client";

import { useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUrlState } from "@/hooks/useUrlState";
import {
  type SalaryMode,
  type Gender,
  type FundType,
  type BasicSalaryMode,
  type TaxInput,
  calculateIncomeTax,
  formatCurrency,
  formatPercentage,
} from "./calculations";
import {
  CurrencyInput,
  SalaryModeToggle,
  GenderSelect,
  FundTypeSelect,
  BasicSalaryInput,
  ResultCard,
  ResultGrid,
  TaxBracketTable,
  DeductionBreakdownTable,
  FundContributionTable,
  MonthlySummaryTable,
  TaxDisclaimer,
  ShareButton,
} from "./components";

// ============================================================================
// State Types
// ============================================================================

interface IncomeTaxState {
  salaryMode: SalaryMode;
  salaryAmount: number;
  basicSalaryMode: BasicSalaryMode;
  basicSalaryValue: number;
  gender: Gender;
  fundType: FundType;
  lifeInsurance: number;
  medicalInsurance: number;
  citContribution: number;
}

const defaultState: IncomeTaxState = {
  salaryMode: "monthly",
  salaryAmount: 0,
  basicSalaryMode: "percentage",
  basicSalaryValue: 40,
  gender: "male",
  fundType: "ssf",
  lifeInsurance: 0,
  medicalInsurance: 0,
  citContribution: 0,
};

// ============================================================================
// Main Component
// ============================================================================

function IncomeTaxCalculatorContent() {
  const { state, setField, getShareableUrl } = useUrlState<IncomeTaxState>({
    defaultValues: defaultState,
    keys: [
      "salaryMode",
      "salaryAmount",
      "basicSalaryMode",
      "basicSalaryValue",
      "gender",
      "fundType",
      "lifeInsurance",
      "medicalInsurance",
      "citContribution",
    ],
    debounceMs: 300,
  });

  // Calculate tax reactively
  const result = useMemo(() => {
    if (state.salaryAmount <= 0) return null;
    if (state.basicSalaryValue <= 0) return null;

    const input: TaxInput = {
      salaryMode: state.salaryMode,
      salaryAmount: state.salaryAmount,
      basicSalaryMode: state.basicSalaryMode,
      basicSalaryValue: state.basicSalaryValue,
      gender: state.gender,
      fundType: state.fundType,
      lifeInsurance: state.lifeInsurance,
      medicalInsurance: state.medicalInsurance,
      citContribution: state.citContribution,
    };

    return calculateIncomeTax(input);
  }, [state]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nepal Income Tax Calculator</h1>
          <p className="text-muted-foreground">
            Calculate income tax with SSF/EPF deductions, insurance benefits, and female rebate
          </p>
        </div>
        <ShareButton getUrl={getShareableUrl} />
      </div>

      <TaxDisclaimer />

      {/* Salary Mode Toggle */}
      <div className="flex justify-center">
        <SalaryModeToggle
          value={state.salaryMode}
          onChange={(v) => setField("salaryMode", v)}
        />
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Income Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CurrencyInput
              id="salaryAmount"
              label={state.salaryMode === "monthly" ? "Monthly Gross Salary" : "Annual CTC"}
              value={state.salaryAmount}
              onChange={(v) => setField("salaryAmount", v)}
              helpText={
                state.salaryMode === "monthly"
                  ? "Your monthly salary before deductions"
                  : "Total cost to company per year"
              }
            />
            <GenderSelect
              value={state.gender}
              onChange={(v) => setField("gender", v)}
            />
            <FundTypeSelect
              value={state.fundType}
              onChange={(v) => setField("fundType", v)}
            />
          </div>

          <Separator />

          <BasicSalaryInput
            mode={state.basicSalaryMode}
            value={state.basicSalaryValue}
            onModeChange={(v) => setField("basicSalaryMode", v)}
            onValueChange={(v) => setField("basicSalaryValue", v)}
          />

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-medium">Insurance & Additional Deductions</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CurrencyInput
                id="lifeInsurance"
                label="Life Insurance Premium (Annual)"
                value={state.lifeInsurance}
                onChange={(v) => setField("lifeInsurance", v)}
                maxLimit={40000}
                helpText="Max deduction: Rs 40,000/year"
              />
              <CurrencyInput
                id="medicalInsurance"
                label="Medical Insurance Premium (Annual)"
                value={state.medicalInsurance}
                onChange={(v) => setField("medicalInsurance", v)}
                maxLimit={20000}
                helpText="Max deduction: Rs 20,000/year"
              />
              <CurrencyInput
                id="citContribution"
                label="CIT Contribution (Annual)"
                value={state.citContribution}
                onChange={(v) => setField("citContribution", v)}
                helpText="Citizen Investment Trust (optional)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary Cards */}
          <ResultGrid>
            <ResultCard
              title="Annual Gross Income"
              value={result.annualGrossIncome}
              description={`Basic: ${formatCurrency(result.annualBasicSalary)}`}
            />
            <ResultCard
              title="Total Deductions"
              value={result.deductions.totalDeductions}
              description="SSF/EPF + Insurance"
            />
            <ResultCard
              title="Taxable Income"
              value={result.taxableIncome}
              variant="highlight"
              description="After all deductions"
            />
            <ResultCard
              title="Annual Tax"
              value={result.finalTax}
              variant="warning"
              description={`Effective rate: ${formatPercentage(result.effectiveRate)}`}
            />
          </ResultGrid>

          {/* Take-Home Summary */}
          <ResultGrid className="sm:grid-cols-2">
            <ResultCard
              title="Monthly Take-Home"
              value={result.monthlyTakeHome}
              variant="success"
              description="After tax and fund deduction"
            />
            <ResultCard
              title="Annual Take-Home"
              value={result.annualTakeHome}
              variant="success"
              description="Net annual income"
            />
          </ResultGrid>

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Salary Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlySummaryTable result={result} />
            </CardContent>
          </Card>

          {/* Fund Contribution Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {result.fundType === "ssf" ? "SSF Contribution Breakdown" : "EPF Contribution Breakdown"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FundContributionTable result={result} />
            </CardContent>
          </Card>

          {/* Deduction Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Deductions Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <DeductionBreakdownTable result={result} citContribution={state.citContribution} />
              <p className="mt-4 text-xs text-muted-foreground">
                <strong>1/3 Rule:</strong> Total retirement fund deduction (SSF/EPF + CIT) is capped at
                the lower of 1/3 of annual income or Rs 5,00,000.
              </p>
            </CardContent>
          </Card>

          {/* Tax Bracket Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculation by Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxBracketTable result={result} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!result && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Enter your salary details above to calculate income tax
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Page Export
// ============================================================================

export default function IncomeTaxPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading calculator...</div>}>
      <IncomeTaxCalculatorContent />
    </Suspense>
  );
}
