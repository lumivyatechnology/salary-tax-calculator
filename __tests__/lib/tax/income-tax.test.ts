import { describe, it, expect } from "vitest";
import {
  calculateIncomeTax,
  calculateSimpleTax,
  calculateTaxWithSSF,
  calculateBracketBreakdown,
} from "@/lib/tax/income-tax";
import { getTaxConfig } from "@/lib/tax/config";

describe("Income Tax Calculations", () => {
  const config = getTaxConfig("2083/84");

  describe("calculateBracketBreakdown", () => {
    it("should calculate correct breakdown for income in first bracket only", () => {
      const breakdown = calculateBracketBreakdown(500000, config.unmarriedBrackets);
      
      expect(breakdown[0].taxableInBracket).toBe(500000);
      expect(breakdown[0].taxAmount).toBe(5000); // 500000 * 0.01
      expect(breakdown[1].taxableInBracket).toBe(0);
    });

    it("should calculate correct breakdown for income across multiple brackets", () => {
      // Income: 15,00,000
      // Bracket 1: 10,00,000 @ 1% = 10,000
      // Bracket 2: 5,00,000 @ 10% = 50,000
      // Total: 60,000
      const breakdown = calculateBracketBreakdown(1500000, config.unmarriedBrackets);
      
      expect(breakdown[0].taxableInBracket).toBe(1000000);
      expect(breakdown[0].taxAmount).toBe(10000);
      
      expect(breakdown[1].taxableInBracket).toBe(500000);
      expect(breakdown[1].taxAmount).toBe(50000);
      
      expect(breakdown[2].taxableInBracket).toBe(0);
    });

    it("should calculate correctly for income in highest bracket", () => {
      // Income: 50,00,000
      // Bracket 1: 10,00,000 @ 1% = 10,000
      // Bracket 2: 5,00,000 @ 10% = 50,000
      // Bracket 3: 10,00,000 @ 20% = 2,00,000
      // Bracket 4: 15,00,000 @ 27% = 4,05,000
      // Bracket 5: 10,00,000 @ 29% = 2,90,000
      // Total: 9,55,000
      const breakdown = calculateBracketBreakdown(5000000, config.unmarriedBrackets);
      
      const totalTax = breakdown.reduce((sum, b) => sum + b.taxAmount, 0);
      expect(totalTax).toBe(955000);
    });

    it("should handle zero income", () => {
      const breakdown = calculateBracketBreakdown(0, config.unmarriedBrackets);
      
      breakdown.forEach((b) => {
        expect(b.taxableInBracket).toBe(0);
        expect(b.taxAmount).toBe(0);
      });
    });
  });

  describe("calculateSimpleTax", () => {
    it("should calculate tax for income in first bracket", () => {
      const result = calculateSimpleTax(800000);
      
      expect(result.grossIncome).toBe(800000);
      expect(result.taxableIncome).toBe(800000);
      expect(result.totalTax).toBe(8000); // 800000 * 0.01
      expect(result.takeHome).toBe(792000);
    });

    it("should calculate tax for income at bracket boundary", () => {
      const result = calculateSimpleTax(1000000);
      
      expect(result.totalTax).toBe(10000); // 1000000 * 0.01
    });

    it("should calculate tax for income in second bracket", () => {
      // Income: 12,00,000
      // Bracket 1: 10,00,000 @ 1% = 10,000
      // Bracket 2: 2,00,000 @ 10% = 20,000
      // Total: 30,000
      const result = calculateSimpleTax(1200000);
      
      expect(result.totalTax).toBe(30000);
      expect(result.effectiveRate).toBeCloseTo(0.025, 4);
    });

    it("should calculate effective tax rate correctly", () => {
      const result = calculateSimpleTax(2500000);
      
      // Total tax at 25,00,000:
      // Bracket 1: 10,00,000 @ 1% = 10,000
      // Bracket 2: 5,00,000 @ 10% = 50,000
      // Bracket 3: 10,00,000 @ 20% = 2,00,000
      // Total: 2,60,000
      expect(result.totalTax).toBe(260000);
      expect(result.effectiveRate).toBeCloseTo(0.104, 3);
    });
  });

  describe("calculateTaxWithSSF", () => {
    it("should reduce taxable income by SSF contribution", () => {
      const withoutSSF = calculateSimpleTax(1500000);
      const withSSF = calculateTaxWithSSF(1500000, 66000); // 5500 * 12
      
      expect(withSSF.totalDeductions).toBe(66000);
      expect(withSSF.taxableIncome).toBe(1434000);
      expect(withSSF.totalTax).toBeLessThan(withoutSSF.totalTax);
    });

    it("should show tax savings from SSF deduction", () => {
      const withoutSSF = calculateSimpleTax(2000000);
      const withSSF = calculateTaxWithSSF(2000000, 66000);
      
      // SSF deduction moves 66000 from 20% bracket to deductible
      // Savings should be significant
      const taxSavings = withoutSSF.totalTax - withSSF.totalTax;
      expect(taxSavings).toBeGreaterThan(0);
    });
  });

  describe("calculateIncomeTax", () => {
    it("should handle full input with all deductions", () => {
      const result = calculateIncomeTax({
        grossIncome: 2000000,
        maritalStatus: "unmarried",
        ssfContribution: 66000,
        remoteAreaAllowance: 50000,
        medicalAllowance: 50000,
        festivalAllowance: 100000,
        otherDeductions: 10000,
      });

      expect(result.totalDeductions).toBeGreaterThan(66000);
      expect(result.taxableIncome).toBeLessThan(2000000);
    });

    it("should respect medical allowance cap", () => {
      const result = calculateIncomeTax({
        grossIncome: 2000000,
        maritalStatus: "unmarried",
        ssfContribution: 0,
        remoteAreaAllowance: 0,
        medicalAllowance: 200000, // Above 75000 cap
        festivalAllowance: 0,
        otherDeductions: 0,
      });

      // Should only deduct up to 75000 (config max)
      expect(result.totalDeductions).toBe(75000);
    });
  });
});
