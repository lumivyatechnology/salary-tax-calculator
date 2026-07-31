"use client";

import { useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useUrlState } from "@/hooks/useUrlState";
import {
  type SalaryMode,
  type Gender,
  type FundType,
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
  basicSalary: number;   // Monthly mode: monthly basic | CTC mode: annual CTC
  allowance: number;     // Monthly mode: monthly allowance | CTC mode: annual allowance
  bonus: number;         // Annual bonus
  gender: Gender;
  fundType: FundType;
  lifeInsurance: number;
  medicalInsurance: number;
  citContribution: number;
}

const defaultState: IncomeTaxState = {
  salaryMode: "monthly",
  basicSalary: 0,
  allowance: 0,
  bonus: 0,
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
      "basicSalary",
      "allowance",
      "bonus",
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
    if (state.basicSalary <= 0) return null;

    const input: TaxInput = {
      salaryMode: state.salaryMode,
      basicSalary: state.basicSalary,
      allowance: state.allowance,
      bonus: state.bonus,
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
              id="basicSalary"
              label={state.salaryMode === "monthly" ? "Monthly Basic Salary" : "Annual CTC"}
              value={state.basicSalary}
              onChange={(v) => setField("basicSalary", v)}
              helpText={
                state.salaryMode === "monthly"
                  ? "Your monthly basic salary"
                  : "Total cost to company per year"
              }
            />
            <CurrencyInput
              id="allowance"
              label={state.salaryMode === "monthly" ? "Monthly Allowance" : "Annual Allowance"}
              value={state.allowance}
              onChange={(v) => setField("allowance", v)}
              helpText={
                state.salaryMode === "monthly"
                  ? "Extra allowance on top of basic (HRA, DA, etc.)"
                  : "Part of CTC (HRA, DA, etc.)"
              }
            />
            <CurrencyInput
              id="bonus"
              label="Annual Bonus"
              value={state.bonus}
              onChange={(v) => setField("bonus", v)}
              helpText={
                state.salaryMode === "monthly"
                  ? "Added to annual income for tax"
                  : "Part of CTC"
              }
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              value={result.annualGrossIncome + (result.employerContribution ?? 0)}
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
              value={result.monthlyTakeHome - Math.round(state.bonus / 12)}
              variant="success"
              description="Actual cash received monthly"
            />
            <ResultCard
              title="Annual Take-Home"
              value={result.annualTakeHome}
              variant="success"
              description="Actual cash received annually"
            />
          </ResultGrid>

          {/* Detailed Breakdowns Accordions */}
          <div className="space-y-4">
            {/* Monthly Summary */}
            <Accordion className="rounded-lg border bg-card">
              <AccordionItem value="monthly" className="border-none">
                <AccordionTrigger className="px-4 py-3 font-semibold">Monthly Salary Breakdown</AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <MonthlySummaryTable result={result} bonus={state.bonus} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Fund Contribution Details */}
            <Accordion className="rounded-lg border bg-card">
              <AccordionItem value="fund" className="border-none">
                <AccordionTrigger className="px-4 py-3 font-semibold">
                  {result.fundType === "ssf" ? "SSF Contribution Breakdown" : "EPF Contribution Breakdown"}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <FundContributionTable result={result} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Deduction Breakdown */}
            <Accordion className="rounded-lg border bg-card">
              <AccordionItem value="deduction" className="border-none">
                <AccordionTrigger className="px-4 py-3 font-semibold">Tax Deductions Applied</AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <DeductionBreakdownTable result={result} citContribution={state.citContribution} />
                  <p className="mt-4 text-xs text-muted-foreground">
                    <strong>1/3 Rule:</strong> Total retirement fund deduction (SSF/EPF + CIT) is capped at
                    the lower of 1/3 of annual income or Rs 5,00,000.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Tax Bracket Breakdown */}
            <Accordion className="rounded-lg border bg-card">
              <AccordionItem value="bracket" className="border-none">
                <AccordionTrigger className="px-4 py-3 font-semibold">Tax Calculation by Bracket</AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <TaxBracketTable result={result} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
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
