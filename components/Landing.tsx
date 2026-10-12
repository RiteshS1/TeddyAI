"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "motion/react";
import { Mark } from "./Mark";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const SEGMENTS = [
  { name: "Partner A", w: 46 },
  { name: "Partner B", w: 20 },
  { name: "Partner C", w: 14 },
  { name: "Partner D", w: 10 },
  { name: "Others", w: 10 },
];

/** The hero demo: one partner leaves and a slice of the firm goes with them. Plays on a loop. */
function HeroBar() {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const c = { v: 100 };
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: 1.2 });
        tl.to(".hb-0", { outlineOffset: 4, duration: 0.01 })
          .to(".hb-loss", { width: "60%", duration: 1.1, ease: "power3.inOut" }, "+=0.4")
          .to(c, { v: 72.4, duration: 1.1, ease: "power3.inOut", onUpdate: () => { if (num.current) num.current.textContent = c.v.toFixed(0); } }, "<")
          .to({}, { duration: 1.6 })
          .to(".hb-loss", { width: "0%", duration: 0.6, ease: "power2.inOut" })
          .to(c, { v: 100, duration: 0.6, ease: "power2.inOut", onUpdate: () => { if (num.current) num.current.textContent = c.v.toFixed(0); } }, "<");
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".hb-loss", { width: "60%" });
        if (num.current) num.current.textContent = "72";
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mt-14">
      <div className="flex h-24 w-full overflow-hidden rounded-3xl border border-line sm:h-32" aria-hidden="true">
        {SEGMENTS.map((s, i) => (
          <div
            key={s.name}
            className={`hb-${i} relative flex h-full items-end p-3 text-xs sm:text-sm`}
            style={{ width: `${s.w}%`, background: `var(--seg-${i + 1})`, color: `var(--seg-${i + 1}-fg)` }}
          >
            <span className="truncate">{s.name}</span>
            {i === 0 && <span className="hb-loss hatch absolute right-0 top-0 h-full w-0 border-l-2 border-bg bg-bg/70" />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted" aria-live="off">
        Pretend Partner A leaves and 60% of their clients follow. Revenue left:{" "}
        <span className="font-semibold text-text"><span ref={num}>100</span>%</span>
      </p>
    </div>
  );
}

function Hero({ onStart, onSample }: { onStart: () => void; onSample: () => void }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from(".h-line", { yPercent: 110, duration: 1, stagger: 0.12 })
          .from(".h-fade", { y: 16, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.5");
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="dark-block">
      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <header className="flex items-center justify-between py-6">
          <span className="flex items-center gap-2 text-lg font-semibold">
            <Mark /> Back Office Valuation
          </span>
          <nav aria-label="Sections" className="hidden items-center gap-7 text-sm text-muted sm:flex">
            <a href="#problem" className="hover:text-text">The problem</a>
            <a href="#checks" className="hover:text-text">What we check</a>
            <a href="#how" className="hover:text-text">How it works</a>
            <a href="#faq" className="hover:text-text">Questions</a>
          </nav>
        </header>

        <div className="pt-12 sm:pt-20">
          <h1 className="text-[2.75rem] leading-[0.98] sm:text-7xl lg:text-[5.5rem]" aria-label="What is your law firm's back office worth?">
            <span className="block overflow-hidden pb-[0.16em] -mb-[0.1em]"><span className="h-line block">What is your</span></span>
            <span className="block overflow-hidden pb-[0.16em] -mb-[0.1em]"><span className="h-line block">law firm&apos;s back</span></span>
            <span className="block overflow-hidden pb-[0.16em] -mb-[0.1em]"><span className="h-line block">office worth?</span></span>
          </h1>
          <p className="h-fade mt-8 max-w-xl text-xl text-muted">
            Answer ten short questions. In about a minute you get a plain-English note on how much of the firm rests on a few people, how much revenue repeats, and what software could safely take off the partners&apos; plates.
          </p>
          <div className="h-fade mt-10 flex flex-wrap items-center gap-4">
            <button type="button" onClick={onStart} className="min-h-14 rounded-full bg-text px-8 text-lg font-medium text-bg transition-transform active:scale-[0.97]">
              Start the valuation
            </button>
            <button type="button" onClick={onSample} className="min-h-14 rounded-full border border-line px-6 text-lg hover:border-text">
              See it on a made-up firm
            </button>
          </div>
          <p className="h-fade mt-4 text-sm text-muted">No sign-up. This demo does not save your answers. It runs on free API keys, so it can make mistakes. Bring your own key for better results.</p>
        </div>

        <div className="h-fade">
          <HeroBar />
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section id="problem" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-12 lg:self-start">
          <h2 className="text-4xl sm:text-6xl">A law firm is worth what keeps showing up when the partners are on holiday.</h2>
        </div>
        <div className="space-y-12 text-lg">
          <div>
            <h3 className="text-2xl">The problem, in plain words</h3>
            <div className="mt-4 space-y-4 text-muted">
              <p>
                <span className="text-text">Clients hire a person, not a company.</span> Most law firms are small businesses built around a handful of senior lawyers. If one of them leaves, retires or falls ill, a big slice of the revenue can walk out with them. Finance people call this key-man risk.
              </p>
              <p>
                <span className="text-text">Most of the income is one-off.</span> A lawsuit, a deal, a filing. When it ends, the money stops and the firm has to win more. That makes the future hard to predict, and hard to sell or borrow against.
              </p>
              <p>
                <span className="text-text">The back office eats the partners&apos; time.</span> Billing, conflict checks, deadline tracking and compliance paperwork are repetitive and unglamorous, and they are where expensive mistakes happen.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-line p-6 sm:p-8">
            <h3 className="text-2xl">The idea this page visualises</h3>
            <p className="mt-3 text-muted">
              Teddy AI&apos;s idea is that a law firm should not have to carry its back office alone. Take on the compliance, operations and technology that partners should not be spending their days on, and let partners keep serving clients. This page is concept art: our attempt to make that idea something you can click through.
            </p>
          </div>

          <div>
            <h3 className="text-2xl">What this tool does about it</h3>
            <p className="mt-4 text-muted">
              Before any conversation about a partnership, an owner deserves a straight answer to three questions. How much of my revenue depends on one person? How much of it repeats? How much of my back office could software do reliably? Today that takes an analyst days. This does a first pass in a minute, and shows its working.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const CHECKS = [
  {
    title: "Who brings the work in",
    plain: "If your best rainmaker left tomorrow, how much of the revenue goes with them?",
    measure: "Each partner's share of revenue, and a simulation of the firm after one leaves, assuming 60% of their book follows.",
  },
  {
    title: "Will the revenue repeat?",
    plain: "How much of next year's income is already ongoing, and how much has to be won again from scratch?",
    measure: "Recurring against project-based revenue, the largest client's share, growth over two years, and how many people left.",
  },
  {
    title: "What can software safely do?",
    plain: "Some work can be checked against a rule or a record, like whether a deadline is right. That is where automation is safe. Judgement calls are not.",
    measure: "For each back-office function: how automatable it is, whether the result can be checked, and whether a slow, careful answer is acceptable.",
  },
];

function Checks() {
  return (
    <section id="checks" className="border-y border-line bg-subtle">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <h2 className="max-w-3xl text-4xl sm:text-6xl">Three questions, answered without jargon.</h2>
        <div className="mt-16 divide-y divide-line border-y border-line">
          {CHECKS.map((c) => (
            <div key={c.title} className="grid gap-6 py-10 lg:grid-cols-[1fr_1fr_1fr] lg:gap-12">
              <h3 className="text-3xl">{c.title}</h3>
              <div>
                <p className="text-sm font-medium text-muted">In plain words</p>
                <p className="mt-1 text-lg">{c.plain}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted">What we measure</p>
                <p className="mt-1 text-lg text-muted">{c.measure}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { t: "You answer", d: "Ten questions about your own firm. Nothing is scraped or guessed on your behalf." },
  { t: "A plain program does the maths", d: "Shares, growth, concentration and the leaves-the-firm simulation are calculated by code. The AI never does arithmetic." },
  { t: "A model writes the note", d: "It turns the figures into sentences, and must name the exact figure behind every claim." },
  { t: "Every claim is checked", d: "Each figure in the note is recalculated against your answers. Anything that does not match is flagged, not hidden." },
];

function How() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".how-line",
          { scaleY: 0 },
          { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: ".how-list", start: "top 70%", end: "bottom 60%", scrub: true } },
        );
        gsap.utils.toArray<HTMLElement>(".how-step").forEach((el) => {
          gsap.fromTo(el.querySelector(".how-dot"), { scale: 0.4, backgroundColor: "var(--bg)" }, {
            scale: 1, backgroundColor: "var(--text)", duration: 0.3,
            scrollTrigger: { trigger: el, start: "top 65%", toggleActions: "play none none reverse" },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="how" ref={root} className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <h2 className="text-4xl sm:text-6xl">Why you can trust the numbers.</h2>
          <div className="mt-10 rounded-3xl border border-line p-6">
            <p className="font-semibold">Why not just ask a chatbot?</p>
            <p className="mt-2 text-muted">
              A chatbot will happily give you a confident, wrong number. Here the numbers come from code, and the model is only the writer. Then every figure it quotes is recalculated before you see it.
            </p>
          </div>
        </div>
        <ol className="how-list relative space-y-12 pl-12">
          <span className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-0.5 bg-line" aria-hidden="true" />
          <span className="how-line absolute left-[15px] top-2 h-[calc(100%-1rem)] w-0.5 bg-text" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <li key={s.t} className="how-step relative">
              <span className="how-dot absolute -left-12 top-0 grid size-8 place-items-center rounded-full border-2 border-text text-sm font-semibold text-bg" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="text-2xl">{s.t}</h3>
              <p className="mt-2 text-lg text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Is this a real valuation?", a: "No. It is an indicative first read of your own answers, using an illustrative revenue multiple band. It is not a market comparable, and it is not investment, legal or tax advice. A person should review it before anything is proposed." },
  { q: "Where do my answers go?", a: "To our server, and from there to an AI provider (Groq, with Google Gemini as the fallback) so it can write the note. This demo does not save them." },
  { q: "Can the note be wrong?", a: "Yes. The demo runs on free-tier model keys, so the wording can be off or miss nuance, even though every figure is recalculated from your answers. Bring your own key on the results page for better results, and treat the note as a starting point either way." },
  { q: "What does Flagged mean?", a: "A claim was flagged because the figure it quotes does not match our calculation, or it quotes no figure at all. We show it rather than quietly dropping it. Note that the check covers the numbers, not the tone or phrasing." },
  { q: "Is this Teddy AI's product?", a: "No. It is concept art: an independent effort to visualise Teddy AI's idea. It is not affiliated with or endorsed by Teddy, and we hold no rights to Teddy's name, brand or product. The sample firms are made up." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <h2 className="text-4xl sm:text-6xl">Questions people ask.</h2>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const on = open === i;
            return (
              <div key={f.q}>
                <h3 className="text-xl font-semibold tracking-normal">
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(on ? null : i)}
                    className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left"
                  >
                    {f.q}
                    <motion.span animate={{ rotate: on ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="grid size-9 shrink-0 place-items-center rounded-full border border-line" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`faq-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-prose pb-6 text-lg text-muted">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Landing({ onStart, onSample }: { onStart: () => void; onSample: () => void }) {
  return (
    <>
      <Hero onStart={onStart} onSample={onSample} />
      <Problem />
      <Checks />
      <How />
      <Faq />
      <section className="dark-block">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-20 sm:px-8 sm:py-28">
          <h2 className="max-w-3xl text-4xl sm:text-6xl">Find out how much of the firm is the firm.</h2>
          <button type="button" onClick={onStart} className="min-h-14 rounded-full bg-text px-8 text-lg font-medium text-bg transition-transform active:scale-[0.97]">
            Start the valuation
          </button>
        </div>
      </section>
      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted sm:px-8">
        <p className="max-w-prose">
          Concept art visualising Teddy AI&apos;s idea. An independent concept, not affiliated with or endorsed by Teddy, and we hold no rights to Teddy&apos;s name, brand or work. Sample firms are made up. Output is indicative and is not investment, legal or tax advice.
        </p>
      </footer>
    </>
  );
}
