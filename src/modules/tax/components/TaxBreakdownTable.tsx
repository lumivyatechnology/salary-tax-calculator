"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercentage, type BracketBreakdown } from "@/lib/tax";

interface TaxBreakdownTableProps {
  breakdown: BracketBreakdown[];
}

export function TaxBreakdownTable({ breakdown }: TaxBreakdownTableProps) {
  // Filter to only show brackets with tax
  const relevantBrackets = breakdown.filter(
    (b) => b.taxableInBracket > 0 || b.taxAmount > 0
  );

  if (relevantBrackets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tax breakdown available (income below taxable threshold)
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
          <TableRow key={index}>
            <TableCell className="font-medium">
              {item.bracket.label || `Bracket ${index + 1}`}
            </TableCell>
            <TableCell className="text-right">
              {formatPercentage(item.bracket.rate, 0)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(item.taxableInBracket)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(item.taxAmount)}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/50 font-semibold">
          <TableCell colSpan={3}>Total Tax</TableCell>
          <TableCell className="text-right">
            {formatCurrency(
              relevantBrackets.reduce((sum, b) => sum + b.taxAmount, 0)
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
