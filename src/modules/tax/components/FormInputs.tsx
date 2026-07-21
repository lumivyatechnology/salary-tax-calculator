"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableFiscalYears, type MaritalStatus } from "@/lib/tax";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  helpText?: string;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  error,
  helpText,
  placeholder = "0",
  className,
}: CurrencyInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          Rs
        </span>
        <Input
          id={id}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className={cn("pl-10", error && "border-red-500")}
          min={0}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface MaritalStatusSelectProps {
  value: MaritalStatus;
  onChange: (value: MaritalStatus) => void;
  className?: string;
}

export function MaritalStatusSelect({
  value,
  onChange,
  className,
}: MaritalStatusSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>Marital Status</Label>
      <Select value={value} onValueChange={(v) => v && onChange(v as MaritalStatus)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unmarried">Unmarried</SelectItem>
          <SelectItem value="married">Married</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface FiscalYearSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FiscalYearSelect({
  value,
  onChange,
  className,
}: FiscalYearSelectProps) {
  const fiscalYears = getAvailableFiscalYears();

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Fiscal Year</Label>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fiscalYears.map((fy) => (
            <SelectItem key={fy} value={fy}>
              {fy}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
