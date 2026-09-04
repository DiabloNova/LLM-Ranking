/**
 * Phase 7C.5 — Enterprise Core Event Infrastructure
 * Standardizes domain event schemas, publishers, and subscribers.
 */

export interface EventMetadata {
  eventId: string;
  organizationId: string;
  actorId: string;
  timestamp: string;
  correlationId: string;
  causationId: string;
  version: number;
}

export interface DomainEvent<TPayload = unknown> {
  metadata: EventMetadata;
  eventType: string;
  aggregateId: string;
  payload: TPayload;
}

export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
  supports(eventType: string): boolean;
}

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

export class EventBus implements IEventPublisher {
  private handlers: Map<string, Set<IEventHandler>> = new Map();

  /**
   * Publishes an event to all matched subscribers concurrently
   */
  public async publish(event: DomainEvent): Promise<void> {
    const handlersSet = this.handlers.get(event.eventType);
    if (!handlersSet || handlersSet.size === 0) return;

    const promises = Array.from(handlersSet).map(handler =>
      handler.handle(event).catch(err => {
        console.error(`[EventBus] Handler failure on ${event.eventType}`, err);
      })
    );

    await Promise.all(promises);
  }

  public async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Subscribe an event handler to a designated routing key/event type
   */
  public subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  /**
   * Unsubscribe a handler from a designated routing key/event type
   */
  public unsubscribe(eventType: string, handler: IEventHandler): void {
    const handlersSet = this.handlers.get(eventType);
    if (handlersSet) {
      handlersSet.delete(handler);
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}

// Global Single Instance for application-wide event integration
export const coreEventBus = new EventBus();
