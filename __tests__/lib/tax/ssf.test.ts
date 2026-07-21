import { describe, it, expect } from "vitest";
import {
  calculateSSF,
  calculateSSFFromAnnual,
  getSSFLimits,
} from "@/lib/tax/ssf";

describe("SSF Calculations", () => {
  describe("calculateSSF", () => {
    it("should calculate correct SSF for salary below cap", () => {
      const result = calculateSSF(40000);

      expect(result.monthlyBaseSalary).toBe(40000);
      expect(result.employeeMonthly).toBe(4400); // 40000 * 0.11
      expect(result.employerMonthly).toBe(8000); // 40000 * 0.20
      expect(result.capApplied).toBe(false);
    });

    it("should apply salary cap for high salaries", () => {
      const result = calculateSSF(100000);

      // Cap is 50000
      expect(result.employeeMonthly).toBe(5500); // 50000 * 0.11
      expect(result.employerMonthly).toBe(10000); // 50000 * 0.20
      expect(result.capApplied).toBe(true);
    });

    it("should calculate annual contributions correctly", () => {
      const result = calculateSSF(30000);

      expect(result.employeeAnnual).toBe(result.employeeMonthly * 12);
      expect(result.employerAnnual).toBe(result.employerMonthly * 12);
      expect(result.totalAnnual).toBe(result.employeeAnnual + result.employerAnnual);
    });

    it("should handle zero salary", () => {
      const result = calculateSSF(0);

      expect(result.employeeMonthly).toBe(0);
      expect(result.employerMonthly).toBe(0);
      expect(result.capApplied).toBe(false);
    });

    it("should handle salary at exact cap", () => {
      const result = calculateSSF(50000);

      expect(result.employeeMonthly).toBe(5500);
      expect(result.employerMonthly).toBe(10000);
      expect(result.capApplied).toBe(false); // At cap, not above
    });
  });

  describe("calculateSSFFromAnnual", () => {
    it("should convert annual salary to monthly and calculate", () => {
      const fromAnnual = calculateSSFFromAnnual(480000); // 40000/month
      const fromMonthly = calculateSSF(40000);

      expect(fromAnnual.employeeMonthly).toBe(fromMonthly.employeeMonthly);
      expect(fromAnnual.employerMonthly).toBe(fromMonthly.employerMonthly);
    });
  });

  describe("getSSFLimits", () => {
    it("should return correct limits based on config", () => {
      const limits = getSSFLimits();

      expect(limits.employeeRate).toBe(0.11);
      expect(limits.employerRate).toBe(0.20);
      expect(limits.maxMonthlySalary).toBe(50000);
      expect(limits.maxMonthly).toBe(5500); // 50000 * 0.11
      expect(limits.maxAnnual).toBe(66000); // 5500 * 12
    });
  });
});
