"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import {
  calculateMultiIncomeTax,
  getIncomeTypes,
  formatCurrency,
  generateId,
  type IncomeSource,
  type TaxConfig,
} from "@/lib/tax";
import {
  TaxDisclaimer,
  TaxBreakdownTable,
  ResultCard,
  ResultGrid,
  ShareButton,
  MaritalStatusSelect,
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
import { useUrlState } from "@/hooks/useUrlState";
import type { MaritalStatus } from "@/lib/tax";

interface MultiIncomeState {
  maritalStatus: MaritalStatus;
  ssfContribution: number;
}

const defaultState: MultiIncomeState = {
  maritalStatus: "unmarried",
  ssfContribution: 0,
};

const incomeTypes = getIncomeTypes();

function createEmptySource(): IncomeSource {
  return {
    id: generateId(),
    name: "",
    amount: 0,
    hasTDS: false,
    tdsAmount: 0,
    incomeType: "salary",
  };
}

function MultiIncomeContent() {
  const { state, setField, getShareableUrl } = useUrlState<MultiIncomeState>({
    defaultValues: defaultState,
    keys: ["maritalStatus", "ssfContribution"],
    debounceMs: 300,
  });

  // Income sources managed in local state (too complex for URL)
  const [sources, setSources] = useState<IncomeSource[]>([createEmptySource()]);

  const addSource = useCallback(() => {
    setSources((prev) => [...prev, createEmptySource()]);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSource = useCallback(
    (id: string, updates: Partial<IncomeSource>) => {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  // Filter valid sources (with amount > 0)
  const validSources = useMemo(
    () => sources.filter((s) => s.amount > 0),
    [sources]
  );

  // Calculate results
  const result = useMemo(() => {
    if (validSources.length === 0) return null;

    return calculateMultiIncomeTax(
      validSources,
      state.maritalStatus,
      state.ssfContribution
    );
  }, [validSources, state.maritalStatus, state.ssfContribution]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Multi-Income Tax Calculator</h1>
          <p className="text-muted-foreground">
            Calculate tax on multiple income sources with TDS reconciliation
          </p>
        </div>
        <ShareButton getUrl={getShareableUrl} />
      </div>

      <TaxDisclaimer />

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <MaritalStatusSelect
              value={state.maritalStatus}
              onChange={(v) => setField("maritalStatus", v)}
            />
            <CurrencyInput
              id="ssfContribution"
              label="SSF Contribution (Annual)"
              value={state.ssfContribution}
              onChange={(v) => setField("ssfContribution", v)}
              helpText="Total annual employee SSF"
            />
          </div>
        </CardContent>
      </Card>

      {/* Income Sources */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Income Sources</CardTitle>
          <Button onClick={addSource} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {sources.map((source, index) => (
            <IncomeSourceRow
              key={source.id}
              source={source}
              index={index}
              onUpdate={updateSource}
              onRemove={removeSource}
              canRemove={sources.length > 1}
            />
          ))}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <ResultGrid>
            <ResultCard
              title="Total Income"
              value={result.totalIncome}
              description={`${validSources.length} source(s)`}
            />
            <ResultCard
              title="Total Tax Liability"
              value={result.totalTaxLiability}
              variant="warning"
              description="On combined income"
            />
            <ResultCard
              title="TDS Already Paid"
              value={result.totalTDSPaid}
              description="Deducted at source"
            />
            <ResultCard
              title={result.balance >= 0 ? "Tax Due" : "Refund Due"}
              value={Math.abs(result.balance)}
              variant={result.balance >= 0 ? "warning" : "success"}
              description={result.balance >= 0 ? "Additional payment" : "You'll get back"}
            />
          </ResultGrid>

          {/* Income Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Income Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">TDS Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>{source.name || "Unnamed"}</TableCell>
                      <TableCell>
                        {incomeTypes.find((t) => t.value === source.incomeType)?.label}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(source.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {source.hasTDS ? formatCurrency(source.tdsAmount) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(result.totalIncome)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(result.totalTDSPaid)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tax Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Breakdown on Combined Income</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxBreakdownTable breakdown={result.taxResult.bracketBreakdown} />
            </CardContent>
          </Card>

          {/* Final Summary */}
          <Card
            className={
              result.balance >= 0
                ? "border-amber-200 bg-amber-50"
                : "border-green-200 bg-green-50"
            }
          >
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {result.balance >= 0 ? "Additional Tax to Pay" : "Tax Refund Due"}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    result.balance >= 0 ? "text-amber-900" : "text-green-900"
                  }`}
                >
                  {formatCurrency(Math.abs(result.balance))}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total Tax: {formatCurrency(result.totalTaxLiability)} - TDS Paid:{" "}
                  {formatCurrency(result.totalTDSPaid)}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!result && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Add income sources with amounts to see tax calculation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface IncomeSourceRowProps {
  source: IncomeSource;
  index: number;
  onUpdate: (id: string, updates: Partial<IncomeSource>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function IncomeSourceRow({
  source,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: IncomeSourceRowProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium">Source {index + 1}</span>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(source.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Source Name</Label>
          <Input
            value={source.name}
            onChange={(e) => onUpdate(source.id, { name: e.target.value })}
            placeholder="e.g., Main Job"
          />
        </div>

        <div className="space-y-2">
          <Label>Income Type</Label>
          <Select
            value={source.incomeType}
            onValueChange={(v) =>
              onUpdate(source.id, {
                incomeType: v as keyof TaxConfig["tdsRates"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {incomeTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Annual Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              Rs
            </span>
            <Input
              type="number"
              value={source.amount || ""}
              onChange={(e) =>
                onUpdate(source.id, { amount: parseFloat(e.target.value) || 0 })
              }
              className="pl-10"
              placeholder="0"
              min={0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>TDS Deducted?</Label>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`tds-${source.id}`}
                checked={source.hasTDS}
                onCheckedChange={(checked) =>
                  onUpdate(source.id, { hasTDS: checked === true })
                }
              />
              <Label htmlFor={`tds-${source.id}`} className="font-normal">
                Yes
              </Label>
            </div>
          </div>
        </div>
      </div>

      {source.hasTDS && (
        <div className="mt-4 max-w-xs">
          <Label>TDS Amount</Label>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              Rs
            </span>
            <Input
              type="number"
              value={source.tdsAmount || ""}
              onChange={(e) =>
                onUpdate(source.id, {
                  tdsAmount: parseFloat(e.target.value) || 0,
                })
              }
              className="pl-10"
              placeholder="0"
              min={0}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MultiIncomePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <MultiIncomeContent />
    </Suspense>
  );
}
