/**
 * Navigation Configuration
 * 
 * Central config for all app navigation.
 * To add a new module:
 * 1. Add entry here
 * 2. Create app/[path]/ folder with page.tsx
 * That's it!
 */

import {
  Calculator,
  Receipt,
  PiggyBank,
  TrendingUp,
  FileStack,
  type LucideIcon,
} from "lucide-react";

export interface SubNavItem {
  label: string;
  path: string;
  description?: string;
}

export interface NavModule {
  /** Display label */
  label: string;
  /** Route path */
  path: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Short description */
  description?: string;
  /** Sub-navigation items (for modules with multiple tools) */
  subNav?: SubNavItem[];
}

/**
 * Main navigation modules
 * Add new feature modules here
 */
export const mainModules: NavModule[] = [
  {
    label: "Tax Calculator",
    path: "/tax",
    icon: Calculator,
    description: "Nepal income tax tools",
    subNav: [
      {
        label: "Income Tax",
        path: "/tax/income",
        description: "Calculate income tax with SSF/EPF, insurance, and female rebate",
      },
    ],
  },
  // Future modules go here:
  // {
  //   label: "EMI Calculator",
  //   path: "/emi",
  //   icon: Receipt,
  //   description: "Loan EMI calculator",
  // },
];

/**
 * Get module by path
 */
export function getModuleByPath(path: string): NavModule | undefined {
  return mainModules.find((m) => path.startsWith(m.path));
}

/**
 * Get sub-nav item by path
 */
export function getSubNavByPath(path: string): SubNavItem | undefined {
  for (const module of mainModules) {
    if (module.subNav) {
      const item = module.subNav.find((s) => s.path === path);
      if (item) return item;
    }
  }
  return undefined;
}
