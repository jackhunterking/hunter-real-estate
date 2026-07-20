import test from "node:test";
import assert from "node:assert/strict";
import { FLAGSHIP_LEARNING_RESOURCE, learningSummary } from "../lib/capital/learning.ts";
import { estimateReadingMinutes, LearningDraftSchema } from "../lib/capital/learning-schema.ts";

test("flagship summary removes article-only fields", () => {
  const summary = learningSummary(FLAGSHIP_LEARNING_RESOURCE);
  assert.equal(summary.slug, FLAGSHIP_LEARNING_RESOURCE.slug);
  assert.equal("bodyMarkdown" in summary, false);
  assert.equal("sources" in summary, false);
});

test("controlled learning draft requires both languages and an HTTPS source", () => {
  const valid = LearningDraftSchema.safeParse({
    slug: "sample-guide",
    resourceType: "guide",
    categoryKey: "investment-fundamentals",
    audience: "investor_and_professional",
    title: { en: "Sample", tr: "Örnek" },
    summary: { en: "Summary", tr: "Özet" },
    bodyMarkdown: { en: "## Body", tr: "## İçerik" },
    disclaimer: { en: "Educational only", tr: "Yalnızca eğitim" },
    sources: [{ title: "Source", url: "https://example.com", publisher: "Publisher", accessedAt: "2026-07-18", sortOrder: 0 }],
  });
  assert.equal(valid.success, true);
  const invalid = LearningDraftSchema.safeParse({ ...valid.data, title: { en: "", tr: "Örnek" } });
  assert.equal(invalid.success, false);
});

test("reading time is always at least one minute", () => {
  assert.equal(estimateReadingMinutes("Short guide", "en"), 1);
  assert.ok(estimateReadingMinutes("word ".repeat(500), "en") >= 3);
});
