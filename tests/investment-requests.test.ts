import test from "node:test";
import assert from "node:assert/strict";
import { legacyInterestStatus, requestOutcome, requestStage } from "../lib/capital/investment-requests.ts";

test("investment requests use exactly two user-facing stages", () => {
  assert.equal(requestStage("draft"), "in-review");
  assert.equal(requestStage("submitted"), "in-review");
  assert.equal(requestStage("compliance_review"), "in-review");
  assert.equal(requestStage("approved_for_subscription"), "in-review");
  assert.equal(requestStage("accepted"), "in-review");
  assert.equal(requestStage("funded"), "complete");
  assert.equal(requestStage("declined"), "complete");
  assert.equal(requestStage("withdrawn"), "complete");
  assert.equal(requestStage("closed"), "complete");
});

test("only funded or closed are shown as final outcomes", () => {
  assert.equal(requestOutcome("funded"), "funded");
  assert.equal(requestOutcome("declined"), "closed");
  assert.equal(requestOutcome("withdrawn"), "closed");
  assert.equal(requestOutcome("compliance_review"), null);
});

test("legacy interest records adapt non-destructively into the same journey", () => {
  assert.equal(legacyInterestStatus("new"), "submitted");
  assert.equal(legacyInterestStatus("contacted"), "compliance_review");
  assert.equal(legacyInterestStatus("qualified"), "compliance_review");
  assert.equal(legacyInterestStatus("closed"), "closed");
});
