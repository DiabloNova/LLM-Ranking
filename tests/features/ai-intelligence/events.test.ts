import { eventBus, DomainEvent, IEventHandler } from "../../../src/features/ai-intelligence";

export function testEvents() {
  console.log("▶ Running Event-Driven Architecture Tests...");

  eventBus.clear();

  let receivedEvent: DomainEvent | null = null;
  let receivedCount = 0;

  const mockHandler: IEventHandler = {
    async handle(event: DomainEvent): Promise<void> {
      receivedEvent = event;
      receivedCount++;
    },
    supports(eventType: string): boolean {
      return eventType === "aibi.test.event";
    }
  };

  // 1. Subscribe Listener
  eventBus.subscribe("aibi.test.event", mockHandler);

  // 2. Publish Mock Event with tracing headers
  const traceId = "trace-e2e-999";
  const event: DomainEvent = {
    metadata: {
      eventId: "evt-test-111",
      organizationId: "org-test-99",
      actorId: "actor-test",
      timestamp: new Date().toISOString(),
      correlationId: traceId,
      causationId: traceId,
      version: 1
    },
    eventType: "aibi.test.event",
    aggregateId: "agg-test-01",
    payload: { message: "Hello EDA Event Bus!" }
  };

  eventBus.publish(event).then(() => {
    console.log(`  * EDA Events received: ${receivedCount}`);
    if (receivedCount !== 1) {
      throw new Error(`Expected exactly 1 received event count, got: ${receivedCount}`);
    }
    if (!receivedEvent || receivedEvent.metadata.correlationId !== traceId) {
      throw new Error("Event metadata trace correlationId lost during pipeline transit");
    }
    console.log("✅ Event-Driven Architecture Tests Passed Successfully!");
  }).catch((err) => {
    console.error("❌ Event Dispatcher Test Failed", err);
    process.exit(1);
  });
}
