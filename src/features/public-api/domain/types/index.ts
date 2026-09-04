export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  prefix: string;
  hash: string;
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  revokedAt: Date | null;
}

export interface CreateApiKeyDto {
  organizationId: string;
  name: string;
  expiresAt?: Date | null;
  createdBy?: string;
}

export interface ApiKeyCreatedResponse {
  id: string;
  organizationId: string;
  name: string;
  prefix: string;
  secret: string; // The plaintext secret - only returned once
  expiresAt: Date | null;
  createdAt: Date;
}
