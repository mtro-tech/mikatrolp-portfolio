import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Dates are quoted strings in YAML: "2027-02-15", or "2025-08" when only the month is known.
const date = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/);

// Schemas are strict: a missing required field or an unknown key fails the build.
const chapters = defineCollection({
  loader: glob({ pattern: "{en,de}/*.yaml", base: "./src/content/chapters" }),
  schema: z.strictObject({
    order: z.number().int().min(1).max(8),
    stage: z.string().min(1),
    heading: z.string().min(1),
    body: z.array(z.string().min(1)).min(1),
    organisation: z
      .strictObject({
        name: z.string().min(1),
        // A logo is shown only when written permission is recorded here (CLAUDE.md §2.3).
        logo: z
          .strictObject({
            permission: z.strictObject({
              by: z.string().min(1),
              date,
              note: z.string().min(1),
            }),
          })
          .optional(),
      })
      .optional(),
    // Where this stop sits on the map; shown as the label next to the pin.
    place: z.string().min(1).optional(),
    coordinates: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    period: z.strictObject({ start: date, end: date.optional() }).optional(),
    // Only Mika changes this (CLAUDE.md §2.4).
    status: z.enum(["upcoming", "current", "past"]).optional(),
    items: z
      .array(
        z.strictObject({
          label: z.string().min(1),
          values: z.array(z.string().min(1)).min(1),
        }),
      )
      .optional(),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/site" }),
  schema: z.strictObject({
    name: z.string().min(1),
    languageName: z.string().min(1),
    languageSwitchLabel: z.string().min(1),
    skipLink: z.string().min(1),
    // The motion toggle reads "<label>: <on>" or "<label>: <off>".
    motion: z.strictObject({
      label: z.string().min(1),
      on: z.string().min(1),
      off: z.string().min(1),
    }),
    statusLabels: z.strictObject({
      upcoming: z.string().min(1),
      current: z.string().min(1),
    }),
    hiddenDetail: z.string().min(1),
    links: z.strictObject({
      linkedin: z.url(),
      github: z.url(),
    }),
  }),
});

export const collections = { chapters, site };
