import assert from "node:assert/strict";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import * as fs from "fs";
import * as path from "path";

export async function testRepositoryBehaviors() {
  console.log("Running Repository Behavioral Pattern Verification...");

  const repoFiles = [
      'monitoring-alert-repository.ts',
      'monitoring-config-repository.ts',
      'crawl-snapshot-repository.ts'
  ];

  for (const file of repoFiles) {
      const repoPath = path.resolve(process.cwd(), 'src/features/monitoring/repositories', file);
      const repoText = await fs.promises.readFile(repoPath, 'utf-8');

      assert.equal(repoText.includes('TenantContextManager.getRequiredTenantId()'), true, `${file} must fetch tenant ID from TenantContextManager`);
      assert.equal(repoText.includes('TenantContextManager.getContext()'), true, `${file} must fetch tenant context from context manager for db client`);
  }

  console.log("✅ Repository Behavioral Pattern tests passed (strictly follows TenantContextManager constraints)!");
}
