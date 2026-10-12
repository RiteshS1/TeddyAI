/**
 * Offline checks for the deterministic layer and the verifier. No API keys needed.
 * Run: npm run eval
 */
import { computeMetrics, readinessScore, defaultReadiness, composite, valuationRange } from "../lib/metrics";
import { numericMap, verifyClaims } from "../lib/harness";
import { SAMPLES } from "../lib/samples";
import type { Claim } from "../lib/types";

// Hand-labelled ground truth for the key-man and durability layers.
const TRUTH: Record<string, { top1Share: number; loseTop1Pct: number; cagr: number }> = {
  boutique: { top1Share: 54.5, loseTop1Pct: 32.7, cagr: 23.0 },
  compliance: { top1Share: 15.0, loseTop1Pct: 9.0, cagr: 6.4 },
  litigation: { top1Share: 40.3, loseTop1Pct: 24.2, cagr: -8.5 },
};

let fail = 0;
const near = (a: number, b: number, t = 0.2) => Math.abs(a - b) <= t;

console.log("Deterministic metrics vs hand-labelled truth");
for (const s of SAMPLES) {
  const m = computeMetrics(s.input);
  const t = TRUTH[s.id];
  for (const k of ["top1Share", "loseTop1Pct", "cagr"] as const) {
    const ok = near(m[k], t[k]);
    if (!ok) fail++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${s.id}.${k}: got ${m[k]}, expected ${t[k]}`);
  }
}

console.log("\nVerifier flags planted bad claims");
const s0 = SAMPLES[0].input;
const m0 = computeMetrics(s0);
const rd = readinessScore(defaultReadiness(s0.firmType));
const comp = composite(m0, rd);
const v = valuationRange(m0.revenue25, comp);
const nums = numericMap(m0, { readiness: rd, composite: comp, rangeLow: v.range.low, rangeHigh: v.range.high, multLow: v.multiple.low, multHigh: v.multiple.high });
const claims: Claim[] = [
  { id: "good", section: "keyman", text: "top1 54.5", cites: [{ metric: "top1Share", value: 54.5 }] },
  { id: "wrong-number", section: "keyman", text: "top1 30", cites: [{ metric: "top1Share", value: 30 }] },
  { id: "unknown-metric", section: "revenue", text: "ebitda 4", cites: [{ metric: "ebitda", value: 4 }] },
  { id: "no-cite", section: "revenue", text: "trust me", cites: [] },
];
const out = verifyClaims(claims, nums);
const expect: Record<string, boolean> = { good: true, "wrong-number": false, "unknown-metric": false, "no-cite": false };
for (const c of out) {
  const ok = c.verified === expect[c.id];
  if (!ok) fail++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${c.id}: verified=${c.verified}${c.reason ? ` (${c.reason})` : ""}`);
}

console.log(fail ? `\n${fail} check(s) failed` : "\nAll checks passed");
process.exit(fail ? 1 : 0);
