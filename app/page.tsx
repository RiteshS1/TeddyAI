"use client";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { FirmInput, Report } from "@/lib/types";
import type { ProviderId } from "@/lib/providers";
import { SAMPLES } from "@/lib/samples";
import { Landing } from "@/components/Landing";
import { FormFlow } from "@/components/FormFlow";
import { Memo } from "@/components/Memo";
import { Mark } from "@/components/Mark";

type Phase = "landing" | "working" | "memo";
const STAGES = ["Calculating your numbers", "Reading them with a model", "Checking every claim against your answers"];

export default function Page() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [formOpen, setFormOpen] = useState(false);
  const [seed, setSeed] = useState<FirmInput | undefined>();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(0);
  const lastInput = useRef<FirmInput | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(async (input: FirmInput, byo?: { provider: ProviderId; key: string }) => {
    lastInput.current = input;
    setError("");
    setFormOpen(false);
    setPhase("working");
    setStage(0);
    window.scrollTo({ top: 0 });
    timer.current = setInterval(() => setStage((s) => Math.min(STAGES.length - 1, s + 1)), 2600);
    try {
      const res = await fetch("/api/underwrite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, byo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That did not work. Try again.");
      setReport(data as Report);
      setPhase("memo");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
      if (report) {
        setPhase("memo");
      } else {
        setPhase("landing");
        setFormOpen(true);
      }
    } finally {
      if (timer.current) clearInterval(timer.current);
    }
  }, [report]);

  const openForm = (sample?: number) => {
    setSeed(sample === undefined ? undefined : SAMPLES[sample].input);
    setFormOpen(true);
  };

  return (
    <main id="main">
      {phase === "landing" && <Landing onStart={() => openForm()} onSample={() => openForm(0)} />}

      <AnimatePresence>
        {formOpen && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <FormFlow
              key={seed ? "seeded" : "blank"}
              initial={seed}
              startAtEnd={Boolean(seed)}
              error={error}
              onClose={() => setFormOpen(false)}
              onSubmit={(f) => run(f)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "working" && (
        <div className="dark-block grid min-h-dvh place-items-center px-6" role="status" aria-live="polite">
          <div className="w-full max-w-lg">
            <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }} className="mb-10 w-fit">
              <Mark size={64} />
            </motion.div>
            <ol className="space-y-4">
              {STAGES.map((s, i) => (
                <li key={s} className={`flex items-center gap-4 text-2xl font-medium tracking-tight transition-opacity duration-500 ${i <= stage ? "opacity-100" : "opacity-30"}`}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full border-2 border-text text-sm ${i < stage ? "bg-text text-bg" : ""}`} aria-hidden="true">
                    {i < stage ? "✓" : ""}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {phase === "memo" && report && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error && <p role="alert" className="mx-auto mt-6 max-w-6xl px-5 font-medium sm:px-8">{error}</p>}
          <Memo
            report={report}
            busy={false}
            onRestart={() => { setPhase("landing"); setReport(null); setError(""); setSeed(undefined); window.scrollTo({ top: 0 }); }}
            onRerun={(byo) => lastInput.current && run(lastInput.current, byo)}
          />
        </motion.div>
      )}
    </main>
  );
}
