import { z } from "zod";

const Localized = z.object({
  en: z.string().trim().min(1),
  tr: z.string().trim().min(1),
});

const Source = z.object({
  title: z.string().trim().min(1),
  url: z.string().url().refine((value) => value.startsWith("https://"), "HTTPS is required."),
  publisher: z.string().trim().min(1),
  publishedOn: z.string().date().optional().or(z.literal("")),
  accessedAt: z.string().date(),
  notes: z.string().trim().max(2000).optional(),
  sortOrder: z.number().int().nonnegative(),
});

export const LearningDraftSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  resourceType: z.literal("guide").default("guide"),
  categoryKey: z.literal("investment-fundamentals"),
  audience: z.literal("investor_and_professional").default("investor_and_professional"),
  title: Localized,
  summary: Localized,
  bodyMarkdown: Localized,
  disclaimer: Localized,
  sources: z.array(Source).min(1),
});

export const LearningTransitionSchema = z.object({
  action: z.enum(["submit", "request_changes", "approve", "publish", "withdraw", "new_version"]),
  note: z.string().trim().max(4000).optional(),
}).superRefine((value, context) => {
  if (value.action === "request_changes" && !value.note) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["note"], message: "Review notes are required." });
  }
});

export function estimateReadingMinutes(markdown: string, language: "en" | "tr") {
  const words = markdown.replace(/[#>*|`_\-[\]()]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / (language === "tr" ? 180 : 200)));
}

export function learningRpcInput(input: z.infer<typeof LearningDraftSchema>) {
  return {
    ...input,
    readingMinutes: {
      en: estimateReadingMinutes(input.bodyMarkdown.en, "en"),
      tr: estimateReadingMinutes(input.bodyMarkdown.tr, "tr"),
    },
  };
}
