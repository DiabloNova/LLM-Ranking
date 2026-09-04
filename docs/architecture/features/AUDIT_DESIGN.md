# Immutable Administrative Audit Trail

This document details the system design of the immutable audit logging module within the administrative context.

## Audit Record Schema

Each record captured by the audit tracker contains:

- `id`: Globally unique UUID trace identifier.
- `timestamp`: ISO-8601 server timestamp.
- `actorId` & `actorEmail`: Unambiguous identity of the acting administrator.
- `actorRole`: Role context of the administrator.
- `action`: Specific state change string (e.g., `TENANT_SUSPEND`, `FEATURE_FLAG_ENABLE`).
- `resourceType` & `resourceId`: Path targeting the affected database entity.
- `ipAddress` & `userAgent`: Network tracking data.
- `payloadBefore`: Stringified JSON representation of the entity state prior to mutation.
- `payloadAfter`: Stringified JSON representation of the entity state after mutation.
- `status`: Outcome code (`success`, `denied`, `error`).
- `errorDetails`: Stack trace messages if the mutation encountered problems.

## Immutability Guarantee

The audit record structure is designed for append-only storage. Handlers append logs on every single Command invocation. No API route allows modifying or deleting audit rows, ensuring strict compliance with Sox and SOC-2 guidelines.
