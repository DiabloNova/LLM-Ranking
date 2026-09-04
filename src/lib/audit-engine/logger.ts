/**
 * Structured Logger for Core Intelligence Audit Engine
 */
export class AuditLogger {
  private auditId: string;

  constructor(auditId: string) {
    this.auditId = auditId;
  }

  private log(level: "INFO" | "WARN" | "ERROR", message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const cleanMeta = meta ? { ...meta } : undefined;

    // Redact potential sensitive info
    if (cleanMeta) {
      const keysToRedact = ["apiKey", "secret", "password", "token", "auth", "key", "authorization"];
      for (const key of Object.keys(cleanMeta)) {
        if (keysToRedact.some(red => key.toLowerCase().includes(red))) {
          cleanMeta[key] = "[REDACTED]";
        }
      }
    }

    const output = {
      timestamp,
      level,
      auditId: this.auditId,
      message,
      ...(cleanMeta ? { meta: cleanMeta } : {})
    };

    console.log(`[CoreIntelligenceAuditEngine][${level}] ${JSON.stringify(output)}`);
  }

  public info(message: string, meta?: Record<string, any>) {
    this.log("INFO", message, meta);
  }

  public warn(message: string, meta?: Record<string, any>) {
    this.log("WARN", message, meta);
  }

  public error(message: string, error?: unknown, meta?: Record<string, any>) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.log("ERROR", message, {
      ...meta,
      error: errorMsg,
      ...(errorStack ? { stack: errorStack.substring(0, 500) } : {})
    });
  }
}
