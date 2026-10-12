"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";
import type { Claim, Report } from "@/lib/types";
import { PartnerBar } from "./PartnerBar";
import type { ProviderId } from "@/lib/providers";

gsap.registerPlugin(useGSAP);

const SECTION_TITLES: Record<Claim["section"], string> = {
  keyman: "Who brings the work in",
  revenue: "Will the revenue repeat?",
  readiness: "What software can safely do",
  moat: "What is hard to copy",
  valuation: "How we got to the range",
};

function Badge({ c, i }: { c: Claim; i: number }) {
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 420, damping: 16 }}
      className={`mt-0.5 inline-flex h-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        c.verified ? "bg-text text-bg" : "hatch-soft border border-text"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        {c.verified ? (
          <path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 2v5M6 9.5v.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
      {c.verified ? "Checked" : "Flagged"}
    </motion.span>
  );
}

function Meter({ label, value, good, note }: { label: string; value: number; good: boolean; note: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-2xl font-semibold tracking-tight">{Math.round(value)}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${label}: ${Math.round(value)} out of 100, ${good ? "healthy" : "a concern"}`}>
        <div className={`meter h-full rounded-full ${good ? "bg-text" : "hatch border-r-2 border-text"}`} data-w={value} style={{ width: 0 }} />
      </div>
      <p className="mt-1.5 text-sm text-muted">{note}</p>
    </div>
  );
}

export function Memo({
  report, onRestart, onRerun, busy,
}: {
  report: Report;
  onRestart: () => void;
  onRerun: (byo: { provider: ProviderId; key: string }) => void;
  busy: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<ProviderId>("groq");
  const [key, setKey] = useState("");
  const { metrics: m, memo, meta, input } = report;
  const checked = memo.claims.filter((c) => c.verified).length;
  const flagged = memo.claims.length - checked;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(".rail", { y: 24, opacity: 0, duration: 0.5 })
          .to(".meter", { width: (_i: number, el: HTMLElement) => `${el.dataset.w}%`, duration: 0.9, stagger: 0.12 }, "-=0.2")
          .from(".range-num", { textContent: 0, duration: 1, snap: { textContent: 0.1 } }, "<");
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".meter", { width: (_i: number, el: HTMLElement) => `${el.dataset.w}%` });
      });
    },
    { scope: root },
  );

  const bySection = (s: Claim["section"]) => memo.claims.filter((c) => c.section === s);
  const usedFree = !meta.ownKey && !showKey;

  return (
    <div ref={root} className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)] lg:gap-16">
        <article aria-labelledby="memo-title" className="space-y-16">
          <header>
            <button type="button" onClick={onRestart} className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium hover:border-text">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 2L3.5 7l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Start over
            </button>
            <h1 id="memo-title" className="text-5xl sm:text-7xl">{input.name}</h1>
            <p className="mt-2 text-xl text-muted">First-pass back-office note</p>
            <p className="mt-8 max-w-prose text-2xl leading-snug tracking-tight">{memo.summary}</p>
            {!meta.ownKey && meta.provider !== "rules" && (
              <p className="mt-6 rounded-2xl border border-line bg-subtle p-4 text-sm">
                <span className="font-semibold">Written with free API keys, so it can make mistakes.</span> Every figure is recalculated from your answers, but the wording can be off. Use your own key for better results.
              </p>
            )}
            {meta.note && (
              <div className="mt-6 rounded-2xl border border-text p-4 text-sm" role="status">
                <p className="font-medium">{meta.note}</p>
                {meta.errors && meta.errors.length > 0 && meta.note && (
                  <details className="mt-2">
                    <summary className="text-muted">{meta.provider === "rules" ? "Why no model was used" : "What went wrong"}</summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                      {meta.errors.map((e) => <li key={e}>{e}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </header>

          <section aria-labelledby="s-keyman" className="space-y-6">
            <h2 id="s-keyman" className="text-3xl sm:text-4xl">{SECTION_TITLES.keyman}</h2>
            {m.partnerKnown ? (
              <PartnerBar firm={input} />
            ) : (
              <p className="rounded-2xl border border-dashed border-muted p-4 text-sm">
                No partner figures were given, so this is estimated from headcount. Start over and add your top originators for a real number.
              </p>
            )}
            <ClaimList claims={bySection("keyman")} />
          </section>

          <section aria-labelledby="s-revenue" className="space-y-6">
            <h2 id="s-revenue" className="text-3xl sm:text-4xl">{SECTION_TITLES.revenue}</h2>
            <ClaimList claims={bySection("revenue")} />
          </section>

          <section aria-labelledby="s-ready" className="space-y-6">
            <h2 id="s-ready" className="text-3xl sm:text-4xl">{SECTION_TITLES.readiness}</h2>
            <p className="max-w-prose text-lg text-muted">
              We look for work that can be checked against a rule or a record, and where a slow, careful answer is fine. That is where technology earns its keep.
            </p>
            <div className="overflow-x-auto rounded-3xl border border-line">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <caption className="sr-only">Back-office functions and how ready they are for automation</caption>
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th scope="col" className="p-4 font-medium">Function</th>
                    <th scope="col" className="p-4 font-medium">Automatable</th>
                    <th scope="col" className="p-4 font-medium">Checkable</th>
                    <th scope="col" className="p-4 font-medium">Can wait</th>
                  </tr>
                </thead>
                <tbody>
                  {memo.readiness.map((r) => (
                    <tr key={r.fn} className="border-b border-line align-top last:border-0">
                      <th scope="row" className="p-4 text-base font-medium">
                        {r.fn}
                        <span className="mt-0.5 block text-sm font-normal text-muted">{r.why}</span>
                      </th>
                      <td className="p-4 capitalize">{r.automatable}</td>
                      <td className="p-4">{r.verifiable ? "Yes" : "No"}</td>
                      <td className="p-4">{r.latencyTolerant ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ClaimList claims={bySection("readiness")} />
          </section>

          <section aria-labelledby="s-moat" className="space-y-6">
            <h2 id="s-moat" className="text-3xl sm:text-4xl">{SECTION_TITLES.moat}</h2>
            <ul className="space-y-3">
              {memo.moat.map((r) => (
                <li key={r.lever} className="flex gap-4 rounded-3xl border border-line p-5">
                  <span className={`mt-0.5 h-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${r.copyable ? "hatch-soft border border-text" : "bg-text text-bg"}`}>
                    {r.copyable ? "Easy to copy" : "Hard to copy"}
                  </span>
                  <div>
                    <p className="text-lg font-medium">{r.lever}</p>
                    <p className="text-muted">{r.why}</p>
                  </div>
                </li>
              ))}
            </ul>
            <ClaimList claims={bySection("moat")} />
          </section>

          <section aria-labelledby="s-val" className="space-y-6">
            <h2 id="s-val" className="text-3xl sm:text-4xl">{SECTION_TITLES.valuation}</h2>
            <ClaimList claims={bySection("valuation")} />
            <div>
              <p className="text-lg font-semibold">What would change this</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-muted">
                {memo.changeMyMind.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </section>

          <section aria-labelledby="s-next" className="inverse rounded-3xl p-8">
            <h2 id="s-next" className="text-3xl">What happens next</h2>
            <p className="mt-3 max-w-prose text-lg text-muted">
              This is an instant first pass. A person should read it, ask you questions, and only then propose anything. It is an indicative read, not investment, legal or tax advice.
            </p>
            <button type="button" onClick={onRestart} className="mt-6 min-h-14 rounded-full bg-text px-8 text-lg font-medium text-bg">
              Run another firm
            </button>
          </section>
        </article>

        <aside className="rail lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-7 rounded-3xl border border-text p-6">
            <div>
              <p className="text-sm text-muted">Illustrative value</p>
              <p className="text-3xl font-semibold leading-tight tracking-tighter xl:text-4xl">
                $<span className="range-num">{report.range.low}</span>M to ${report.range.high}M
              </p>
              <p className="mt-2 text-sm text-muted">
                {report.multiple.low}x to {report.multiple.high}x of ${m.revenue25}M revenue. A model of your answers, not a market comparable.
              </p>
            </div>
            <Meter label="Revenue durability" value={m.durability} good={m.durability >= 50} note={`${m.recurringPct}% recurring, largest client ${m.topClientPct}%`} />
            <Meter label="Key-man safety" value={100 - m.keyManRisk} good={m.keyManRisk <= 50} note={`${m.top1Name} brings ${m.top1Share}% of revenue${m.partnerKnown ? "" : " (estimated)"}`} />
            <Meter label="Back-office readiness" value={report.readinessScore} good={report.readinessScore >= 50} note="Checkable work that can wait for a careful answer" />

            <div className="border-t border-line pt-5">
              <p className="text-lg font-semibold">
                {checked} of {memo.claims.length} claims checked
                {flagged > 0 && <span className="text-muted">, {flagged} flagged</span>}
              </p>
              <p className="mt-1 text-sm text-muted">
                Each figure was recalculated from your answers. Anything that fails is flagged, not hidden.
              </p>
            </div>

            <div className="border-t border-line pt-5 text-sm">
              <p className="text-muted">
                Written by {meta.provider === "rules" ? "our rules engine" : `${meta.model} via ${meta.provider}`} in {(meta.ms / 1000).toFixed(1)}s.
              </p>
              {meta.ownKey && <p className="mt-2 font-medium">Generated with your own key.</p>}
              {usedFree && (
                <p className="mt-2">
                  Generated with free API keys. Bring your own key for better results.{" "}
                  <button type="button" className="font-semibold underline underline-offset-2" onClick={() => setShowKey(true)}>
                    Use my key
                  </button>
                </p>
              )}
              {showKey && (
                <form
                  className="mt-4 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (key.trim()) onRerun({ provider, key: key.trim() });
                  }}
                >
                  <label className="block text-sm font-medium" htmlFor="prov">Provider</label>
                  <select id="prov" value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)} className="h-12 w-full rounded-2xl border border-line bg-bg px-3">
                    <option value="groq">Groq</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                  <label className="block text-sm font-medium" htmlFor="byo">API key</label>
                  <input id="byo" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} className="h-12 w-full rounded-2xl border border-line bg-bg px-3" />
                  <p className="text-xs text-muted">Sent with this one request and never stored.</p>
                  <button disabled={busy || !key.trim()} className="min-h-12 w-full rounded-full bg-text px-4 font-medium text-bg disabled:opacity-60">
                    {busy ? "Re-running" : "Re-run with my key"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ClaimList({ claims }: { claims: Claim[] }) {
  if (!claims.length) return null;
  return (
    <ul className="space-y-4">
      {claims.map((c, i) => (
        <li key={c.id} className="flex items-start gap-3">
          <Badge c={c} i={i} />
          <div>
            <p className="text-lg">{c.text}</p>
            {!c.verified && c.reason && <p className="mt-0.5 text-sm text-muted">Why flagged: {c.reason}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
