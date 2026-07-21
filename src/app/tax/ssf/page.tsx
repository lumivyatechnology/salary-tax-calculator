"use client";

import { useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUrlState } from "@/hooks/useUrlState";
import {
  calculateSSF,
  formatCurrency,
  formatPercentage,
  getSSFLimits,
} from "@/lib/tax";
import {
  TaxDisclaimer,
  ResultCard,
  ResultGrid,
  ShareButton,
  CurrencyInput,
} from "@/modules/tax/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SSFState {
  monthlyBaseSalary: number;
}

const defaultState: SSFState = {
  monthlyBaseSalary: 0,
};

function SSFCalculatorContent() {
  const { state, setField, getShareableUrl } = useUrlState<SSFState>({
    defaultValues: defaultState,
    keys: ["monthlyBaseSalary"],
    debounceMs: 300,
  });

  const limits = getSSFLimits();

  const result = useMemo(() => {
    if (state.monthlyBaseSalary <= 0) return null;
    return calculateSSF(state.monthlyBaseSalary);
  }, [state.monthlyBaseSalary]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SSF Calculator</h1>
          <p className="text-muted-foreground">
            Calculate Social Security Fund contributions
          </p>
        </div>
        <ShareButton getUrl={getShareableUrl} />
      </div>

      <TaxDisclaimer />

      {/* SSF Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle>SSF Contribution Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributor</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Max Monthly (at Rs 50,000 cap)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell className="text-right">
                  {formatPercentage(limits.employeeRate, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(limits.maxMonthly)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Employer</TableCell>
                <TableCell className="text-right">
                  {formatPercentage(limits.employerRate, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(limits.maxMonthlySalary * limits.employerRate)}
                </TableCell>
              </TableRow>
              <TableRow className="font-semibold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {formatPercentage(limits.employeeRate + limits.employerRate, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    limits.maxMonthlySalary * (limits.employeeRate + limits.employerRate)
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-4 text-xs text-muted-foreground">
            Note: SSF contribution is calculated on base salary capped at{" "}
            {formatCurrency(limits.maxMonthlySalary)} per month.
          </p>
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Your Salary</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyInput
            id="monthlyBaseSalary"
            label="Monthly Base Salary"
            value={state.monthlyBaseSalary}
            onChange={(v) => setField("monthlyBaseSalary", v)}
            helpText="Basic salary before allowances"
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {result.capApplied && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <p className="text-sm text-amber-900">
                  Salary cap applied. SSF calculated on maximum base of{" "}
                  {formatCurrency(limits.maxMonthlySalary)}/month instead of{" "}
                  {formatCurrency(state.monthlyBaseSalary)}.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Monthly Contributions</h2>
            <ResultGrid className="sm:grid-cols-3">
              <ResultCard
                title="Employee (You)"
                value={result.employeeMonthly}
                description={`${formatPercentage(limits.employeeRate, 0)} of base`}
              />
              <ResultCard
                title="Employer"
                value={result.employerMonthly}
                description={`${formatPercentage(limits.employerRate, 0)} of base`}
              />
              <ResultCard
                title="Total Monthly"
                value={result.employeeMonthly + result.employerMonthly}
                variant="highlight"
                description="Combined contribution"
              />
            </ResultGrid>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Annual Contributions</h2>
            <ResultGrid className="sm:grid-cols-3">
              <ResultCard
                title="Employee (You)"
                value={result.employeeAnnual}
                variant="success"
                description="Tax deductible"
              />
              <ResultCard
                title="Employer"
                value={result.employerAnnual}
                description="Employer's contribution"
              />
              <ResultCard
                title="Total Annual"
                value={result.totalAnnual}
                variant="highlight"
                description="Your SSF fund growth"
              />
            </ResultGrid>
          </div>
        </>
      )}

      {!result && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Enter your monthly base salary to calculate SSF contributions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SSFPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SSFCalculatorContent />
    </Suspense>
  );
}
