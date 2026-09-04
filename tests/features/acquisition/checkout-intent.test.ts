import assert from "node:assert/strict";
import { normalizePlan } from "../../../src/lib/checkout-intent";

// Edge case 1: forged/unknown plans must never reach checkout.
assert.equal(normalizePlan("pro"), "professional");
assert.equal(normalizePlan("enterprise"), "enterprise");
assert.equal(normalizePlan("admin"), null);

// Edge case 2: URL input is case/whitespace tolerant, but bounded to the catalog.
assert.equal(normalizePlan(" Professional "), "professional");
assert.equal(normalizePlan(""), null);

// Edge case 3 is covered by readCheckoutIntent: expired or malformed session state is discarded.
console.log("checkout intent validation: ok");
