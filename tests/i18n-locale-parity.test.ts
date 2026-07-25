import assert from "node:assert/strict";
import test from "node:test";
import { dictionaries } from "../lib/i18n/dictionaries.ts";

// Keep in sync with i18n/routing.ts (that module can't be imported here because
// it pulls in next-intl + the "@/" path alias, neither of which resolves under
// the plain-node test runner).
const EXPECTED_LOCALES = ["tr", "en", "fr", "es"] as const;

// Subtrees whose *keys are data*, not fixed message keys, so they legitimately
// vary per locale (e.g. localized dollar-range option labels used as map keys).
// Structural parity is checked up to — but not into — these nodes.
const DATA_KEYED_PREFIXES = ["capitalApp.profile.options"];

function isDataKeyed(prefix: string): boolean {
  return DATA_KEYED_PREFIXES.some(
    (p) => prefix === p || prefix.startsWith(`${p}.`),
  );
}

/** Recursively collect the dot-joined key paths of a nested message object. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (isDataKeyed(prefix)) return [prefix];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

test("every routed locale has a message dictionary", () => {
  for (const locale of EXPECTED_LOCALES) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(dictionaries, locale),
      `dictionaries is missing the "${locale}" locale`,
    );
  }
  assert.deepEqual(
    Object.keys(dictionaries).sort(),
    [...EXPECTED_LOCALES].sort(),
    "dictionaries locales must match the routed locale set exactly",
  );
});

test("all locale dictionaries share the exact same key structure", () => {
  const reference = keyPaths(dictionaries.tr).sort();
  for (const locale of EXPECTED_LOCALES) {
    const paths = keyPaths(
      dictionaries[locale as keyof typeof dictionaries],
    ).sort();
    const missing = reference.filter((p) => !paths.includes(p));
    const extra = paths.filter((p) => !reference.includes(p));
    assert.deepEqual(
      missing,
      [],
      `"${locale}" is missing keys present in tr: ${missing.slice(0, 5).join(", ")}`,
    );
    assert.deepEqual(
      extra,
      [],
      `"${locale}" has keys not present in tr: ${extra.slice(0, 5).join(", ")}`,
    );
  }
});
