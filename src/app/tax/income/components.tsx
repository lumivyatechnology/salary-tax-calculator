"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Check, Share2, X, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import { cn } from "@/lib/utils";
import {
  type SalaryMode,
  type Gender,
  type FundType,
  type TaxResult,
  type SSFBreakdown,
  type EPFBreakdown,
  formatCurrency,
  formatPercentage,
  LIMITS,
  SSF_RATES,
  EPF_RATES,
} from "./calculations";

// ============================================================================
// Input Components
// ============================================================================

interface CurrencyInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  helpText?: string;
  maxLimit?: number;
  className?: string;
}

// Format number to Indian/Nepali style: 100000 → "1,00,000"
function formatIndianNumber(num: number): string {
  if (num === 0) return "";
  return new Intl.NumberFormat("en-IN").format(num);
}

export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  helpText,
  maxLimit,
  className,
}: CurrencyInputProps) {
  const isOverLimit = maxLimit !== undefined && value > maxLimit;
  const formattedValue = formatIndianNumber(value);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {value > 0 && (
          <span className="text-xs text-muted-foreground">
            Rs {formattedValue}
          </span>
        )}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          Rs
        </span>
        <Input
          id={id}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className={cn("pl-10", isOverLimit && "border-amber-500")}
          min={0}
        />
      </div>
      {isOverLimit && (
        <p className="text-xs text-amber-600">
          Max deduction: {formatCurrency(maxLimit)} (excess won&apos;t be deducted)
        </p>
      )}
      {helpText && !isOverLimit && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface PercentageInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  helpText?: string;
  className?: string;
}

export function PercentageInput({
  id,
  label,
  value,
  onChange,
  helpText,
  className,
}: PercentageInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="40"
          className="pr-8"
          min={0}
          max={100}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          %
        </span>
      </div>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}

interface SalaryModeToggleProps {
  value: SalaryMode;
  onChange: (value: SalaryMode) => void;
}

export function SalaryModeToggle({ value, onChange }: SalaryModeToggleProps) {
  return (
    <Tabs value={value} onValueChange={(v) => v && onChange(v as SalaryMode)}>
      <TabsList>
        <TabsTrigger value="monthly">Monthly Salary</TabsTrigger>
        <TabsTrigger value="ctc">Annual CTC</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

interface GenderSelectProps {
  value: Gender;
  onChange: (value: Gender) => void;
  className?: string;
}

export function GenderSelect({ value, onChange, className }: GenderSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>Gender</Label>
      <Select value={value} onValueChange={(v) => v && onChange(v as Gender)}>
        <SelectTrigger>
          <SelectValue>
            {value === "female" ? "Female (Single)" : "Male"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-[220px]">
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female (Single, 10% rebate)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface FundTypeSelectProps {
  value: FundType;
  onChange: (value: FundType) => void;
  className?: string;
}

export function FundTypeSelect({ value, onChange, className }: FundTypeSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>Retirement Fund</Label>
      <Select value={value} onValueChange={(v) => v && onChange(v as FundType)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ssf">SSF (31% of Basic)</SelectItem>
          <SelectItem value="epf">EPF (20% of Basic)</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {value === "ssf"
          ? "Social Security Fund: Employee 11% + Employer 20%. 1% tax bracket waived."
          : "Employee Provident Fund: Employee 10% + Employer 10%"}
      </p>
    </div>
  );
}

// ============================================================================
// Result Components
// ============================================================================

interface ResultCardProps {
  title: string;
  value: number;
  variant?: "default" | "highlight" | "success" | "warning";
  description?: string;
  className?: string;
}

export function ResultCard({
  title,
  value,
  variant = "default",
  description,
  className,
}: ResultCardProps) {
  const variantStyles = {
    default: "",
    highlight: "border-primary bg-primary/5",
    success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
    warning: "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatCurrency(value)}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ResultGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ResultGrid({ children, className }: ResultGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

interface TaxBracketTableProps {
  result: TaxResult;
}

export function TaxBracketTable({ result }: TaxBracketTableProps) {
  const relevantBrackets = result.bracketBreakdown.filter(
    (b) => b.incomeInBracket > 0 || b.taxAmount > 0 || b.waived
  );

  if (relevantBrackets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tax breakdown available
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tax Bracket</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Income in Bracket</TableHead>
          <TableHead className="text-right">Tax</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {relevantBrackets.map((item, index) => (
          <TableRow
            key={index}
            className={item.waived ? "bg-green-50 dark:bg-green-950" : ""}
          >
            <TableCell className={cn("font-medium", item.waived && "text-green-700 dark:text-green-300")}>
              {item.label}
            </TableCell>
            <TableCell className={cn("text-right", item.waived && "line-through text-muted-foreground")}>
              {formatPercentage(item.rate, 0)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(item.incomeInBracket)}
            </TableCell>
            <TableCell className={cn("text-right font-medium", item.waived && "text-green-700 dark:text-green-300")}>
              {item.waived ? (
                <span>
                  <span className="line-through text-muted-foreground mr-2">
                    {formatCurrency(item.incomeInBracket * item.rate)}
                  </span>
                  {formatCurrency(0)}
                </span>
              ) : (
                formatCurrency(item.taxAmount)
              )}
            </TableCell>
          </TableRow>
        ))}
        {result.ssfWaiverAmount > 0 && (
          <TableRow className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950">
            <TableCell colSpan={3}>SSF Tax Waiver (1% Exemption)</TableCell>
            <TableCell className="text-right">-{formatCurrency(result.ssfWaiverAmount)}</TableCell>
          </TableRow>
        )}
        <TableRow className="bg-muted/50 font-semibold">
          <TableCell colSpan={3}>Gross Tax</TableCell>
          <TableCell className="text-right">{formatCurrency(result.grossTax)}</TableCell>
        </TableRow>
        {result.femaleRebate > 0 && (
          <TableRow className="text-green-700 dark:text-green-400">
            <TableCell colSpan={3}>Female Rebate (10%)</TableCell>
            <TableCell className="text-right">-{formatCurrency(result.femaleRebate)}</TableCell>
          </TableRow>
        )}
        <TableRow className="bg-amber-100 dark:bg-amber-900 font-bold">
          <TableCell colSpan={3}>Final Tax Payable</TableCell>
          <TableCell className="text-right">{formatCurrency(result.finalTax)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

interface DeductionBreakdownTableProps {
  result: TaxResult;
  citContribution: number;
}

export function DeductionBreakdownTable({ result, citContribution }: DeductionBreakdownTableProps) {
  const employeeContribution = result.fundType === "ssf"
    ? result.ssfBreakdown!.employeeContribution
    : result.epfBreakdown!.employeeContribution;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deduction Type</TableHead>
          <TableHead className="text-right">Claimed</TableHead>
          <TableHead className="text-right">Limit</TableHead>
          <TableHead className="text-right">Deducted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">
            {result.fundType === "ssf" ? "SSF Employee Contribution" : "EPF Employee Contribution"}
          </TableCell>
          <TableCell className="text-right">{formatCurrency(employeeContribution)}</TableCell>
          <TableCell className="text-right text-muted-foreground" rowSpan={2}>
            1/3 Rule: {formatCurrency(result.oneThirdLimit)}
          </TableCell>
          <TableCell className="text-right" rowSpan={2}>
            {formatCurrency(result.deductions.retirementFundDeduction)}
          </TableCell>
        </TableRow>
        {citContribution > 0 && (
          <TableRow>
            <TableCell className="font-medium">CIT Contribution</TableCell>
            <TableCell className="text-right">{formatCurrency(citContribution)}</TableCell>
          </TableRow>
        )}
        <TableRow>
          <TableCell className="font-medium">Life Insurance Premium</TableCell>
          <TableCell className="text-right">{formatCurrency(result.deductions.lifeInsuranceDeduction)}</TableCell>
          <TableCell className="text-right text-muted-foreground">{formatCurrency(LIMITS.LIFE_INSURANCE_MAX)}</TableCell>
          <TableCell className="text-right">{formatCurrency(result.deductions.lifeInsuranceDeduction)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Medical Insurance Premium</TableCell>
          <TableCell className="text-right">{formatCurrency(result.deductions.medicalInsuranceDeduction)}</TableCell>
          <TableCell className="text-right text-muted-foreground">{formatCurrency(LIMITS.MEDICAL_INSURANCE_MAX)}</TableCell>
          <TableCell className="text-right">{formatCurrency(result.deductions.medicalInsuranceDeduction)}</TableCell>
        </TableRow>
        <TableRow className="bg-muted/50 font-semibold">
          <TableCell colSpan={3}>Total Deductions</TableCell>
          <TableCell className="text-right">{formatCurrency(result.deductions.totalDeductions)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

interface FundContributionTableProps {
  result: TaxResult;
}

export function FundContributionTable({ result }: FundContributionTableProps) {
  if (result.fundType === "ssf" && result.ssfBreakdown) {
    return <SSFContributionTable breakdown={result.ssfBreakdown} />;
  }
  if (result.fundType === "epf" && result.epfBreakdown) {
    return <EPFContributionTable breakdown={result.epfBreakdown} />;
  }
  return null;
}

interface SSFContributionTableProps {
  breakdown: SSFBreakdown;
}

function SSFContributionTable({ breakdown }: SSFContributionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SSF Component</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Annual</TableHead>
          <TableHead className="text-right">Monthly</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="bg-blue-50 dark:bg-blue-950">
          <TableCell colSpan={4} className="font-semibold text-blue-800 dark:text-blue-200">
            Employee Contribution ({formatPercentage(SSF_RATES.EMPLOYEE_TOTAL, 0)})
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="pl-6">Provident Fund</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.EMPLOYEE_PF, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeePF)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeePF / 12)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="pl-6">Additional</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.EMPLOYEE_ADDITIONAL, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeeAdditional)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeeAdditional / 12)}</TableCell>
        </TableRow>
        <TableRow className="font-medium">
          <TableCell className="pl-6">Subtotal (Employee)</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.EMPLOYEE_TOTAL, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeeContribution)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeeContribution / 12)}</TableCell>
        </TableRow>

        <TableRow className="bg-green-50 dark:bg-green-950">
          <TableCell colSpan={4} className="font-semibold text-green-800 dark:text-green-200">
            Employer Contribution ({formatPercentage(SSF_RATES.EMPLOYER_TOTAL, 0)})
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="pl-6">Provident Fund</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.EMPLOYER_PF, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerPF)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerPF / 12)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="pl-6">Gratuity</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.EMPLOYER_GRATUITY, 2)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerGratuity)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerGratuity / 12)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="pl-6">Additional</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.EMPLOYER_ADDITIONAL, 2)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerAdditional)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerAdditional / 12)}</TableCell>
        </TableRow>
        <TableRow className="font-medium">
          <TableCell className="pl-6">Subtotal (Employer)</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.EMPLOYER_TOTAL, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerContribution)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerContribution / 12)}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell>SST (Social Security Tax)</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.SST, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.sst)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.sst / 12)}</TableCell>
        </TableRow>

        <TableRow className="bg-muted/50 font-bold">
          <TableCell>Total SSF Contribution</TableCell>
          <TableCell className="text-right">{formatPercentage(SSF_RATES.TOTAL, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.totalContribution)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.totalContribution / 12)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

interface EPFContributionTableProps {
  breakdown: EPFBreakdown;
}

function EPFContributionTable({ breakdown }: EPFContributionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>EPF Component</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Annual</TableHead>
          <TableHead className="text-right">Monthly</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Employee Contribution</TableCell>
          <TableCell className="text-right">{formatPercentage(EPF_RATES.EMPLOYEE, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeeContribution)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employeeContribution / 12)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Employer Contribution</TableCell>
          <TableCell className="text-right">{formatPercentage(EPF_RATES.EMPLOYER, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerContribution)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.employerContribution / 12)}</TableCell>
        </TableRow>
        <TableRow className="bg-muted/50 font-bold">
          <TableCell>Total EPF Contribution</TableCell>
          <TableCell className="text-right">{formatPercentage(EPF_RATES.TOTAL, 0)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.totalContribution)}</TableCell>
          <TableCell className="text-right">{formatCurrency(breakdown.totalContribution / 12)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

interface MonthlySummaryTableProps {
  result: TaxResult;
  bonus: number;
}

export function MonthlySummaryTable({ result, bonus }: MonthlySummaryTableProps) {
  const monthlyBonus = Math.round(bonus / 12);
  const netTakeHome = result.monthlyTakeHome - monthlyBonus;
  const grossIncome = result.monthlyGrossIncome - monthlyBonus;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Monthly Summary</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Gross Salary</TableCell>
          <TableCell className="text-right">{formatCurrency(grossIncome)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            {result.fundType === "ssf" ? "SSF Employee Deduction" : "EPF Employee Deduction"}
          </TableCell>
          <TableCell className="text-right text-red-600">
            -{formatCurrency(result.monthlyEmployeeContribution)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>TDS (Tax Deducted at Source)</TableCell>
          <TableCell className="text-right text-red-600">
            -{formatCurrency(result.monthlyTax)}
          </TableCell>
        </TableRow>
        {result.monthlyCIT > 0 && (
          <TableRow>
            <TableCell>CIT Contribution (monthly)</TableCell>
            <TableCell className="text-right text-red-600">
              -{formatCurrency(result.monthlyCIT)}
            </TableCell>
          </TableRow>
        )}
        <TableRow className="bg-green-100 dark:bg-green-900 font-bold">
          <TableCell>Net Take-Home</TableCell>
          <TableCell className="text-right text-green-700 dark:text-green-300">
            {formatCurrency(netTakeHome)}
          </TableCell>
        </TableRow>
        {bonus > 0 && (
          <TableRow className="bg-amber-50 dark:bg-amber-950">
            <TableCell className="text-amber-700 dark:text-amber-300">+ Bonus (paid once yearly)</TableCell>
            <TableCell className="text-right text-amber-700 dark:text-amber-300">
              {formatCurrency(bonus)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

// ============================================================================
// Shared Components
// ============================================================================

export function TaxDisclaimer() {
  return (
    <Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-900">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-xs">
        This calculator provides estimates only, not official tax filings.
        Consult a tax professional for accurate advice. Rates are for FY 2083/84 (2026/27).
      </AlertDescription>
    </Alert>
  );
}

interface ShareButtonProps {
  getUrl: () => string;
}

interface ClearButtonProps {
  onClear: () => void;
}

export function ClearButton({ onClear }: ClearButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        }
      />
      <TooltipContent>
        <p>Reset all fields to defaults</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface PdfExportButtonProps {
  result: TaxResult;
  state: {
    salaryMode: SalaryMode;
    basicSalary: number;
    allowance: number;
    bonus: number;
    gender: Gender;
    fundType: FundType;
    lifeInsurance: number;
    medicalInsurance: number;
    citContribution: number;
  };
}

export function PdfExportButton({ result, state }: PdfExportButtonProps) {
  const generatePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = 15;

    // Helper: check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPosition = 15;
      }
    };

    // Helper: draw a summary card
    const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string, description: string, borderColor: [number, number, number] = [220, 220, 220], bgColor?: [number, number, number]) => {
      // Background
      if (bgColor) {
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
      } else {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
      }
      // Border
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, w, h, 2, 2, "S");

      // Title (small, muted)
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(title, x + 6, y + 10);

      // Value (large, bold)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(value, x + 6, y + 22);

      // Description (tiny, muted)
      if (description) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(140, 140, 140);
        doc.text(description, x + 6, y + 29);
      }
    };

    // Helper: draw section title (like accordion header)
    const drawSectionTitle = (title: string) => {
      checkNewPage(40);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(title, margin, yPosition);
      // Underline
      const titleWidth = doc.getTextWidth(title);
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 1, margin + titleWidth, yPosition + 1);
      yPosition += 8;
    };

    // ========================================================================
    // HEADER
    // ========================================================================
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Nepal Income Tax Report", 105, yPosition, { align: "center" });
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 105, yPosition, { align: "center" });
    yPosition += 12;

    // ========================================================================
    // SUMMARY CARDS (4 cards in a row)
    // ========================================================================
    const cardGap = 3;
    const cardW = (contentWidth - cardGap * 3) / 4;
    const cardH = 34;

    const monthlyTakeHomeWithoutBonus = result.monthlyTakeHome - Math.round(state.bonus / 12);

    // Row 1: 4 summary cards
    drawCard(margin, yPosition, cardW, cardH,
      "Annual Gross Income",
      formatCurrency(result.annualGrossIncome + (result.employerContribution ?? 0)),
      `Basic: ${formatCurrency(result.annualBasicSalary)}`
    );
    drawCard(margin + cardW + cardGap, yPosition, cardW, cardH,
      "Total Deductions",
      formatCurrency(result.deductions.totalDeductions),
      "SSF/EPF + Insurance"
    );
    drawCard(margin + (cardW + cardGap) * 2, yPosition, cardW, cardH,
      "Taxable Income",
      formatCurrency(result.taxableIncome),
      "After all deductions",
      [147, 130, 220] // primary/highlight border
    );
    drawCard(margin + (cardW + cardGap) * 3, yPosition, cardW, cardH,
      "Annual Tax",
      formatCurrency(result.finalTax),
      `Effective rate: ${formatPercentage(result.effectiveRate)}`,
      [245, 158, 11], // amber border
      [255, 251, 235] // amber-50 bg
    );
    yPosition += cardH + 8;

    // Row 2: 2 take-home cards
    const takeHomeCardW = (contentWidth - cardGap) / 2;
    drawCard(margin, yPosition, takeHomeCardW, cardH,
      "Monthly Take-Home",
      formatCurrency(monthlyTakeHomeWithoutBonus),
      "Actual cash received monthly",
      [34, 197, 94], // green border
      [240, 253, 244] // green-50 bg
    );
    drawCard(margin + takeHomeCardW + cardGap, yPosition, takeHomeCardW, cardH,
      "Annual Take-Home",
      formatCurrency(result.annualTakeHome),
      "Actual cash received annually",
      [34, 197, 94],
      [240, 253, 244]
    );
    yPosition += cardH + 12;

    // ========================================================================
    // MONTHLY SALARY BREAKDOWN
    // ========================================================================
    drawSectionTitle("Monthly Salary Breakdown");

    const monthlyBonus = Math.round(state.bonus / 12);
    const grossIncome = result.monthlyGrossIncome - monthlyBonus;
    const netTakeHome = result.monthlyTakeHome - monthlyBonus;

    const monthlyRows: any[][] = [
      ["Gross Salary", formatCurrency(grossIncome)],
      [result.fundType === "ssf" ? "SSF Employee Deduction" : "EPF Employee Deduction", `-${formatCurrency(result.monthlyEmployeeContribution)}`],
      ["TDS (Tax Deducted at Source)", `-${formatCurrency(result.monthlyTax)}`],
    ];

    if (result.monthlyCIT > 0) {
      monthlyRows.push(["CIT Contribution (monthly)", `-${formatCurrency(result.monthlyCIT)}`]);
    }

    monthlyRows.push(["Net Take-Home", formatCurrency(netTakeHome)]);

    const monthlyRowCount = monthlyRows.length;

    autoTable(doc, {
      startY: yPosition,
      head: [["Monthly Summary", "Amount"]],
      body: monthlyRows,
      theme: "plain",
      headStyles: { fillColor: [255, 255, 255], textColor: [80, 80, 80], fontSize: 9, fontStyle: "bold", cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
      bodyStyles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.7 },
        1: { halign: "right" }
      },
      margin: { left: margin, right: margin },
      tableLineColor: [230, 230, 230],
      tableLineWidth: 0.2,
      didParseCell: (data: any) => {
        if (data.section === "body") {
          const rowIndex = data.row.index;
          const isLastRow = rowIndex === monthlyRowCount - 1;
          // Deduction rows (red text for amount column)
          if (data.column.index === 1 && rowIndex > 0 && !isLastRow) {
            data.cell.styles.textColor = [185, 28, 28]; // red-700
          }
          // Net Take-Home row (green bg + bold)
          if (isLastRow) {
            data.cell.styles.fillColor = [220, 252, 231]; // green-100
            data.cell.styles.fontStyle = "bold";
            if (data.column.index === 1) {
              data.cell.styles.textColor = [21, 128, 61]; // green-700
            }
          }
        }
      },
      didDrawCell: (data: any) => {
        // Draw bottom border for each row
        if (data.section === "body" || data.section === "head") {
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;

    // ========================================================================
    // SSF/EPF CONTRIBUTION BREAKDOWN
    // ========================================================================
    if (result.fundType === "ssf" && result.ssfBreakdown) {
      drawSectionTitle("SSF Contribution Breakdown");

      const ssfRows: any[][] = [
        [`Employee Contribution (${formatPercentage(SSF_RATES.EMPLOYEE_TOTAL, 0)})`, "", "", ""],
        ["    Provident Fund", formatPercentage(SSF_RATES.EMPLOYEE_PF, 0), formatCurrency(result.ssfBreakdown.employeePF), formatCurrency(result.ssfBreakdown.employeePF / 12)],
        ["    Additional", formatPercentage(SSF_RATES.EMPLOYEE_ADDITIONAL, 0), formatCurrency(result.ssfBreakdown.employeeAdditional), formatCurrency(result.ssfBreakdown.employeeAdditional / 12)],
        ["    Subtotal (Employee)", formatPercentage(SSF_RATES.EMPLOYEE_TOTAL, 0), formatCurrency(result.ssfBreakdown.employeeContribution), formatCurrency(result.ssfBreakdown.employeeContribution / 12)],
        [`Employer Contribution (${formatPercentage(SSF_RATES.EMPLOYER_TOTAL, 0)})`, "", "", ""],
        ["    Provident Fund", formatPercentage(SSF_RATES.EMPLOYER_PF, 0), formatCurrency(result.ssfBreakdown.employerPF), formatCurrency(result.ssfBreakdown.employerPF / 12)],
        ["    Gratuity", formatPercentage(SSF_RATES.EMPLOYER_GRATUITY, 2), formatCurrency(result.ssfBreakdown.employerGratuity), formatCurrency(result.ssfBreakdown.employerGratuity / 12)],
        ["    Additional", formatPercentage(SSF_RATES.EMPLOYER_ADDITIONAL, 2), formatCurrency(result.ssfBreakdown.employerAdditional), formatCurrency(result.ssfBreakdown.employerAdditional / 12)],
        ["    Subtotal (Employer)", formatPercentage(SSF_RATES.EMPLOYER_TOTAL, 0), formatCurrency(result.ssfBreakdown.employerContribution), formatCurrency(result.ssfBreakdown.employerContribution / 12)],
        ["SST (Social Security Tax)", formatPercentage(SSF_RATES.SST, 0), formatCurrency(result.ssfBreakdown.sst), formatCurrency(result.ssfBreakdown.sst / 12)],
        ["Total SSF Contribution", formatPercentage(SSF_RATES.TOTAL, 0), formatCurrency(result.ssfBreakdown.totalContribution), formatCurrency(result.ssfBreakdown.totalContribution / 12)]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["SSF Component", "Rate", "Annual", "Monthly"]],
        body: ssfRows,
        theme: "plain",
        headStyles: { fillColor: [255, 255, 255], textColor: [80, 80, 80], fontSize: 9, fontStyle: "bold", cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
        bodyStyles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.4 },
          1: { halign: "right", cellWidth: contentWidth * 0.15 },
          2: { halign: "right", cellWidth: contentWidth * 0.22 },
          3: { halign: "right" }
        },
        margin: { left: margin, right: margin },
        didParseCell: (data: any) => {
          if (data.section === "body") {
            const rowIndex = data.row.index;
            // Employee header row (blue bg)
            if (rowIndex === 0) {
              data.cell.styles.fillColor = [239, 246, 255]; // blue-50
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [30, 64, 175]; // blue-800
            }
            // Employer header row (green bg)
            if (rowIndex === 4) {
              data.cell.styles.fillColor = [240, 253, 244]; // green-50
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.textColor = [22, 101, 52]; // green-800
            }
            // Subtotal rows (bold)
            if (rowIndex === 3 || rowIndex === 8) {
              data.cell.styles.fontStyle = "bold";
            }
            // Total SSF row (bold, muted bg)
            if (rowIndex === 10) {
              data.cell.styles.fillColor = [243, 244, 246]; // gray-100
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        didDrawCell: (data: any) => {
          if (data.section === "body" || data.section === "head") {
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });
    } else if (result.fundType === "epf" && result.epfBreakdown) {
      drawSectionTitle("EPF Contribution Breakdown");

      const epfRows: any[][] = [
        ["Employee Contribution", formatPercentage(EPF_RATES.EMPLOYEE, 0), formatCurrency(result.epfBreakdown.employeeContribution), formatCurrency(result.epfBreakdown.employeeContribution / 12)],
        ["Employer Contribution", formatPercentage(EPF_RATES.EMPLOYER, 0), formatCurrency(result.epfBreakdown.employerContribution), formatCurrency(result.epfBreakdown.employerContribution / 12)],
        ["Total EPF Contribution", formatPercentage(EPF_RATES.TOTAL, 0), formatCurrency(result.epfBreakdown.totalContribution), formatCurrency(result.epfBreakdown.totalContribution / 12)]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["EPF Component", "Rate", "Annual", "Monthly"]],
        body: epfRows,
        theme: "plain",
        headStyles: { fillColor: [255, 255, 255], textColor: [80, 80, 80], fontSize: 9, fontStyle: "bold", cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
        bodyStyles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.4 },
          1: { halign: "right", cellWidth: contentWidth * 0.15 },
          2: { halign: "right", cellWidth: contentWidth * 0.22 },
          3: { halign: "right" }
        },
        margin: { left: margin, right: margin },
        didParseCell: (data: any) => {
          if (data.section === "body") {
            // Total row (bold, muted bg)
            if (data.row.index === 2) {
              data.cell.styles.fillColor = [243, 244, 246];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        didDrawCell: (data: any) => {
          if (data.section === "body" || data.section === "head") {
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });
    }

    yPosition = (doc as any).lastAutoTable.finalY + 12;

    // ========================================================================
    // TAX DEDUCTIONS APPLIED
    // ========================================================================
    checkNewPage(60);
    drawSectionTitle("Tax Deductions Applied");

    const employeeContribution = result.fundType === "ssf"
      ? result.ssfBreakdown!.employeeContribution
      : result.epfBreakdown!.employeeContribution;

    const deductionRows: any[][] = [
      [result.fundType === "ssf" ? "SSF Employee Contribution" : "EPF Employee Contribution", formatCurrency(employeeContribution), `1/3 Rule: ${formatCurrency(result.oneThirdLimit)}`, formatCurrency(result.deductions.retirementFundDeduction)],
    ];

    if (state.citContribution > 0) {
      deductionRows.push(["CIT Contribution", formatCurrency(state.citContribution), "", ""]);
    }

    deductionRows.push(["Life Insurance Premium", formatCurrency(result.deductions.lifeInsuranceDeduction), formatCurrency(LIMITS.LIFE_INSURANCE_MAX), formatCurrency(result.deductions.lifeInsuranceDeduction)]);
    deductionRows.push(["Medical Insurance Premium", formatCurrency(result.deductions.medicalInsuranceDeduction), formatCurrency(LIMITS.MEDICAL_INSURANCE_MAX), formatCurrency(result.deductions.medicalInsuranceDeduction)]);
    deductionRows.push(["Total Deductions", "", "", formatCurrency(result.deductions.totalDeductions)]);

    const deductionRowCount = deductionRows.length;

    autoTable(doc, {
      startY: yPosition,
      head: [["Deduction Type", "Claimed", "Limit", "Deducted"]],
      body: deductionRows,
      theme: "plain",
      headStyles: { fillColor: [255, 255, 255], textColor: [80, 80, 80], fontSize: 9, fontStyle: "bold", cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
      bodyStyles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.35 },
        1: { halign: "right", cellWidth: contentWidth * 0.2 },
        2: { halign: "right", cellWidth: contentWidth * 0.22 },
        3: { halign: "right" }
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        if (data.section === "body") {
          const isLastRow = data.row.index === deductionRowCount - 1;
          // Limit column - muted text
          if (data.column.index === 2) {
            data.cell.styles.textColor = [120, 120, 120];
          }
          // Total row (bold, muted bg)
          if (isLastRow) {
            data.cell.styles.fillColor = [243, 244, 246];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      didDrawCell: (data: any) => {
        if (data.section === "body" || data.section === "head") {
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 4;

    // 1/3 Rule footnote
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175); // blue
    doc.text("1/3 Rule:", margin, yPosition + 3);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(" Total retirement fund deduction (SSF/EPF + CIT) is capped at the lower of 1/3 of annual income or Rs 5,00,000.", margin + doc.getTextWidth("1/3 Rule: "), yPosition + 3);
    yPosition += 12;

    // ========================================================================
    // TAX CALCULATION BY BRACKET
    // ========================================================================
    checkNewPage(60);
    drawSectionTitle("Tax Calculation by Bracket");

    const relevantBrackets = result.bracketBreakdown.filter(
      (b) => b.incomeInBracket > 0 || b.taxAmount > 0 || b.waived
    );

    const bracketRows: any[][] = relevantBrackets.map(item => [
      item.label,
      formatPercentage(item.rate, 0),
      formatCurrency(item.incomeInBracket),
      item.waived ? `${formatCurrency(item.incomeInBracket * item.rate)}  ${formatCurrency(0)}` : formatCurrency(item.taxAmount)
    ]);

    if (result.ssfWaiverAmount > 0) {
      bracketRows.push(["SSF Tax Waiver (1% Exemption)", "", "", `-${formatCurrency(result.ssfWaiverAmount)}`]);
    }

    bracketRows.push(["Gross Tax", "", "", formatCurrency(result.grossTax)]);

    if (result.femaleRebate > 0) {
      bracketRows.push(["Female Rebate (10%)", "", "", `-${formatCurrency(result.femaleRebate)}`]);
    }

    bracketRows.push(["Final Tax Payable", "", "", formatCurrency(result.finalTax)]);

    const bracketRowCount = bracketRows.length;
    const ssfWaiverRowIndex = result.ssfWaiverAmount > 0 ? relevantBrackets.length : -1;
    const grossTaxRowIndex = result.ssfWaiverAmount > 0 ? relevantBrackets.length + 1 : relevantBrackets.length;
    const finalTaxRowIndex = bracketRowCount - 1;

    autoTable(doc, {
      startY: yPosition,
      head: [["Tax Bracket", "Rate", "Income in Bracket", "Tax"]],
      body: bracketRows,
      theme: "plain",
      headStyles: { fillColor: [255, 255, 255], textColor: [80, 80, 80], fontSize: 9, fontStyle: "bold", cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
      bodyStyles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 } },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.4 },
        1: { halign: "right", cellWidth: contentWidth * 0.15 },
        2: { halign: "right", cellWidth: contentWidth * 0.22 },
        3: { halign: "right" }
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        if (data.section === "body") {
          const rowIndex = data.row.index;
          // Waived bracket rows (green bg + green text)
          if (rowIndex < relevantBrackets.length && relevantBrackets[rowIndex]?.waived) {
            data.cell.styles.fillColor = [240, 253, 244]; // green-50
            data.cell.styles.textColor = [21, 128, 61]; // green-700
            if (data.column.index === 1) {
              data.cell.styles.textColor = [120, 120, 120]; // muted strikethrough effect
            }
          }
          // SSF Waiver row (green)
          if (rowIndex === ssfWaiverRowIndex) {
            data.cell.styles.fillColor = [240, 253, 244];
            data.cell.styles.textColor = [21, 128, 61];
          }
          // Gross Tax row (muted bg, bold)
          if (rowIndex === grossTaxRowIndex) {
            data.cell.styles.fillColor = [243, 244, 246];
            data.cell.styles.fontStyle = "bold";
          }
          // Female rebate row (green text)
          if (result.femaleRebate > 0 && rowIndex === finalTaxRowIndex - 1) {
            data.cell.styles.textColor = [21, 128, 61];
          }
          // Final Tax Payable row (amber bg, bold)
          if (rowIndex === finalTaxRowIndex) {
            data.cell.styles.fillColor = [254, 243, 199]; // amber-100
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      didDrawCell: (data: any) => {
        if (data.section === "body" || data.section === "head") {
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ========================================================================
    // INPUT DETAILS (moved to bottom as reference)
    // ========================================================================
    checkNewPage(50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Input Details (Reference)", margin, yPosition);
    yPosition += 6;

    autoTable(doc, {
      startY: yPosition,
      head: [[
        state.salaryMode === "monthly" ? "Monthly Basic" : "Annual CTC",
        state.salaryMode === "monthly" ? "Monthly Allowance" : "Annual Allowance",
        "Annual Bonus",
        "Gender",
        "Fund Type"
      ]],
      body: [[
        formatCurrency(state.basicSalary),
        formatCurrency(state.allowance),
        formatCurrency(state.bonus),
        state.gender === "female" ? "Female" : "Male",
        state.fundType === "ssf" ? "SSF" : "EPF"
      ]],
      theme: "plain",
      headStyles: { fillColor: [249, 250, 251], textColor: [80, 80, 80], fontSize: 8, fontStyle: "bold", cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      margin: { left: margin, right: margin },
      didDrawCell: (data: any) => {
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 4;

    autoTable(doc, {
      startY: yPosition,
      head: [["Life Insurance (Annual)", "Medical Insurance (Annual)", "CIT Contribution"]],
      body: [[
        formatCurrency(state.lifeInsurance),
        formatCurrency(state.medicalInsurance),
        formatCurrency(state.citContribution)
      ]],
      theme: "plain",
      headStyles: { fillColor: [249, 250, 251], textColor: [80, 80, 80], fontSize: 8, fontStyle: "bold", cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      margin: { left: margin, right: margin },
      didDrawCell: (data: any) => {
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    });

    // ========================================================================
    // FOOTER DISCLAIMER
    // ========================================================================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140, 140, 140);
      const disclaimer = "This report provides estimates only, not official tax filings. Consult a tax professional for accurate advice. Rates are for FY 2083/84 (2026/27).";
      doc.text(disclaimer, 105, doc.internal.pageSize.height - 10, { align: "center", maxWidth: 180 });
    }

    // Save PDF
    const filename = `income-tax-report-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="sm" onClick={generatePdf} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        }
      />
      <TooltipContent>
        <p>Download detailed tax report as PDF</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ShareButton({ getUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleCopy = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowInput(true);
    }
  };

  const handleShare = async () => {
    const url = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tax Calculation", url });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (showInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={getUrl()}
          readOnly
          className="text-xs"
          onFocus={(e) => e.target.select()}
        />
        <Button variant="outline" size="sm" onClick={() => setShowInput(false)}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
              </>
            )}
          </Button>
        }
      />
      <TooltipContent>
        <p>Copy shareable link with current inputs</p>
      </TooltipContent>
    </Tooltip>
  );
}
