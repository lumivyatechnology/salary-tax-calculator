"use client";

import { useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUrlState } from "@/hooks/useUrlState";
import {
  calculateIncomeTax,
  DEFAULT_FISCAL_YEAR,
  type MaritalStatus,
} from "@/lib/tax";
import {
  TaxDisclaimer,
  TaxBreakdownTable,
  ResultCard,
  ResultGrid,
  ShareButton,
  CurrencyInput,
  MaritalStatusSelect,
  FiscalYearSelect,
} from "@/modules/tax/components";

interface IncomeTaxState {
  grossIncome: number;
  maritalStatus: MaritalStatus;
  ssfContribution: number;
  remoteAreaAllowance: number;
  medicalAllowance: number;
  festivalAllowance: number;
  otherDeductions: number;
  fiscalYear: string;
}

const defaultState: IncomeTaxState = {
  grossIncome: 0,
  maritalStatus: "unmarried",
  ssfContribution: 0,
  remoteAreaAllowance: 0,
  medicalAllowance: 0,
  festivalAllowance: 0,
  otherDeductions: 0,
  fiscalYear: DEFAULT_FISCAL_YEAR,
};

function IncomeTaxCalculatorContent() {
  const { state, setField, getShareableUrl } = useUrlState<IncomeTaxState>({
    defaultValues: defaultState,
    keys: [
      "grossIncome",
      "maritalStatus",
      "ssfContribution",
      "remoteAreaAllowance",
      "medicalAllowance",
      "festivalAllowance",
      "otherDeductions",
      "fiscalYear",
    ],
    debounceMs: 300,
  });

  // Calculate tax reactively
  const result = useMemo(() => {
    if (state.grossIncome <= 0) return null;

    return calculateIncomeTax(
      {
        grossIncome: state.grossIncome,
        maritalStatus: state.maritalStatus,
        ssfContribution: state.ssfContribution,
        remoteAreaAllowance: state.remoteAreaAllowance,
        medicalAllowance: state.medicalAllowance,
        festivalAllowance: state.festivalAllowance,
        otherDeductions: state.otherDeductions,
      },
      state.fiscalYear
    );
  }, [state]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income Tax Calculator</h1>
          <p className="text-muted-foreground">
            Calculate Nepal income tax with bracket breakdown
          </p>
        </div>
        <ShareButton getUrl={getShareableUrl} />
      </div>

      <TaxDisclaimer />

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Income Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CurrencyInput
              id="grossIncome"
              label="Annual Gross Income"
              value={state.grossIncome}
              onChange={(v) => setField("grossIncome", v)}
              helpText="Total annual salary before deductions"
            />
            <MaritalStatusSelect
              value={state.maritalStatus}
              onChange={(v) => setField("maritalStatus", v)}
            />
            <FiscalYearSelect
              value={state.fiscalYear}
              onChange={(v) => setField("fiscalYear", v)}
            />
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-medium">Deductions & Allowances</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CurrencyInput
                id="ssfContribution"
                label="SSF Contribution (Annual)"
                value={state.ssfContribution}
                onChange={(v) => setField("ssfContribution", v)}
                helpText="Employee's annual SSF contribution"
              />
              <CurrencyInput
                id="remoteAreaAllowance"
                label="Remote Area Allowance"
                value={state.remoteAreaAllowance}
                onChange={(v) => setField("remoteAreaAllowance", v)}
                helpText="50% is tax-exempt"
              />
              <CurrencyInput
                id="medicalAllowance"
                label="Medical Allowance"
                value={state.medicalAllowance}
                onChange={(v) => setField("medicalAllowance", v)}
                helpText="Up to Rs 75,000 exempt"
              />
              <CurrencyInput
                id="festivalAllowance"
                label="Festival Allowance"
                value={state.festivalAllowance}
                onChange={(v) => setField("festivalAllowance", v)}
                helpText="1 month salary equivalent exempt"
              />
              <CurrencyInput
                id="otherDeductions"
                label="Other Deductions"
                value={state.otherDeductions}
                onChange={(v) => setField("otherDeductions", v)}
                helpText="Insurance, donations, etc."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <ResultGrid>
            <ResultCard
              title="Gross Income"
              value={result.grossIncome}
              description="Total annual income"
            />
            <ResultCard
              title="Total Deductions"
              value={result.totalDeductions}
              description="SSF + allowances"
            />
            <ResultCard
              title="Taxable Income"
              value={result.taxableIncome}
              variant="highlight"
              description="After deductions"
            />
            <ResultCard
              title="Total Tax"
              value={result.totalTax}
              variant="warning"
              description={`Effective rate: ${(result.effectiveRate * 100).toFixed(2)}%`}
            />
          </ResultGrid>

          <Card>
            <CardHeader>
              <CardTitle>Tax Breakdown by Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxBreakdownTable breakdown={result.bracketBreakdown} />
            </CardContent>
          </Card>

          <ResultGrid className="sm:grid-cols-2">
            <ResultCard
              title="Annual Take-Home"
              value={result.takeHome}
              variant="success"
              description="After tax and SSF"
            />
            <ResultCard
              title="Monthly Take-Home"
              value={result.takeHome / 12}
              variant="success"
              description="Estimated monthly"
            />
          </ResultGrid>
        </>
      )}

      {!result && state.grossIncome <= 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Enter your income details above to see tax calculation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function IncomeTaxPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <IncomeTaxCalculatorContent />
    </Suspense>
  );
}
