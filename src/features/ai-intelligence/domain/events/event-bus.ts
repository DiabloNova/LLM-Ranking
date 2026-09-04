import { DomainEvent, IEventHandler } from "./index";

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: IEventHandler): void;
  unsubscribe(eventType: string, handler: IEventHandler): void;
}

export class EventDispatcher implements IEventBus {
  private handlers: Map<string, Set<IEventHandler>> = new Map();

  /**
   * Publish an event to all registered listeners asynchronously (eventual consistency)
   */
  public async publish(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;
    const listeners = this.handlers.get(eventType);

    if (!listeners || listeners.size === 0) return;

    // Run handlers concurrently mimicking an asynchronous queue
    const promises = Array.from(listeners).map(handler =>
      handler.handle(event).catch(err => {
        console.error(`[EventDispatcher Error] Failed running handler for event: ${eventType}`, err);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Subscribe an event handler to a designated event route type
   */
  public subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  /**
   * Unsubscribe a handler from a designated event route type
   */
  public unsubscribe(eventType: string, handler: IEventHandler): void {
    const listeners = this.handlers.get(eventType);
    if (listeners) {
      listeners.delete(handler);
    }
  }

  /**
   * Reset all handler registrations (useful for tests)
   */
  public clear(): void {
    this.handlers.clear();
  }
}

// Global Single Instance for app-wide event dispatching
export const eventBus = new EventDispatcher();
