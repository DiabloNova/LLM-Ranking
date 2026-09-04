import assert from "node:assert/strict";
import { CrawlError } from "../../../src/features/acquisition/domain/errors";
import {
  assertTransition,
  canTransition,
  retryFailedJob
} from "../../../src/features/acquisition/domain/job-state-machine";

export function testStateMachine(): void {
  const statuses = [
    "PENDING", "QUEUED", "RUNNING", "SUCCEEDED",
    "PARTIAL", "FAILED", "CANCELLED"
  ] as const;
  for (const status of statuses) {
    for (const target of statuses) {
      if (!canTransition(status, target)) {
        assert.throws(
          () => assertTransition(status, target),
          (error: unknown) =>
            error instanceof CrawlError && error.code === "POLICY_VIOLATION"
        );
      }
    }
  }
  assert.equal(retryFailedJob("FAILED"), "QUEUED");
  assert.throws(() => retryFailedJob("CANCELLED"));
  assertTransition("RUNNING", "QUEUED");
}
