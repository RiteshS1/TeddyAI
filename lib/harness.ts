import { complete, type ByoKey } from "./providers";
import {
  composite,
  computeMetrics,
  defaultReadiness,
  PORTABILITY,
  readinessScore,
  valuationRange,
} from "./metrics";
import type { Claim, FirmInput, Memo, MoatRow, ReadinessRow, Report } from "./types";

type NumMap = Record<string, number>;

const SECTIONS = ["keyman", "revenue", "readiness", "moat", "valuation"] as const;

export function numericMap(
  m: ReturnType<typeof computeMetrics>,
  extra: { readiness: number; composite: number; rangeLow: number; rangeHigh: number; multLow: number; multHigh: number },
): NumMap {
  return {
    revenue25: m.revenue25,
    cagr: m.cagr,
    revPerLawyer: m.revPerLawyer,
    staffPerLawyer: m.staffPerLawyer,
    projectPct: m.projectPct,
    recurringPct: m.recurringPct,
    topClientPct: m.topClientPct,
    attritionPct: m.attritionPct,
    top1Share: m.top1Share,
    top3Share: m.top3Share,
    loseTop1Pct: m.loseTop1Pct,
    keyManRisk: m.keyManRisk,
    durability: m.durability,
    readiness: extra.readiness,
    composite: extra.composite,
    rangeLow: extra.rangeLow,
    rangeHigh: extra.rangeHigh,
    multLow: extra.multLow,
    multHigh: extra.multHigh,
  };
}

/** What each figure actually means. The model sees this, and so does the meaning checker. */
export const METRIC_DOCS: Record<string, string> = {
  revenue25: "2025 total firm revenue, $M",
  cagr: "revenue growth per year, 2023 to 2025, percent",
  revPerLawyer: "2025 revenue per lawyer, $M",
  staffPerLawyer: "non-lawyer staff for each lawyer",
  projectPct: "percent of revenue that is one-off, project-based work",
  recurringPct: "percent of revenue that is retainer or ongoing work",
  topClientPct: "percent of revenue from the single largest CLIENT",
  attritionPct: "percent of the team (lawyers and staff) who left in the last 12 months",
  top1Share: "percent of revenue originated by the single biggest PARTNER (not a client)",
  top3Share: "percent of revenue originated by the three biggest PARTNERS together (not clients)",
  loseTop1Pct: "percent of revenue lost if the biggest partner left and 60% of their book followed",
  keyManRisk: "0-100 index of reliance on a few partners, higher is worse (an index, not a percent of revenue)",
  durability: "0-100 index of how repeatable the revenue is, higher is better (an index, not a percent of revenue)",
  readiness: "0-100 index of how much back-office work is checkable and can wait for a careful answer",
  composite: "0-100 blended score of durability, key-man safety and readiness",
  rangeLow: "low end of the illustrative value range, $M",
  rangeHigh: "high end of the illustrative value range, $M",
  multLow: "low end of the illustrative multiple, x revenue",
  multHigh: "high end of the illustrative multiple, x revenue",
};

const SYSTEM = `You are an analyst writing a first-pass back-office valuation note for a law firm owner.
Rules:
- Every number you state must come from the METRICS object. Never compute or invent figures.
- Each metric has a "means" definition. Use each figure only for what it means. Partner shares are about partners and originators, never clients; the only client figure is topClientPct. Index scores (0-100) are not percentages of revenue.
- Each claim must list "cites": [{"metric": <a key from METRICS>, "value": <that metric's exact value>}] for every number in its text.
- Be plain, warm and direct. No hype, no legal or investment advice. 2 sentences max per claim.
- Be honest about weaknesses. Say what any competent competitor could copy versus what is plausibly proprietary.
Return ONLY JSON of this shape:
{
 "summary": string (2-3 sentences),
 "claims": [{"id": "c1", "section": "keyman"|"revenue"|"readiness"|"moat"|"valuation", "text": string, "cites": [{"metric": string, "value": number}]}],
 "readiness": [{"fn": string, "automatable": "high"|"medium"|"low", "verifiable": boolean, "latencyTolerant": boolean, "why": string}],
 "moat": [{"lever": string, "copyable": boolean, "why": string}],
 "changeMyMind": [string, string, string]
}
Produce 8 to 12 claims covering all five sections, 4 to 6 readiness rows for back-office functions (compliance, operational, technological), and 3 to 4 moat rows.
"verifiable" means a result can be checked against a source or rule. "latencyTolerant" means a slow, careful answer is fine.`;

function userPrompt(input: FirmInput, nums: NumMap) {
  return JSON.stringify(
    {
      FIRM: {
        firmType: input.firmType,
        lawyers: input.lawyers,
        staff: input.staff,
        yearsInBusiness: input.yearsInBusiness,
        saleInterest: input.saleInterest,
        partnersProvided: input.partners.length,
        keyManNote: `lose-partner assumes ${Math.round(PORTABILITY * 100)}% of an originator's book leaves with them`,
      },
      METRICS: Object.fromEntries(
        Object.entries(nums).map(([k, v]) => [k, { value: v, means: METRIC_DOCS[k] ?? "" }]),
      ),
      SEED_READINESS: defaultReadiness(input.firmType).map((r) => r.fn),
    },
    null,
    1,
  );
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("no json object");
  return JSON.parse(cleaned.slice(a, b + 1));
}

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

function coerceMemo(raw: unknown): Memo {
  const o = (raw ?? {}) as Record<string, unknown>;
  const claims: Claim[] = (Array.isArray(o.claims) ? o.claims : [])
    .map((c: Record<string, unknown>, i: number) => ({
      id: str(c.id, `c${i + 1}`),
      section: (SECTIONS as readonly string[]).includes(str(c.section)) ? (c.section as Claim["section"]) : "revenue",
      text: str(c.text),
      cites: (Array.isArray(c.cites) ? c.cites : [])
        .map((x: Record<string, unknown>) => ({ metric: str(x.metric), value: Number(x.value) }))
        .filter((x) => x.metric && Number.isFinite(x.value)),
    }))
    .filter((c) => c.text);
  const readiness: ReadinessRow[] = (Array.isArray(o.readiness) ? o.readiness : [])
    .map((r: Record<string, unknown>) => ({
      fn: str(r.fn),
      automatable: (["high", "medium", "low"].includes(str(r.automatable)) ? r.automatable : "medium") as ReadinessRow["automatable"],
      verifiable: Boolean(r.verifiable),
      latencyTolerant: Boolean(r.latencyTolerant),
      why: str(r.why),
    }))
    .filter((r) => r.fn);
  const moat: MoatRow[] = (Array.isArray(o.moat) ? o.moat : [])
    .map((r: Record<string, unknown>) => ({ lever: str(r.lever), copyable: Boolean(r.copyable), why: str(r.why) }))
    .filter((r) => r.lever);
  const changeMyMind = (Array.isArray(o.changeMyMind) ? o.changeMyMind : []).map((s) => str(s)).filter(Boolean);
  if (claims.length < 3) throw new Error("too few claims");
  return { summary: str(o.summary), claims, readiness, moat, changeMyMind };
}

/** The verifier: recompute against the deterministic numbers. The model never grades itself. */
export function verifyClaims(claims: Claim[], nums: NumMap): Claim[] {
  return claims.map((c) => {
    if (c.cites.length === 0) {
      return { ...c, verified: false, reason: "States no figure, so there is nothing to check." };
    }
    for (const cite of c.cites) {
      const actual = nums[cite.metric as string];
      if (actual === undefined) return { ...c, verified: false, reason: `Cites "${cite.metric}", which is not one of our calculated figures.` };
      const tol = Math.max(0.06, Math.abs(actual) * 0.01);
      if (Math.abs(actual - cite.value) > tol) {
        return { ...c, verified: false, reason: `Says ${cite.metric} is ${cite.value}; we calculate ${actual}.` };
      }
    }
    return { ...c, verified: true };
  });
}

function rulesMemo(input: FirmInput, nums: NumMap, m: ReturnType<typeof computeMetrics>): Memo {
  const c = (id: string, section: Claim["section"], text: string, ...metrics: string[]): Claim => ({
    id,
    section,
    text,
    cites: metrics.map((k) => ({ metric: k, value: nums[k] })),
  });
  const claims: Claim[] = [
    c("r1", "keyman", `${m.top1Name} accounts for ${m.top1Share}% of revenue, and the top three account for ${m.top3Share}%.`, "top1Share", "top3Share"),
    c("r2", "keyman", `If ${m.top1Name} left and ${Math.round(PORTABILITY * 100)}% of that book followed, about ${m.loseTop1Pct}% of revenue would go with them.`, "loseTop1Pct"),
    c("r3", "revenue", `${m.recurringPct}% of revenue is recurring and ${m.projectPct}% is project-based.`, "recurringPct", "projectPct"),
    c("r4", "revenue", `The largest client is ${m.topClientPct}% of revenue, and revenue has grown ${m.cagr}% a year over two years.`, "topClientPct", "cagr"),
    c("r5", "revenue", `${m.attritionPct}% of the team left in the last twelve months.`, "attritionPct"),
    c("r6", "readiness", `Back-office readiness scores ${nums.readiness} out of 100, driven by work that can be checked against a rule or a record.`, "readiness"),
    c("r7", "valuation", `Combined, the firm scores ${nums.composite} out of 100, which supports an illustrative ${nums.multLow}x to ${nums.multHigh}x revenue band.`, "composite", "multLow", "multHigh"),
  ];
  return {
    summary: `${input.name} brings $${m.revenue25}M of revenue. The biggest questions are how much of it depends on ${m.top1Name} and how much repeats without a new engagement.`,
    claims,
    readiness: defaultReadiness(input.firmType),
    moat: [
      { lever: "Automating billing review and intake", copyable: true, why: "Any firm with off-the-shelf tools can do this, so it earns margin but not a moat." },
      { lever: "Shared compliance playbooks across many firms", copyable: false, why: "Value compounds with each firm added, which a single firm cannot copy." },
      { lever: "Partner relationships", copyable: false, why: "Stays with the partner, which is also the key-man risk." },
    ],
    changeMyMind: [
      "Signed multi-year retainers covering most of the project-based revenue.",
      "A named successor for the top originator with a track record of winning work.",
      "Lower attrition among senior associates over the next two quarters.",
    ],
  };
}

export async function underwrite(input: FirmInput, byo?: ByoKey): Promise<Report> {
  const t0 = Date.now();
  const metrics = computeMetrics(input);
  let memo: Memo | undefined;
  let provider: Report["meta"]["provider"] = "rules";
  let model = "deterministic rules";
  let note: string | undefined;
  let usedOwnKey = false;

  // Readiness and range need a readiness score, so seed from defaults; refined after the model answers.
  const seed = defaultReadiness(input.firmType);
  const mkNums = (rows: ReadinessRow[]) => {
    const readiness = readinessScore(rows);
    const comp = composite(metrics, readiness);
    const v = valuationRange(metrics.revenue25, comp);
    return {
      readiness,
      comp,
      v,
      nums: numericMap(metrics, {
        readiness,
        composite: comp,
        rangeLow: v.range.low,
        rangeHigh: v.range.high,
        multLow: v.multiple.low,
        multHigh: v.multiple.high,
      }),
    };
  };

  let state = mkNums(seed);
  const { result, errors } = await complete(SYSTEM, userPrompt(input, state.nums), byo);
  if (result) {
    try {
      memo = coerceMemo(extractJson(result.text));
      provider = result.provider;
      model = result.model;
      usedOwnKey = Boolean(result.viaByo);
      if (byo && !usedOwnKey) {
        note = `Your ${byo.provider} key did not work, so this note used the free demo keys instead.`;
      }
      // Scores stay on the seed readiness the model was shown, so every cited number is stable.
      if (memo.readiness.length < 3) memo.readiness = seed;
    } catch (e) {
      note = `Model answer could not be read (${(e as Error).message}); showing the rules-based note.`;
    }
  } else {
    note = "AI providers were unavailable, so this note uses our rules-based engine.";
    console.warn("[underwrite] providers failed:", errors.join(" | "));
  }

  if (!memo) memo = rulesMemo(input, state.nums, metrics);
  // Claims were written against seed numbers; re-verify against the final numbers.
  memo.claims = verifyClaims(memo.claims, state.nums);
  return {
    input,
    metrics,
    readinessScore: state.readiness,
    composite: state.comp,
    range: state.v.range,
    multiple: state.v.multiple,
    memo,
    meta: { provider, model, ms: Date.now() - t0, note, errors: errors.length ? errors : undefined, ownKey: usedOwnKey },
  };
}
