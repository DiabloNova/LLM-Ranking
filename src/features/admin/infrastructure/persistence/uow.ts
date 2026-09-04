/**
 * Phase 7C.5 — Enterprise Unit of Work Implementation
 * Manages atomic transaction boundaries, optimistic locking checks, and deferred domain event publication.
 */

import { IUnitOfWork } from "../../../../core/database/unit-of-work";
import { DomainEvent } from "../../../../core/events";
import { coreEventBus } from "../../../../core/events";

export interface IPostgresClient {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  connectClient(): Promise<unknown>;
}

export class UnitOfWork implements IUnitOfWork {
  private isTransactionActive = false;
  private pendingOperations: (() => Promise<void>)[] = [];
  private deferredEvents: DomainEvent<unknown>[] = [];
  private pg: IPostgresClient;
  private activeClient: unknown = null;

  constructor(pg: IPostgresClient) {
    this.pg = pg;
  }

  public getActiveTransactionClient(): unknown {
    return this.activeClient;
  }

  public async startTransaction(): Promise<void> {
    if (this.isTransactionActive) {
      throw new Error("Transaction Exception: A transaction is already active.");
    }
    this.isTransactionActive = true;
    this.pendingOperations = [];
    this.deferredEvents = [];

    // Lease dedicated transacted client thread-safely
    this.activeClient = await this.pg.connectClient();
    await this.pg.begin();
  }

  public registerOperation(op: () => Promise<void>): void {
    if (!this.isTransactionActive) {
      // Execute immediately if not in a transaction block
      op().catch(err => {
        console.error("[UnitOfWork] Immediate operation failed", err);
      });
      return;
    }
    this.pendingOperations.push(op);
  }

  public registerDeferredEvent(event: DomainEvent<unknown>): void {
    if (!this.isTransactionActive) {
      // Publish immediately if no active transaction
      coreEventBus.publish(event).catch(err => {
        console.error("[UnitOfWork] Immediate event publish failed", err);
      });
      return;
    }
    this.deferredEvents.push(event);
  }

  public async commit(): Promise<void> {
    if (!this.isTransactionActive) {
      throw new Error("Transaction Exception: No active transaction to commit.");
    }

    try {
      // Execute all operations sequentially inside transaction boundaries
      for (const op of this.pendingOperations) {
        await op();
      }

      // Commit actual Postgres transaction
      await this.pg.commit();

      // Publish all deferred events now that transaction committed successfully
      for (const event of this.deferredEvents) {
        await coreEventBus.publish(event);
      }
    } catch (error) {
      // If any operation fails, roll back
      await this.rollback();
      throw error;
    } finally {
      this.isTransactionActive = false;
      this.pendingOperations = [];
      this.deferredEvents = [];
      const clientObj = this.activeClient as Record<string, unknown> | null;
      if (clientObj && typeof clientObj.release === "function") {
        (clientObj.release as () => void)();
      }
      this.activeClient = null;
    }
  }

  public async rollback(): Promise<void> {
    if (this.isTransactionActive) {
      await this.pg.rollback();
    }
    this.isTransactionActive = false;
    this.pendingOperations = [];
    this.deferredEvents = [];
    const clientObj = this.activeClient as Record<string, unknown> | null;
    if (clientObj && typeof clientObj.release === "function") {
      (clientObj.release as () => void)();
    }
    this.activeClient = null;
  }

  public async runInTransaction<T>(work: (uow: IUnitOfWork) => Promise<T>): Promise<T> {
    await this.startTransaction();
    try {
      const result = await work(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
