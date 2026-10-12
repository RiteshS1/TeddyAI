"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { FirmInput, FirmType, SaleInterest } from "@/lib/types";
import { BLANK, SAMPLES } from "@/lib/samples";
import { Mark } from "./Mark";

const TYPES: FirmType[] = [
  "Litigation",
  "Corporate and transactional",
  "Compliance and regulatory",
  "Family and private client",
  "Intellectual property",
  "General practice",
];
const SALE: SaleInterest[] = ["Actively looking", "Open to the right partner", "Just exploring"];

type StepId = "name" | "type" | "revenue" | "people" | "attrition" | "client" | "recurring" | "age" | "sale" | "partners";
const STEPS: { id: StepId; title: string; hint: string }[] = [
  { id: "name", title: "What is the firm called?", hint: "Just for the note. Use any name you like." },
  { id: "type", title: "What kind of work does it do?", hint: "Pick the closest fit." },
  { id: "revenue", title: "What has revenue looked like?", hint: "Total revenue for each year, in $ millions." },
  { id: "people", title: "How many people work there?", hint: "Lawyers, and everyone else, as of today." },
  { id: "attrition", title: "How many people left in the last 12 months?", hint: "As a share of the whole team." },
  { id: "client", title: "How much of revenue is your largest client?", hint: "A best guess is fine." },
  { id: "recurring", title: "How much revenue comes back without a new engagement?", hint: "Retainers, ongoing compliance work, standing instructions." },
  { id: "age", title: "How long has the firm been in business?", hint: "In years." },
  { id: "sale", title: "How do you feel about a support partnership?", hint: "There is no wrong answer, and nothing is committed." },
  { id: "partners", title: "Who brings the work in?", hint: "Optional. Add your top originators and we can show what happens if one leaves." },
];

const ease = [0.22, 1, 0.36, 1] as const;

function BigNumber({
  label, value, onChange, suffix, step = 0.1, max = 1000, min = 0, id,
}: { label: string; value: number; onChange: (n: number) => void; suffix?: string; step?: number; max?: number; min?: number; id: string }) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <span className="flex items-baseline gap-2 border-b-2 border-line transition-colors focus-within:border-text">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className="w-full min-w-0 bg-transparent py-1 text-5xl font-semibold tracking-tight outline-none sm:text-6xl"
        />
        {suffix && <span className="text-xl text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

function BigSlider({ id, label, value, onChange, max = 100 }: { id: string; label: string; value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <p aria-hidden="true" className="text-8xl font-semibold tracking-tighter sm:text-9xl">
        {value}
        <span className="text-4xl text-muted sm:text-5xl">%</span>
      </p>
      <input id={id} type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-4" aria-valuetext={`${value} percent`} />
      <div className="flex justify-between text-sm text-muted" aria-hidden="true">
        <span>0%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

function Options<T extends string>({ label, options, value, onPick }: { label: string; options: T[]; value: T | null; onPick: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-3 sm:grid-cols-2">
      {options.map((o, i) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            data-opt
            onClick={() => onPick(o)}
            className={`group flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 text-left text-lg transition-colors ${
              on ? "border-text bg-ink text-on-ink" : "border-line hover:border-text"
            }`}
          >
            <kbd
              className={`grid size-8 shrink-0 place-items-center rounded-lg border text-sm font-medium ${
                on ? "border-on-ink/40" : "border-line group-hover:border-text"
              }`}
              aria-hidden="true"
            >
              {String.fromCharCode(65 + i)}
            </kbd>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function FormFlow({
  initial, startAtEnd, onClose, onSubmit, error,
}: { initial?: FirmInput; startAtEnd?: boolean; onClose: () => void; onSubmit: (f: FirmInput) => void; error?: string }) {
  const [i, setI] = useState(startAtEnd ? STEPS.length - 1 : 0);
  const [dir, setDir] = useState(1);
  const [firm, setFirm] = useState<FirmInput>(initial ?? { ...BLANK, name: "" });
  const [typePicked, setTypePicked] = useState<FirmType | null>(initial ? initial.firmType : null);
  const [salePicked, setSalePicked] = useState<SaleInterest | null>(initial ? initial.saleInterest : null);
  const [err, setErr] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const step = STEPS[i];

  const set = (patch: Partial<FirmInput>) => setFirm((f) => ({ ...f, ...patch }));

  const problem = useMemo(() => {
    switch (step.id) {
      case "name":
        return firm.name.trim() ? "" : "Give the firm a name to continue.";
      case "type":
        return typePicked ? "" : "Pick one to continue.";
      case "revenue": {
        const r = firm.revenue;
        return [r.y2023, r.y2024, r.y2025].every((n) => Number.isFinite(n) && n > 0) ? "" : "Enter revenue above zero for each year.";
      }
      case "people":
        return firm.lawyers >= 1 && Number.isFinite(firm.staff) ? "" : "A firm needs at least one lawyer.";
      case "age":
        return Number.isFinite(firm.yearsInBusiness) && firm.yearsInBusiness >= 0 ? "" : "Enter a number of years.";
      case "sale":
        return salePicked ? "" : "Pick one to continue.";
      case "partners": {
        const sum = firm.partners.reduce((s, p) => s + (p.origination || 0), 0);
        return sum > firm.revenue.y2025 * 1.05 ? "Those originations add up to more than 2025 revenue. Check the figures." : "";
      }
      default:
        return "";
    }
  }, [step.id, firm, typePicked, salePicked]);

  const last = i === STEPS.length - 1;

  const next = useCallback(() => {
    if (problem) return setErr(problem);
    setErr("");
    if (last) {
      onSubmit({ ...firm, partners: firm.partners.filter((p) => p.origination > 0) });
      return;
    }
    setDir(1);
    setI((n) => n + 1);
  }, [problem, last, firm, onSubmit]);

  const back = () => {
    setErr("");
    if (i === 0) return onClose();
    setDir(-1);
    setI((n) => n - 1);
  };

  // Keyboard: Enter continues, Escape closes, letters pick options.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" && (t as HTMLInputElement).type !== "range";
      if (e.key === "Enter" && !(t.tagName === "BUTTON" && t.getAttribute("role") !== "radio")) {
        e.preventDefault();
        return next();
      }
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && /^[a-z]$/i.test(e.key)) {
        const idx = e.key.toUpperCase().charCodeAt(0) - 65;
        if (step.id === "type" && TYPES[idx]) pickType(TYPES[idx]);
        if (step.id === "sale" && SALE[idx]) pickSale(SALE[idx]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next, step.id, onClose]);

  const advanceSoon = () => {
    setErr("");
    window.setTimeout(() => {
      setDir(1);
      setI((n) => Math.min(STEPS.length - 1, n + 1));
    }, 260);
  };
  const pickType = (t: FirmType) => { setTypePicked(t); set({ firmType: t }); advanceSoon(); };
  const pickSale = (s: SaleInterest) => { setSalePicked(s); set({ saleInterest: s }); advanceSoon(); };

  // Focus the first control when the question changes, and lock page scroll behind the overlay.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const root = stage.current;
      const el = root?.querySelector<HTMLElement>('input:not([type="hidden"]), [role="radio"][aria-checked="true"], [data-opt]');
      el?.focus({ preventScroll: true });
    }, 320);
    return () => window.clearTimeout(t);
  }, [i]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const loadSample = (n: number) => {
    const s = SAMPLES[n].input;
    setFirm(s);
    setTypePicked(s.firmType);
    setSalePicked(s.saleInterest);
    setErr("");
    setDir(1);
    setI(STEPS.length - 1);
  };

  const setPartner = (idx: number, patch: Partial<{ name: string; origination: number }>) =>
    set({ partners: firm.partners.map((p, n) => (n === idx ? { ...p, ...patch } : p)) });

  const facts = [
    i > 0 && firm.name ? firm.name : null,
    i > 1 && typePicked ? typePicked : null,
    i > 2 ? `$${firm.revenue.y2025}M in 2025` : null,
    i > 3 ? `${firm.lawyers} lawyers, ${firm.staff} staff` : null,
    i > 4 ? `${firm.attritionPct}% left` : null,
    i > 5 ? `Top client ${firm.topClientPct}%` : null,
    i > 6 ? `${firm.recurringPct}% recurring` : null,
    i > 7 ? `${firm.yearsInBusiness} years` : null,
    i > 8 && salePicked ? salePicked : null,
  ].filter(Boolean) as string[];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="q-title" className="fixed inset-0 z-50 flex flex-col bg-bg text-text">
      <div className="h-1 w-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={i + 1} aria-label="Progress">
        <motion.div className="h-full bg-text" initial={false} animate={{ width: `${((i + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease }} />
      </div>

      <div className="flex items-center justify-between px-5 py-4 sm:px-10">
        <span className="flex items-center gap-2 font-semibold"><Mark size={24} /> Back Office Valuation</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">{i + 1} of {STEPS.length}</span>
          <button type="button" onClick={onClose} aria-label="Close and leave the form" className="grid size-11 place-items-center rounded-full border border-line hover:border-text">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>

      <div ref={stage} className="relative mx-auto flex w-full max-w-3xl flex-1 items-center overflow-y-auto px-5 py-6 sm:px-10">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step.id}
            custom={dir}
            className="w-full"
            initial={{ opacity: 0, y: dir * 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dir * -32, transition: { duration: 0.16 } }}
            transition={{ duration: 0.45, ease }}
          >
            <h2 id="q-title" className="max-w-[18ch] text-4xl sm:max-w-none sm:text-6xl">{step.title}</h2>
            <p className="mt-3 max-w-prose text-lg text-muted">{step.hint}</p>

            <div className="mt-10">
              {step.id === "name" && (
                <label htmlFor="firm-name" className="block">
                  <span className="sr-only">Firm name</span>
                  <input
                    id="firm-name"
                    value={firm.name}
                    onChange={(e) => set({ name: e.target.value })}
                    maxLength={60}
                    autoComplete="organization"
                    placeholder="Harlow & Pike"
                    className="w-full border-b-2 border-line bg-transparent py-1 text-5xl font-semibold tracking-tight outline-none transition-colors placeholder:text-line focus:border-text sm:text-6xl"
                  />
                </label>
              )}
              {step.id === "type" && <Options label="Kind of work" options={TYPES} value={typePicked} onPick={pickType} />}
              {step.id === "revenue" && (
                <div className="grid gap-8 sm:grid-cols-3">
                  <BigNumber id="r23" label="2023" suffix="$M" value={firm.revenue.y2023} onChange={(n) => set({ revenue: { ...firm.revenue, y2023: n } })} />
                  <BigNumber id="r24" label="2024" suffix="$M" value={firm.revenue.y2024} onChange={(n) => set({ revenue: { ...firm.revenue, y2024: n } })} />
                  <BigNumber id="r25" label="2025" suffix="$M" value={firm.revenue.y2025} onChange={(n) => set({ revenue: { ...firm.revenue, y2025: n } })} />
                </div>
              )}
              {step.id === "people" && (
                <div className="grid gap-8 sm:grid-cols-2">
                  <BigNumber id="lawyers" label="Lawyers" step={1} min={1} value={firm.lawyers} onChange={(n) => set({ lawyers: n })} />
                  <BigNumber id="staff" label="Everyone else" step={1} value={firm.staff} onChange={(n) => set({ staff: n })} />
                </div>
              )}
              {step.id === "attrition" && <BigSlider id="attr" label="Share of the team who left" max={60} value={firm.attritionPct} onChange={(n) => set({ attritionPct: n })} />}
              {step.id === "client" && <BigSlider id="client" label="Largest client as a share of revenue" value={firm.topClientPct} onChange={(n) => set({ topClientPct: n })} />}
              {step.id === "recurring" && <BigSlider id="rec" label="Recurring share of revenue" value={firm.recurringPct} onChange={(n) => set({ recurringPct: n })} />}
              {step.id === "age" && <BigNumber id="age" label="Years in business" step={1} max={200} value={firm.yearsInBusiness} onChange={(n) => set({ yearsInBusiness: n })} />}
              {step.id === "sale" && <Options label="Interest in a support partnership" options={SALE} value={salePicked} onPick={pickSale} />}
              {step.id === "partners" && (
                <div className="space-y-3">
                  {firm.partners.map((p, n) => (
                    <div key={n} className="grid grid-cols-[1fr_7.5rem_auto] items-center gap-3">
                      <label className="block">
                        <span className="sr-only">Partner {n + 1} name</span>
                        <input value={p.name} onChange={(e) => setPartner(n, { name: e.target.value })} placeholder="Partner name" maxLength={40} className="h-14 w-full rounded-2xl border border-line bg-transparent px-4 text-lg outline-none focus:border-text" />
                      </label>
                      <label className="block">
                        <span className="sr-only">Partner {n + 1} originations in millions</span>
                        <span className="flex h-14 items-center gap-1 rounded-2xl border border-line px-4 focus-within:border-text">
                          <input type="number" inputMode="decimal" min={0} step={0.1} value={Number.isFinite(p.origination) ? p.origination : ""} onChange={(e) => setPartner(n, { origination: e.target.value === "" ? NaN : Number(e.target.value) })} className="w-full bg-transparent text-lg outline-none" />
                          <span className="text-muted">$M</span>
                        </span>
                      </label>
                      <button type="button" onClick={() => set({ partners: firm.partners.filter((_, k) => k !== n) })} aria-label={`Remove partner ${n + 1}`} className="grid size-14 place-items-center rounded-2xl border border-line hover:border-text">
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  ))}
                  {firm.partners.length < 6 && (
                    <button type="button" onClick={() => set({ partners: [...firm.partners, { name: "", origination: 1 }] })} className="min-h-14 w-full rounded-2xl border border-dashed border-muted px-4 text-lg font-medium hover:border-text sm:w-auto">
                      Add a partner
                    </button>
                  )}
                  {firm.partners.length === 0 && <p className="text-muted">Skip this and we estimate key-man exposure from headcount, and say so in the note.</p>}
                </div>
              )}
            </div>

            <div role="alert" className="mt-6 min-h-6 text-base font-medium">{err || error}</div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button type="button" onClick={next} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-ink px-8 text-lg font-medium text-on-ink transition-transform active:scale-[0.97]">
                {last ? "Get my valuation note" : "OK"}
                {!last && (
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </button>
              <span className="hidden text-sm text-muted sm:inline">or press <kbd className="rounded-md border border-line px-1.5 py-0.5 font-medium">Enter</kbd></span>
            </div>

            {i === 0 && (
              <div className="mt-12 border-t border-line pt-6">
                <p className="text-sm text-muted">Just want to see it work? Start from a made-up firm.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SAMPLES.map((s, n) => (
                    <button key={s.id} type="button" onClick={() => loadSample(n)} className="min-h-11 rounded-full border border-line px-4 text-sm hover:border-text">
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 border-t border-line px-5 py-3 sm:px-10">
        <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium hover:border-text">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 2L3.5 7l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {i === 0 ? "Close" : "Back"}
        </button>
        <ul aria-label="Your answers so far" className="flex min-w-0 flex-1 gap-2 overflow-x-auto whitespace-nowrap text-sm text-muted">
          {facts.map((f) => (
            <li key={f} className="rounded-full bg-subtle px-3 py-1">{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
