import type { FirmInput } from "./types";

/** Synthetic firms for demo only. Not real businesses. */
export const SAMPLES: { id: string; label: string; blurb: string; input: FirmInput }[] = [
  {
    id: "boutique",
    label: "Harlow & Pike (boutique)",
    blurb: "Strong growth, one rainmaker.",
    input: {
      name: "Harlow & Pike",
      firmType: "Corporate and transactional",
      revenue: { y2023: 7.4, y2024: 9.1, y2025: 11.2 },
      lawyers: 11,
      staff: 9,
      attritionPct: 14,
      topClientPct: 22,
      recurringPct: 18,
      yearsInBusiness: 9,
      saleInterest: "Open to the right partner",
      partners: [
        { name: "R. Harlow", origination: 6.1 },
        { name: "S. Pike", origination: 2.2 },
        { name: "A. Mendez", origination: 1.4 },
      ],
    },
  },
  {
    id: "compliance",
    label: "Ostrander Regulatory (compliance)",
    blurb: "Steady retainers, spread-out book.",
    input: {
      name: "Ostrander Regulatory",
      firmType: "Compliance and regulatory",
      revenue: { y2023: 18.2, y2024: 19.4, y2025: 20.6 },
      lawyers: 24,
      staff: 31,
      attritionPct: 8,
      topClientPct: 7,
      recurringPct: 71,
      yearsInBusiness: 22,
      saleInterest: "Actively looking",
      partners: [
        { name: "D. Ostrander", origination: 3.1 },
        { name: "K. Fairweather", origination: 2.8 },
        { name: "L. Okafor", origination: 2.6 },
        { name: "M. Reyes", origination: 2.2 },
        { name: "T. Brandt", origination: 1.9 },
      ],
    },
  },
  {
    id: "litigation",
    label: "Calloway Trial Group (litigation)",
    blurb: "Lumpy, project-based, shrinking.",
    input: {
      name: "Calloway Trial Group",
      firmType: "Litigation",
      revenue: { y2023: 14.8, y2024: 11.9, y2025: 12.4 },
      lawyers: 16,
      staff: 12,
      attritionPct: 27,
      topClientPct: 38,
      recurringPct: 6,
      yearsInBusiness: 15,
      saleInterest: "Just exploring",
      partners: [
        { name: "J. Calloway", origination: 5.0 },
        { name: "P. Voss", origination: 3.4 },
        { name: "N. Iyer", origination: 1.1 },
      ],
    },
  },
];

export const BLANK: FirmInput = {
  name: "Your firm",
  firmType: "General practice",
  revenue: { y2023: 5, y2024: 5.5, y2025: 6 },
  lawyers: 8,
  staff: 6,
  attritionPct: 10,
  topClientPct: 15,
  recurringPct: 30,
  yearsInBusiness: 10,
  saleInterest: "Just exploring",
  partners: [],
};
