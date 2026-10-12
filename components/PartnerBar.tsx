"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PORTABILITY } from "@/lib/metrics";
import type { FirmInput } from "@/lib/types";


/**
 * The one showpiece: pick a partner and watch their book leave.
 * Each segment is a real button; the loss overlay is animated with GSAP.
 */
export function PartnerBar({ firm }: { firm: FirmInput }) {
  const root = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const [sel, setSel] = useState<number | null>(null);
  const rev = firm.revenue.y2025;
  const partners = [...firm.partners].filter((p) => p.origination > 0).sort((a, b) => b.origination - a.origination);
  const known = partners.reduce((s, p) => s + p.origination, 0);
  const rest = Math.max(0, rev - known);
  const counter = useRef({ v: rev });

  // Kill in-flight tweens if the memo unmounts mid-animation.
  useEffect(() => {
    const el = root.current;
    const c = counter.current;
    return () => {
      gsap.killTweensOf(c);
      if (el) gsap.killTweensOf(el.querySelectorAll(".loss"));
    };
  }, []);

  const choose = (idx: number | null) => {
    setSel(idx);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0 : 0.9;
    const losses = root.current?.querySelectorAll<HTMLElement>(".loss") ?? [];
    losses.forEach((el, i) => {
      gsap.to(el, { width: i === idx ? `${PORTABILITY * 100}%` : "0%", duration: dur, ease: "power3.inOut", overwrite: true });
    });
    const target = idx === null ? rev : rev - partners[idx].origination * PORTABILITY;
    gsap.to(counter.current, {
      v: target,
      duration: dur,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = counter.current.v.toFixed(1);
      },
    });
  };

  if (partners.length === 0) return null;
  const lost = sel === null ? 0 : partners[sel].origination * PORTABILITY;

  return (
    <div ref={root} className="rounded-3xl border border-line p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-2xl">If one partner left</h3>
        <p className="text-sm text-muted">Pick a partner to see what happens if they leave.</p>
      </div>

      <div
        role="radiogroup"
        aria-label="Partners by share of 2025 revenue"
        className="mt-5 flex h-16 w-full overflow-hidden rounded-2xl border border-line"
      >
        {partners.map((p, idx) => {
          const pct = (p.origination / rev) * 100;
          const on = sel === idx;
          return (
            <button
              key={p.name + idx}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${p.name}, ${pct.toFixed(0)} percent of revenue`}
              onClick={() => choose(on ? null : idx)}
              style={{ width: `${pct}%`, background: `var(--seg-${Math.min(idx, 5) + 1})`, color: `var(--seg-${Math.min(idx, 5) + 1}-fg)` }}
              className={`relative h-full min-w-6 overflow-hidden text-left outline-offset-[-4px] transition-[filter] hover:brightness-110 ${on ? "outline outline-2 outline-bg" : ""}`}
            >
              <span
                className="absolute left-2 top-1.5 text-xs font-medium"
              >
                {pct >= 9 ? p.name : ""}
              </span>
              <span className="loss hatch absolute right-0 top-0 h-full w-0 border-l-2 border-bg bg-bg/70" aria-hidden="true" />
            </button>
          );
        })}
        {rest > 0 && (
          <div
            className="flex h-full items-center justify-center bg-subtle text-xs text-muted"
            style={{ width: `${(rest / rev) * 100}%` }}
            title="Everyone else"
          >
            {(rest / rev) * 100 > 12 ? "Everyone else" : ""}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Revenue after the loss ($M)</p>
          <p className="text-6xl font-semibold leading-none tracking-tighter">
            <span ref={numRef}>{rev.toFixed(1)}</span>
          </p>
        </div>
        <p aria-live="polite" className="max-w-sm text-sm text-muted">
          {sel === null
            ? `Assumes ${Math.round(PORTABILITY * 100)}% of an originator's book leaves with them.`
            : `${partners[sel].name} originates $${partners[sel].origination}M. We assume ${Math.round(PORTABILITY * 100)}% follows them, which takes $${lost.toFixed(1)}M (${((lost / rev) * 100).toFixed(0)}%) of revenue.`}
        </p>
      </div>
    </div>
  );
}
