import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { ApiKeyRepository } from "../repositories/api-key-repository";
import { CreateApiKeyDto, ApiKeyCreatedResponse, ApiKey } from "../domain/types";
import { TenantContextManager } from "../../../core/database/tenant-context";

export class ApiService {
  private repository: ApiKeyRepository;

  constructor() {
    this.repository = new ApiKeyRepository();
  }

  private generateSecureKey(): { prefix: string; secret: string; hash: string } {
    const rawBytes = randomBytes(32).toString("hex");
    const prefix = rawBytes.substring(0, 8); // e.g., to look up in DB
    const secret = `seo_${rawBytes}`;
    const hash = createHash("sha256").update(secret).digest("hex");

    return { prefix, secret, hash };
  }

  public async createApiKey(dto: CreateApiKeyDto): Promise<ApiKeyCreatedResponse> {
    const { prefix, secret, hash } = this.generateSecureKey();

    const apiKey = await TenantContextManager.runWithTenantContext(
      dto.organizationId,
      dto.createdBy || "system",
      "api-key-creation",
      async () => {
        return await this.repository.create({
          organizationId: dto.organizationId,
          name: dto.name,
          prefix,
          hash,
          isActive: true,
          expiresAt: dto.expiresAt || null,
          lastUsedAt: null,
          createdBy: dto.createdBy || "system",
          revokedAt: null
        });
      }
    );

    return {
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      name: apiKey.name,
      prefix: apiKey.prefix,
      secret,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt
    };
  }

  public async authenticateKey(providedSecret: string): Promise<ApiKey | null> {
    if (!providedSecret.startsWith("seo_") || providedSecret.length < 12) {
      return null;
    }

    const prefix = providedSecret.substring(4, 12);

    // We execute in system context to look up the key across tenants (auth phase)
    const apiKey = await TenantContextManager.runWithSystemContext(
      "system",
      "api-key-auth",
      async () => {
        return await this.repository.findByPrefix(prefix);
      }
    );

    if (!apiKey) return null;
    if (!apiKey.isActive || apiKey.revokedAt) return null;
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;

    const providedHash = createHash("sha256").update(providedSecret).digest("hex");
    const providedHashBuf = Buffer.from(providedHash, "hex");
    const storedHashBuf = Buffer.from(apiKey.hash, "hex");
    // SHA-256 digests are always 32 bytes when both sides are well-formed hex, so this
    // only short-circuits on a corrupt stored hash -- never based on the caller's input.
    if (providedHashBuf.length !== storedHashBuf.length || !timingSafeEqual(providedHashBuf, storedHashBuf)) {
      return null;
    }

    // Update last used at, using the tenant context since the key is valid
    await TenantContextManager.runWithTenantContext(
      apiKey.organizationId,
      apiKey.id,
      "api-key-auth",
      async () => {
        await this.repository.updateLastUsed(apiKey.id);
      }
    );

    return apiKey;
  }
}
