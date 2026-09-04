import { CrawlError } from "./errors";
import type { CrawlJobStatus } from "./contracts";
export const JOB_TRANSITIONS: Readonly<
  Record<CrawlJobStatus, readonly CrawlJobStatus[]>
> = {
  PENDING: ["QUEUED", "CANCELLED", "FAILED"],
  QUEUED: ["RUNNING", "CANCELLED", "FAILED"],
  RUNNING: ["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED", "QUEUED"],
  SUCCEEDED: [],
  PARTIAL: [],
  FAILED: [],
  CANCELLED: []
};

export function canTransition(
  from: CrawlJobStatus,
  to: CrawlJobStatus
): boolean {
  return JOB_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: CrawlJobStatus, to: CrawlJobStatus): void {
  if (
    !canTransition(from, to) ||
    (from === "FAILED" && to !== "QUEUED")
  ) {
    throw new CrawlError(
      "POLICY_VIOLATION",
      `Invalid job transition ${from} -> ${to}`,
      { from, to }
    );
  }
}

export function retryFailedJob(from: CrawlJobStatus): "QUEUED" {
  if (from !== "FAILED") {
    throw new CrawlError(
      "POLICY_VIOLATION",
      "Only failed jobs may be retried",
      { from }
    );
  }
  return "QUEUED";
}
