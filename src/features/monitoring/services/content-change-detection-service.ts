import { SnapshotChangeResult } from "../domain/types/snapshot-change-result";
import { RegressionResult } from "../domain/types/regression-result";

export class ContentChangeDetectionService {
  public detectContentChanges(changes: SnapshotChangeResult): RegressionResult[] {
    const regressions: RegressionResult[] = [];

    if (!changes.hasChanges) return regressions;

    for (const contentChange of changes.contentChanges) {
      if (contentChange.type === "contentHash") {
        regressions.push({
          type: "content",
          severity: "info",
          url: contentChange.url,
          metric: "contentHash",
          previousValue: contentChange.previousValue,
          currentValue: contentChange.currentValue,
          message: `Content hash changed from ${contentChange.previousValue} to ${contentChange.currentValue}`
        });
      }
      if (contentChange.type === "wordCount") {
        const prev = typeof contentChange.previousValue === 'number' ? contentChange.previousValue : 0;
        const curr = typeof contentChange.currentValue === 'number' ? contentChange.currentValue : 0;

        // Example significant change (could be customized)
        if (Math.abs(prev - curr) > 50) {
           regressions.push({
            type: "content",
            severity: "info",
            url: contentChange.url,
            metric: "wordCount",
            previousValue: contentChange.previousValue,
            currentValue: contentChange.currentValue,
            message: `Word count changed significantly from ${prev} to ${curr}`
          });
        }
      }
    }

    // Capture title/h1 changes as content changes too, based on instructions (if they changed)
    for (const seoChange of changes.seoChanges) {
       if (seoChange.type === "title" || seoChange.type === "h1") {
           regressions.push({
            type: "content",
            severity: "info",
            url: seoChange.url,
            metric: seoChange.type,
            previousValue: seoChange.previousValue,
            currentValue: seoChange.currentValue,
            message: `${seoChange.type} changed`
          });
       }
    }

    return regressions;
  }
}
