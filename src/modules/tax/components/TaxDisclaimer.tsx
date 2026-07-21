"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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
