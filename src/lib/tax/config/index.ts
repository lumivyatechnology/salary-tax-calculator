/**
 * Tax Configuration Index
 * 
 * Export the active fiscal year config and utilities for accessing configs.
 * When adding new fiscal years, import them here and add to availableConfigs.
 */

import { fy2083_84 } from "./fy-2083-84";
import type { TaxConfig } from "./types";

// Available fiscal year configurations
export const availableConfigs: Record<string, TaxConfig> = {
  "2083/84": fy2083_84,
};

// Default/current fiscal year
export const DEFAULT_FISCAL_YEAR = "2083/84";

// Get config by fiscal year
export function getTaxConfig(fiscalYear: string = DEFAULT_FISCAL_YEAR): TaxConfig {
  const config = availableConfigs[fiscalYear];
  if (!config) {
    throw new Error(`Tax config not found for fiscal year: ${fiscalYear}`);
  }
  return config;
}

// Get list of available fiscal years
export function getAvailableFiscalYears(): string[] {
  return Object.keys(availableConfigs);
}

// Current active config
export const currentConfig = fy2083_84;

// Re-export types
export * from "./types";
