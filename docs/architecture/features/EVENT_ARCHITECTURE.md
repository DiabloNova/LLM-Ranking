# Event-Driven Architecture (EDA) Blueprint

This specification details our distributed, asynchronous messaging design built on eventual consistency and correlation trace headers.

---

## 1. Tracing & Context Propagation

Every Domain Event published contains a mandatory, structured `metadata` block carrying trace properties:

- **eventId**: A unique identifier for auditability and deduplication.
- **organizationId**: Strict tenant partition key, ensuring events are routed to proper tenant streams.
- **actorId**: Tracks the user or cron job that initiated the transaction.
- **correlationId**: A shared transaction trace ID maintained across all asynchronous workflows (e.g. from Prompt Execution down to Recommendation Generation).
- **causationId**: Tracks the immediate parent event ID that caused this event, establishing clear transaction causality.

---

## 2. Event Dispatching Pipeline

We implement an abstract **`EventDispatcher`** supporting:
- Multi-handler routing.
- Eventual consistency.
- Decoupled, asynchronous dispatching.

This is prepared to link with message queues (e.g. RabbitMQ, Kafka, BullMQ) by writing a concrete adapter that implements the `IEventBus` contract:

```typescript
export class KafkaEventBus implements IEventBus {
  public async publish(event: DomainEvent): Promise<void> {
    await this.kafkaProducer.send({
      topic: event.eventType,
      messages: [{ key: event.metadata.organizationId, value: JSON.stringify(event) }]
    });
  }
}
```
This enables zero-code changes in application handlers when scaling to multi-service setups!
