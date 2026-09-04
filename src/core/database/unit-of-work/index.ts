/**
 * Phase 7C.5 — Enterprise Persistence Unit of Work Contracts
 * Manages transaction boundaries and ensures domain events are only dispatched after successful commits.
 */

import { DomainEvent } from "../../events";

export interface IUnitOfWork {
  /**
   * Starts a transaction boundary
   */
  startTransaction(): Promise<void>;

  /**
   * Commits all pending operations and publishes deferred domain events
   */
  commit(): Promise<void>;

  /**
   * Rolls back all operations and clears deferred events
   */
  rollback(): Promise<void>;

  /**
   * Registers a domain event to be dispatched only after successful transaction commit
   */
  registerDeferredEvent(event: DomainEvent<unknown>): void;

  /**
   * Helper utility to run a complete block of database work inside a transaction
   */
  runInTransaction<T>(work: (uow: IUnitOfWork) => Promise<T>): Promise<T>;
}
