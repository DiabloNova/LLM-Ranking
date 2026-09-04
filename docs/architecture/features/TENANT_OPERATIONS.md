# Tenant Operations Guide

This document describes the administrative operations supporting multi-tenant lifecycle states, limits, and quotas.

## Lifecycle States

- **Active**: The tenant runs normal crawl jobs, executes prompts, and accesses standard features.
- **Suspended**: The tenant cannot process new crawl jobs or access features, but their database schemas and configurations are kept intact.
- **Archived**: The tenant is soft-deleted, removing active schedules and preparing records for long-term cold-storage retention.

## Managing Tenant Limits and Quotas

Administrative users can modify quotas via the `UpdateTenantQuotaCommand` to manage resource budgets:

- `maxUsers`: Number of allowed team seats.
- `maxBrands`: Number of customer brands monitored.
- `maxPrompts`: Number of generative search queries tracked.
- `maxObservationsPerMonth`: Ingestion crawler limit.
- `maxCrawlJobsPerDay`: Maximum spider crawl queue rate.
- `monthlyTokenLimit`: Cost tracking LLM token ceiling.
- `monthlyCostLimitUsd`: Dollar spending maximum threshold.

## Localisation (Strategic Phase 1)

SaaS admins can toggle the localized flags inside `TenantConfiguration` (`isIranMarketLocalised`) to enable special crawling rates and Toman/Rial translation optimizations designed specifically for Iran-market LLM challenges under Phase 1 of our product roadmap.
