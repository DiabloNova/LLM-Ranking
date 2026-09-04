import { UserRole } from "@/types/auth";

export type JobStatus =
  | "queued"
  | "running"
  | "retrying"
  | "completed"
  | "failed"
  | "cancelled";

export type JobType =
  | "crawl"
  | "seo_audit"
  | "ai_analysis"
  | "document_ingestion"
  | "scheduled";

export interface JobError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  tenantId: string;
  userId: string;
  idempotencyKey?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  scheduledFor?: Date;
  error?: JobError;
  metadata?: Record<string, unknown>;
}

export interface JobSchedule {
  id: string;
  jobType: JobType;
  tenantId: string;
  scheduledFor: Date;
  recurrence?: string; // e.g., "daily", "weekly"
  enabled: boolean;
}
