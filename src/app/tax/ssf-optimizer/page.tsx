"use client";

import { useMemo, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useUrlState } from "@/hooks/useUrlState";
import {
  calculateTaxWithSSF,
  calculateSimpleTax,
  getSSFLimits,
  formatCurrency,
  formatPercentage,
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface SSFOptimizerState {
  annualGrossIncome: number;
  ssfContribution: number;
}

const defaultState: SSFOptimizerState = {
  annualGrossIncome: 0,
  ssfContribution: 0,
};

function SSFOptimizerContent() {
  const { state, setField, getShareableUrl } = useUrlState<SSFOptimizerState>({
    defaultValues: defaultState,
    keys: ["annualGrossIncome", "ssfContribution"],
    debounceMs: 300,
  });

  const limits = getSSFLimits();
  const maxSSF = limits.maxAnnual;

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (state.annualGrossIncome <= 0) return null;

    const baselineTax = calculateSimpleTax(state.annualGrossIncome);
    const withSSFTax = calculateTaxWithSSF(
      state.annualGrossIncome,
      state.ssfContribution
    );

    // Generate data points for chart
    const steps = 10;
    const chartData = [];
    for (let i = 0; i <= steps; i++) {
      const ssf = (maxSSF / steps) * i;
      const result = calculateTaxWithSSF(state.annualGrossIncome, ssf);
      chartData.push({
        ssf,
        tax: result.totalTax,
        savings: baselineTax.totalTax - result.totalTax,
        netIncome: result.takeHome,
      });
    }

    // Generate table data (5 key points)
    const tableData = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
      const ssf = maxSSF * pct;
      const result = calculateTaxWithSSF(state.annualGrossIncome, ssf);
      return {
        ssf,
        taxableIncome: result.taxableIncome,
        tax: result.totalTax,
        savings: baselineTax.totalTax - result.totalTax,
        netIncome: result.takeHome,
      };
    });

    return {
      baseline: baselineTax,
      current: withSSFTax,
      savings: baselineTax.totalTax - withSSFTax.totalTax,
      chartData,
      tableData,
    };
  }, [state.annualGrossIncome, state.ssfContribution, maxSSF]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SSF Tax Optimizer</h1>
          <p className="text-muted-foreground">
            Find optimal SSF contribution to minimize tax
          </p>
        </div>
        <ShareButton getUrl={getShareableUrl} />
      </div>

      <TaxDisclaimer />

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle>Income & SSF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CurrencyInput
            id="annualGrossIncome"
            label="Annual Gross Income"
            value={state.annualGrossIncome}
            onChange={(v) => setField("annualGrossIncome", v)}
            helpText="Your total annual salary"
            className="max-w-md"
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Annual SSF Contribution (Employee)</Label>
              <span className="text-lg font-semibold">
                {formatCurrency(state.ssfContribution)}
              </span>
            </div>
            <Slider
              value={[state.ssfContribution]}
              onValueChange={(v) => setField("ssfContribution", Array.isArray(v) ? v[0] : v)}
              max={maxSSF}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(0)}</span>
              <span>Max: {formatCurrency(maxSSF)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {comparisonData && (
        <>
          <ResultGrid>
            <ResultCard
              title="Tax Without SSF"
              value={comparisonData.baseline.totalTax}
              description="No SSF deduction"
            />
            <ResultCard
              title="Tax With SSF"
              value={comparisonData.current.totalTax}
              variant="highlight"
              description={`SSF: ${formatCurrency(state.ssfContribution)}`}
            />
            <ResultCard
              title="Tax Savings"
              value={comparisonData.savings}
              variant="success"
              description="From SSF deduction"
            />
            <ResultCard
              title="Effective Rate"
              value={comparisonData.current.effectiveRate}
              format="percentage"
              description="After SSF deduction"
            />
          </ResultGrid>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Savings by SSF Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="ssf"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      label={{
                        value: "SSF Contribution",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      label={{
                        value: "Amount (Rs)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(label) => `SSF: ${formatCurrency(Number(label))}`}
                    />
                    <ReferenceLine
                      x={state.ssfContribution}
                      stroke="#f97316"
                      strokeDasharray="5 5"
                      label="Current"
                    />
                    <Line
                      type="monotone"
                      dataKey="tax"
                      name="Tax Payable"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      name="Tax Savings"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Comparison at Different SSF Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SSF Contribution</TableHead>
                    <TableHead className="text-right">Taxable Income</TableHead>
                    <TableHead className="text-right">Tax Payable</TableHead>
                    <TableHead className="text-right">Tax Savings</TableHead>
                    <TableHead className="text-right">Net Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.tableData.map((row, i) => (
                    <TableRow
                      key={i}
                      className={
                        Math.abs(row.ssf - state.ssfContribution) < 1000
                          ? "bg-primary/10"
                          : ""
                      }
                    >
                      <TableCell>{formatCurrency(row.ssf)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.taxableIncome)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.tax)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(row.savings)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.netIncome)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-4 text-xs text-muted-foreground">
                Note: Higher SSF contribution = more tax savings, but less immediate cash.
                SSF funds are accessible upon retirement or specific conditions.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!comparisonData && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Enter your annual income and adjust SSF contribution to see optimization
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SSFOptimizerPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SSFOptimizerContent />
    </Suspense>
  );
}
