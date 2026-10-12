# Back Office Valuation

Concept art visualising Teddy AI's idea of an instant, evidence-checked back-office read for law firms. An independent concept, not affiliated with or endorsed by Teddy. We hold no rights to Teddy's name, brand or work.

A law firm owner answers ten short questions (practice area, revenue 2023 to 2025, lawyers and staff,
attrition, client concentration, years in business, interest in a partnership) and gets a first-pass note in about a
minute. It speaks to the three risks that matter for a firm back office: key-man risk, project-based revenue, and
how much of the back office is work a model can do reliably.

## How it stays honest

1. **Numbers are computed in code** (`lib/metrics.ts`): originator share, lose-a-partner simulation, concentration,
   durability, readiness, and an illustrative revenue-multiple band. The model never does arithmetic.
2. **The model only writes claims** and must cite the metric and exact value behind each one.
3. **A verifier recomputes every cite** (`verifyClaims` in `lib/harness.ts`). A claim with no cite, an unknown
   metric, or a wrong value is flagged in the UI, not hidden. This is code, not a second model call, so a run
   costs one model request.
4. If no model is reachable the app falls back to a rules-based note, and says so.

Free-tier models can still word things badly, and the site says so. Steps 1 and 3 mean the figures do not depend on the model being right, and visitors can bring their own key for better results.

## Run it

```bash
cp .env.example .env.local   # add GROQ_API_KEY and/or GEMINI_API_KEY
npm install
npm run dev                  # http://localhost:3000
npm run eval                 # offline checks, no keys needed
```

Deploy to Vercel and set the same env vars in the project settings. Keys are read only in
`app/api/underwrite/route.ts` and never reach the browser. Visitors can also paste their own Groq, Gemini or
Anthropic key; it is sent with that one request and not stored.

The demo is rate limited to 12 runs per IP per hour (in memory, so best effort on serverless).

## What is in here

| Path | Job |
| --- | --- |
| `lib/metrics.ts` | Deterministic numbers, the source of truth |
| `lib/harness.ts` | Prompt, JSON repair, verifier, rules-based fallback |
| `lib/providers.ts` | Groq, Gemini, Anthropic adapters and fallback order |
| `app/api/underwrite/route.ts` | Validation, rate limit, env keys |
| `components/PartnerBar.tsx` | The GSAP moment: pick a partner, watch their book leave |
| `eval/run.ts` | Ground-truth metrics and planted-bad-claim checks |

## Limits

- Sample firms are invented. The valuation band is a model of the inputs, not a market comparable.
- Output is indicative, and is not investment, legal or tax advice.
- Model ids default to `openai/gpt-oss-120b` (Groq) and `gemini-3.1-flash-lite` (Gemini); override with
  `GROQ_MODEL` / `GEMINI_MODEL` if a provider retires one.
