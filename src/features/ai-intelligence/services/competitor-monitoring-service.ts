import { randomUUID } from "crypto";
import { Competitor, CompetitorStatusType, CompetitorChange } from "../domain/types";
import { ICompetitorRepository } from "../repositories/interfaces";

const VALID_TRANSITIONS: Record<CompetitorStatusType, Set<CompetitorStatusType>> = {
  candidate: new Set(["active", "rejected"]),
  active: new Set(["inactive", "active"]), // active to active is allowed as no-op
  inactive: new Set(["active", "inactive"]), // inactive to active
  rejected: new Set(["rejected"]) // rejected is terminal or can transition back if manually forced, but let's stick to standard flow
};

/**
 * Validates transition between lifecycle states.
 */
export function isValidTransition(from: CompetitorStatusType, to: CompetitorStatusType): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.has(to) || false;
}

/**
 * CompetitorMonitoringService
 * Responsible for state transitions, enabling/disabling monitoring,
 * and performing change detection against competitor observations.
 */
export class CompetitorMonitoringService {
  constructor(private readonly competitorRepo: ICompetitorRepository) {}

  /**
   * Transition competitor status safely.
   */
  public async transitionStatus(
    organizationId: string,
    competitorId: string,
    newStatus: CompetitorStatusType,
    updatedBy = "system"
  ): Promise<Competitor> {
    const competitor = await this.competitorRepo.findById(organizationId, competitorId);
    if (!competitor) {
      throw new Error(`Competitor not found: ${competitorId}`);
    }

    if (!isValidTransition(competitor.status, newStatus)) {
      throw new Error(`Invalid status transition from ${competitor.status} to ${newStatus}`);
    }

    const previousStatus = competitor.status;
    competitor.status = newStatus;
    competitor.audit.updatedAt = new Date().toISOString();
    competitor.audit.updatedBy = updatedBy;

    // Save competitor
    const updated = await this.competitorRepo.save(competitor);

    // Record change log if state actually changed
    if (previousStatus !== newStatus) {
      const changeId = randomUUID();
      const change: CompetitorChange = {
        id: changeId,
        organizationId,
        competitorId,
        changedField: "status",
        previousValue: previousStatus,
        newValue: newStatus,
        changeType: "status",
        observedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await this.competitorRepo.saveChange(change);
    }

    return updated;
  }

  /**
   * Perform monitoring observation run.
   * Compares the current observed fields with previous values,
   * logs any changes, and updates monitoring timestamps.
   */
  public async observeState(
    organizationId: string,
    competitorId: string,
    observedFields: Partial<Pick<Competitor, "name" | "brandName" | "classification" | "status">>,
    notes?: Record<string, unknown>,
    updatedBy = "system"
  ): Promise<{ competitor: Competitor; changes: CompetitorChange[] }> {
    const competitor = await this.competitorRepo.findById(organizationId, competitorId);
    if (!competitor) {
      throw new Error(`Competitor not found: ${competitorId}`);
    }

    const changes: CompetitorChange[] = [];
    const fieldsToMonitor = ["name", "brandName", "classification", "status"] as const;

    for (const field of fieldsToMonitor) {
      const observedVal = observedFields[field];
      if (observedVal !== undefined && observedVal !== null) {
        const currentVal = competitor[field];
        if (currentVal !== observedVal) {
          // If status changes, validate transition first
          if (field === "status" && !isValidTransition(competitor.status, observedVal as CompetitorStatusType)) {
            throw new Error(`Invalid status transition from ${competitor.status} to ${observedVal} during observation.`);
          }

          const changeId = randomUUID();
          const change: CompetitorChange = {
            id: changeId,
            organizationId,
            competitorId,
            changedField: field,
            previousValue: currentVal ? String(currentVal) : null,
            newValue: String(observedVal),
            changeType: field,
            observedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          changes.push(change);
          // Apply changes to current competitor instance
          (competitor as any)[field] = observedVal;
        }
      }
    }

    // Persist logged changes
    for (const change of changes) {
      await this.competitorRepo.saveChange(change);
    }

    // Update monitored metadata
    competitor.lastObservedAt = new Date().toISOString();
    competitor.lastMonitoredAt = new Date().toISOString();
    competitor.monitoringStatus = "idle";
    if (notes) {
      competitor.notesMetadata = {
        ...(competitor.notesMetadata || {}),
        ...notes
      };
    }
    competitor.audit.updatedAt = new Date().toISOString();
    competitor.audit.updatedBy = updatedBy;

    const updatedCompetitor = await this.competitorRepo.save(competitor);

    return {
      competitor: updatedCompetitor,
      changes
    };
  }

  /**
   * Enable or disable competitor monitoring state.
   */
  public async setMonitoringState(
    organizationId: string,
    competitorId: string,
    status: "idle" | "enabled" | "disabled" | "failed",
    updatedBy = "system"
  ): Promise<Competitor> {
    const competitor = await this.competitorRepo.findById(organizationId, competitorId);
    if (!competitor) {
      throw new Error(`Competitor not found: ${competitorId}`);
    }

    competitor.monitoringStatus = status;
    competitor.audit.updatedAt = new Date().toISOString();
    competitor.audit.updatedBy = updatedBy;

    return await this.competitorRepo.save(competitor);
  }
}
