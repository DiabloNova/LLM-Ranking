/**
 * Phase 7C.5 — Enterprise Crawler Operations Console
 * Oversees crawler job queues, failed crawl analysis, robots.txt policy checks, and domain limits.
 */

export interface CrawlJob {
  jobId: string;
  tenantId: string;
  targetUrl: string;
  status: "queued" | "crawling" | "completed" | "failed";
  retryCount: number;
  robotsCompliant: boolean;
  pagesScraped: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RobotsPolicyStatus {
  domain: string;
  allowsCrawl: boolean;
  crawlDelaySeconds: number;
  sitemapFound: boolean;
  lastCheckedAt: string;
}

export class CrawlerOperationsConsole {
  private jobs: Map<string, CrawlJob> = new Map();
  private policies: Map<string, RobotsPolicyStatus> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const job1: CrawlJob = {
      jobId: "job-crawl-acme-home",
      tenantId: "tenant-acme-uuid",
      targetUrl: "https://acme-saas.com/blog/generative-ai",
      status: "completed",
      retryCount: 0,
      robotsCompliant: true,
      pagesScraped: 14,
      startedAt: "2026-01-25T10:00:00Z",
      completedAt: "2026-01-25T10:02:15Z"
    };

    const job2: CrawlJob = {
      jobId: "job-crawl-globex-fail",
      tenantId: "tenant-globex-uuid",
      targetUrl: "https://globex-corp.ir/products/aeo-pricing",
      status: "failed",
      retryCount: 3,
      robotsCompliant: true,
      pagesScraped: 0,
      errorMessage: "HTTP 504 Gateway Timeout: Backing server unresponsive",
      startedAt: "2026-01-25T11:30:00Z",
      completedAt: "2026-01-25T11:35:00Z"
    };

    this.jobs.set(job1.jobId, job1);
    this.jobs.set(job2.jobId, job2);

    const pol1: RobotsPolicyStatus = {
      domain: "acme-saas.com",
      allowsCrawl: true,
      crawlDelaySeconds: 1,
      sitemapFound: true,
      lastCheckedAt: "2026-01-25T00:00:00Z"
    };

    const pol2: RobotsPolicyStatus = {
      domain: "globex-corp.ir",
      allowsCrawl: true,
      crawlDelaySeconds: 2,
      sitemapFound: true,
      lastCheckedAt: "2026-01-25T00:00:00Z"
    };

    this.policies.set(pol1.domain, pol1);
    this.policies.set(pol2.domain, pol2);
  }

  public getJobs(tenantId?: string): CrawlJob[] {
    const allJobs = Array.from(this.jobs.values());
    if (tenantId) {
      return allJobs.filter(j => j.tenantId === tenantId);
    }
    return allJobs;
  }

  public getRobotsStatus(domain: string): RobotsPolicyStatus {
    const policy = this.policies.get(domain);
    if (policy) return policy;

    // Default mock response for new domains
    return {
      domain,
      allowsCrawl: !domain.includes("forbidden"),
      crawlDelaySeconds: 1,
      sitemapFound: false,
      lastCheckedAt: new Date().toISOString()
    };
  }

  public queueNewCrawl(tenantId: string, url: string): CrawlJob {
    // Check Robots.txt compliance before queueing
    const parsedUrl = new URL(url);
    const policy = this.getRobotsStatus(parsedUrl.hostname);

    if (!policy.allowsCrawl) {
      throw new Error(`Crawl Exception: Domain ${parsedUrl.hostname} explicitly forbids crawler presence via robots.txt.`);
    }

    const job: CrawlJob = {
      jobId: `job-crawl-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      targetUrl: url,
      status: "queued",
      retryCount: 0,
      robotsCompliant: true,
      pagesScraped: 0,
      startedAt: new Date().toISOString()
    };

    this.jobs.set(job.jobId, job);
    return job;
  }

  public forceRetryCrawl(jobId: string): CrawlJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Crawl job ${jobId} not found.`);

    job.status = "queued";
    job.retryCount = 0;
    delete job.errorMessage;
    job.startedAt = new Date().toISOString();

    return job;
  }
}
