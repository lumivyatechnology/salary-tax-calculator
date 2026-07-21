"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/tax";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  title: string;
  value: number;
  format?: "currency" | "percentage";
  variant?: "default" | "highlight" | "success" | "warning";
  description?: string;
  className?: string;
}

export function ResultCard({
  title,
  value,
  format = "currency",
  variant = "default",
  description,
  className,
}: ResultCardProps) {
  const formattedValue =
    format === "percentage" ? formatPercentage(value) : formatCurrency(value);

  const variantStyles = {
    default: "",
    highlight: "border-primary bg-primary/5",
    success: "border-green-500 bg-green-50 text-green-900",
    warning: "border-amber-500 bg-amber-50 text-amber-900",
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formattedValue}</p>
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
