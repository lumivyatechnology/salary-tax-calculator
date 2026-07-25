# Nepal Salary Tax Calculator

Web application for calculating Nepal income tax for FY 2083/84 (2026/27). Handles SSF/EPF contributions, insurance deductions, female rebate, and progressive tax brackets.

## Features

- Monthly salary or annual CTC input modes
- SSF (31%) and EPF (20%) contribution calculations
- Life and medical insurance deductions
- 10% female tax rebate
- Progressive tax bracket breakdown
- URL-synced state for shareable calculations

## Tech Stack

- Next.js 16.2, React 19, Tailwind CSS 4
- shadcn/ui (base-ui), Recharts
- Vitest + Testing Library

## Tax Calculator

### Inputs

| Field | Type | Description |
|-------|------|-------------|
| `salaryMode` | `monthly` / `ctc` | Monthly salary or annual CTC mode |
| `basicSalary` | number | Basic salary amount |
| `allowance` | number | HRA, DA, other allowances |
| `bonus` | number | Annual bonus |
| `gender` | `male` / `female` | Female gets 10% tax rebate |
| `fundType` | `ssf` / `epf` | Contribution fund type |
| `lifeInsurance` | number | Annual premium |
| `medicalInsurance` | number | Annual premium |
| `citContribution` | number | Citizen Investment Trust contribution |

### Outputs

| Output | Description |
|--------|-------------|
| Annual Gross Income | Total income including employer contribution |
| Total Deductions | SSF/EPF + insurance deductions |
| Taxable Income | Income after all deductions |
| Annual Tax | Final tax payable |
| Effective Rate | Tax as percentage of income |
| Monthly Take-Home | Net monthly after all deductions |
| Annual Take-Home | Net annual after tax and deductions |

#### Detailed Breakdowns

- **Monthly Salary**: Gross, SSF/EPF deduction, TDS, bonus portion, net
- **Fund Contribution**: SSF (31% total) or EPF (20% total) breakdown
- **Tax Deductions**: Retirement fund, CIT, life insurance, medical insurance
- **Tax Brackets**: Income and tax per bracket

### Tax Constants (FY 2083/84)

#### Tax Brackets

| Bracket | Rate |
|---------|------|
| Up to Rs 10,00,000 | 1% (waived for SSF) |
| Rs 10,00,001 - 15,00,000 | 10% |
| Rs 15,00,001 - 25,00,000 | 20% |
| Rs 25,00,001 - 40,00,000 | 27% |
| Above Rs 40,00,000 | 29% |

#### Deduction Limits

| Deduction | Max Limit |
|-----------|-----------|
| Life Insurance | Rs 40,000 |
| Medical Insurance | Rs 20,000 |
| Retirement Fund (1/3 rule) | Rs 5,00,000 |
| Female Rebate | 10% of tax |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
