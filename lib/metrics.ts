import type { FirmInput, Metrics, ReadinessRow } from "./types";

/** Share of an originator's book assumed to follow them out the door. Stated openly in the UI. */
export const PORTABILITY = 0.6;

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

export function computeMetrics(f: FirmInput): Metrics {
  const { y2023, y2024, y2025 } = f.revenue;
  const revenue25 = y2025;
  const cagr = y2023 > 0 ? (Math.pow(y2025 / y2023, 1 / 2) - 1) * 100 : 0;
  const lawyers = Math.max(1, f.lawyers);
  const partners = [...f.partners]
    .filter((p) => p.origination > 0)
    .sort((a, b) => b.origination - a.origination);
  const partnerKnown = partners.length > 0 && revenue25 > 0;

  const share = (n: number) =>
    revenue25 > 0 ? clamp((partners.slice(0, n).reduce((s, p) => s + p.origination, 0) / revenue25) * 100) : 0;

  let top1Share = share(1);
  let top3Share = share(3);
  if (!partnerKnown) {
    // Estimate from headcount when no origination data was given.
    top1Share = clamp(70 - lawyers * 2.5, 12, 55);
    top3Share = clamp(top1Share * 2, 25, 90);
  }
  const loseTop1Pct = top1Share * PORTABILITY;
  const keyManRisk = clamp(0.6 * top1Share + 0.4 * top3Share);

  const growthScore = clamp(50 + cagr * 4);
  const concentrationScore = clamp(100 - f.topClientPct * 2);
  const attritionScore = clamp(100 - f.attritionPct * 3);
  const durability = clamp(
    0.4 * f.recurringPct + 0.25 * concentrationScore + 0.2 * growthScore + 0.15 * attritionScore,
  );

  return {
    revenue25,
    cagr: r1(cagr),
    revPerLawyer: r1(revenue25 / lawyers),
    staffPerLawyer: r1(f.staff / lawyers),
    projectPct: r1(100 - f.recurringPct),
    recurringPct: f.recurringPct,
    topClientPct: f.topClientPct,
    attritionPct: f.attritionPct,
    partnerKnown,
    top1Share: r1(top1Share),
    top3Share: r1(top3Share),
    top1Name: partnerKnown ? partners[0].name : "your top originator",
    loseTop1Pct: r1(loseTop1Pct),
    keyManRisk: r1(keyManRisk),
    durability: r1(durability),
  };
}

/** Back office functions per practice type, used by the rules-based fallback and to seed the model. */
export function defaultReadiness(type: FirmInput["firmType"]): ReadinessRow[] {
  const base: ReadinessRow[] = [
    {
      fn: "Conflict checks and intake",
      automatable: "high",
      verifiable: true,
      latencyTolerant: true,
      why: "Rules are explicit and every hit can be traced to a record.",
    },
    {
      fn: "Billing review and time-entry cleanup",
      automatable: "high",
      verifiable: true,
      latencyTolerant: true,
      why: "Entries can be checked against engagement terms; overnight batches are fine.",
    },
    {
      fn: "Regulatory deadline and filing tracking",
      automatable: "high",
      verifiable: true,
      latencyTolerant: true,
      why: "Dates and filings are checkable against source rules.",
    },
    {
      fn: "Client status updates",
      automatable: "medium",
      verifiable: false,
      latencyTolerant: true,
      why: "Drafts can be generated, but tone and judgement need a partner's sign-off.",
    },
    {
      fn: "Business development and referrals",
      automatable: "low",
      verifiable: false,
      latencyTolerant: false,
      why: "Relationship-driven, so the value stays with the partner.",
    },
  ];
  if (type === "Compliance and regulatory") base[2].why = "This is the core product: obligations map cleanly to checkable rules.";
  if (type === "Litigation") base.splice(3, 0, {
    fn: "Document review and chronology building",
    automatable: "high",
    verifiable: true,
    latencyTolerant: true,
    why: "Findings cite source pages, and a slow, careful model is acceptable.",
  });
  return base;
}

export function readinessScore(rows: ReadinessRow[]): number {
  if (!rows.length) return 0;
  const pts = rows.map((r) => {
    const a = r.automatable === "high" ? 1 : r.automatable === "medium" ? 0.5 : 0.1;
    return a * (r.verifiable ? 1 : 0.6) * (r.latencyTolerant ? 1 : 0.8);
  });
  return r1((pts.reduce((s, n) => s + n, 0) / rows.length) * 100);
}

export function composite(m: Metrics, readiness: number): number {
  return r1(0.4 * m.durability + 0.35 * (100 - m.keyManRisk) + 0.25 * readiness);
}

/** Illustrative revenue multiple band. Not a market comp. */
export function valuationRange(revenue: number, comp: number) {
  const low = 0.6 + (comp / 100) * 0.9;
  const high = low * 1.25;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    multiple: { low: round2(low), high: round2(high) },
    range: { low: r1(revenue * low), high: r1(revenue * high) },
  };
}

export function lawyerDots(f: FirmInput) {
  return { lawyers: Math.min(60, Math.round(f.lawyers)), staff: Math.min(60, Math.round(f.staff)) };
}
