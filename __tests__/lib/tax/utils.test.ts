import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercentage,
  parseCurrency,
  validateIncome,
  validateSSFContribution,
  annualToMonthly,
  monthlyToAnnual,
  clamp,
} from "@/lib/tax/utils";

describe("Tax Utilities", () => {
  describe("formatCurrency", () => {
    it("should format with Rs symbol by default", () => {
      // Note: en-NP locale may not be available in all environments
      // Accept either Indian (1,00,000) or Western (100,000) grouping
      const result = formatCurrency(100000);
      expect(result).toMatch(/^Rs (1,00,000|100,000)$/);
    });

    it("should format without symbol when specified", () => {
      const result = formatCurrency(100000, { showSymbol: false });
      expect(result).toMatch(/^(1,00,000|100,000)$/);
    });

    it("should handle decimals", () => {
      const result = formatCurrency(100000.5, { decimals: 2 });
      expect(result).toMatch(/^Rs (1,00,000|100,000)\.50$/);
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("Rs 0");
    });
  });

  describe("formatPercentage", () => {
    it("should convert decimal to percentage", () => {
      expect(formatPercentage(0.25)).toBe("25.00%");
    });

    it("should handle small decimals", () => {
      expect(formatPercentage(0.01)).toBe("1.00%");
    });

    it("should respect decimal places", () => {
      expect(formatPercentage(0.123456, 1)).toBe("12.3%");
    });
  });

  describe("parseCurrency", () => {
    it("should parse formatted currency", () => {
      expect(parseCurrency("Rs 1,00,000")).toBe(100000);
    });

    it("should parse plain numbers", () => {
      expect(parseCurrency("50000")).toBe(50000);
    });

    it("should return 0 for invalid input", () => {
      expect(parseCurrency("abc")).toBe(0);
    });
  });

  describe("validateIncome", () => {
    it("should accept valid income", () => {
      expect(validateIncome(100000).valid).toBe(true);
    });

    it("should reject negative income", () => {
      const result = validateIncome(-100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("negative");
    });

    it("should reject unrealistic amounts", () => {
      const result = validateIncome(10000000000);
      expect(result.valid).toBe(false);
    });

    it("should reject NaN", () => {
      const result = validateIncome(NaN);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateSSFContribution", () => {
    it("should accept valid contribution", () => {
      expect(validateSSFContribution(5000, 10000).valid).toBe(true);
    });

    it("should reject contribution above max", () => {
      const result = validateSSFContribution(15000, 10000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceed");
    });
  });

  describe("conversion functions", () => {
    it("should convert annual to monthly", () => {
      expect(annualToMonthly(1200000)).toBe(100000);
    });

    it("should convert monthly to annual", () => {
      expect(monthlyToAnnual(100000)).toBe(1200000);
    });
  });

  describe("clamp", () => {
    it("should clamp below minimum", () => {
      expect(clamp(-5, 0, 100)).toBe(0);
    });

    it("should clamp above maximum", () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it("should not clamp values within range", () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });
  });
});
