export type FirmType =
  | "Litigation"
  | "Corporate and transactional"
  | "Compliance and regulatory"
  | "Family and private client"
  | "Intellectual property"
  | "General practice";

export type SaleInterest = "Actively looking" | "Open to the right partner" | "Just exploring";

export interface Partner {
  name: string;
  origination: number; // $M originated per year
}

export interface FirmInput {
  name: string;
  firmType: FirmType;
  revenue: { y2023: number; y2024: number; y2025: number }; // $M
  lawyers: number;
  staff: number;
  attritionPct: number; // % of people who left in last 12 months
  topClientPct: number; // % of revenue from largest client
  recurringPct: number; // % of revenue that is retainer / ongoing
  yearsInBusiness: number;
  saleInterest: SaleInterest;
  partners: Partner[]; // optional
}

export interface Metrics {
  revenue25: number;
  cagr: number; // %
  revPerLawyer: number; // $M
  staffPerLawyer: number;
  projectPct: number;
  recurringPct: number;
  topClientPct: number;
  attritionPct: number;
  partnerKnown: boolean;
  top1Share: number; // % of revenue
  top3Share: number; // % of revenue
  top1Name: string;
  loseTop1Pct: number; // % of revenue at risk if top originator leaves
  keyManRisk: number; // 0-100, higher = worse
  durability: number; // 0-100, higher = better
}

export interface Cite {
  metric: keyof Metrics | string;
  value: number;
}

export interface Claim {
  id: string;
  section: "keyman" | "revenue" | "readiness" | "moat" | "valuation";
  text: string;
  cites: Cite[];
  verified?: boolean;
  reason?: string;
}

export interface ReadinessRow {
  fn: string; // back office function
  automatable: "high" | "medium" | "low";
  verifiable: boolean;
  latencyTolerant: boolean;
  why: string;
}

export interface MoatRow {
  lever: string;
  copyable: boolean;
  why: string;
}

export interface Memo {
  summary: string;
  claims: Claim[];
  readiness: ReadinessRow[];
  moat: MoatRow[];
  changeMyMind: string[];
}

export interface Report {
  input: FirmInput;
  metrics: Metrics;
  readinessScore: number;
  composite: number;
  range: { low: number; high: number }; // $M indicative
  multiple: { low: number; high: number };
  memo: Memo;
  meta: {
    provider: "groq" | "gemini" | "anthropic" | "rules";
    model: string;
    ms: number;
    note?: string;
    errors?: string[];
    ownKey?: boolean;
  };
}
