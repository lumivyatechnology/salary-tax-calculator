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
import { AlertTriangle, Check, Share2 } from "lucide-react";
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
    return <SSFContributionTable breakdown={result.ssfBreakdown} basicSalary={result.annualBasicSalary} />;
  }
  if (result.fundType === "epf" && result.epfBreakdown) {
    return <EPFContributionTable breakdown={result.epfBreakdown} basicSalary={result.annualBasicSalary} />;
  }
  return null;
}

interface SSFContributionTableProps {
  breakdown: SSFBreakdown;
  basicSalary: number;
}

function SSFContributionTable({ breakdown, basicSalary }: SSFContributionTableProps) {
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
  basicSalary: number;
}

function EPFContributionTable({ breakdown, basicSalary }: EPFContributionTableProps) {
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
