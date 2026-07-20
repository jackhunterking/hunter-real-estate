import assert from "node:assert/strict";
import test from "node:test";
import { investorTerminology } from "../lib/i18n/investor-terminology.ts";

test("investor terminology replaces English and Turkish client-facing copy", () => {
  const copy = investorTerminology({
    en: "Clients can add a client profile.",
    tr: "Müşteriler müşteri profilini ekleyebilir.",
    nested: ["Müşterinin belgeleri", "Customer records"],
  });

  assert.deepEqual(copy, {
    en: "Investors can add an investor profile.",
    tr: "Yatırımcılar yatırımcı profilini ekleyebilir.",
    nested: ["Yatırımcının belgeleri", "Investor records"],
  });
});
