import { NextResponse } from "next/server";
import { underwrite } from "@/lib/harness";
import type { FirmInput } from "@/lib/types";
import type { ByoKey, ProviderId } from "@/lib/providers";

export const maxDuration = 60;

const hits = new Map<string, number[]>();
const LIMIT = 12; // runs per IP per hour, to protect free-tier quotas
const WINDOW = 60 * 60 * 1000;

function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > LIMIT;
}

const num = (v: unknown, lo: number, hi: number) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Numbers only, please.");
  return Math.min(hi, Math.max(lo, n));
};

function parse(b: Record<string, unknown>): FirmInput {
  const rev = (b.revenue ?? {}) as Record<string, unknown>;
  const partners = (Array.isArray(b.partners) ? b.partners : []).slice(0, 8).map((p: Record<string, unknown>) => ({
    name: String(p.name ?? "").slice(0, 40) || "Partner",
    origination: num(p.origination, 0, 1000),
  }));
  return {
    name: String(b.name ?? "Your firm").slice(0, 60),
    firmType: String(b.firmType ?? "General practice") as FirmInput["firmType"],
    revenue: { y2023: num(rev.y2023, 0, 1000), y2024: num(rev.y2024, 0, 1000), y2025: num(rev.y2025, 0, 1000) },
    lawyers: num(b.lawyers, 1, 2000),
    staff: num(b.staff, 0, 5000),
    attritionPct: num(b.attritionPct, 0, 100),
    topClientPct: num(b.topClientPct, 0, 100),
    recurringPct: num(b.recurringPct, 0, 100),
    yearsInBusiness: num(b.yearsInBusiness, 0, 200),
    saleInterest: String(b.saleInterest ?? "Just exploring") as FirmInput["saleInterest"],
    partners,
  };
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send the firm details as JSON." }, { status: 400 });
  }

  let byo: ByoKey | undefined;
  const k = body.byo as { provider?: string; key?: string } | undefined;
  if (k?.key && ["groq", "gemini", "anthropic"].includes(k.provider ?? "")) {
    byo = { provider: k.provider as ProviderId, key: k.key.trim().slice(0, 300) };
  }
  // People bringing their own key are spending their own quota, so skip our limit for them.
  if (!byo && limited(ip)) {
    return NextResponse.json(
      { error: "That's the hourly limit for the free demo. Add your own key to keep going, or try again later." },
      { status: 429 },
    );
  }

  try {
    const input = parse((body.input ?? {}) as Record<string, unknown>);
    const report = await underwrite(input, byo);
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Something went wrong." }, { status: 400 });
  }
}
