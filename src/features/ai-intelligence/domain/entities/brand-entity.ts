import { Brand, AuditMetadata } from "../types";
import { brandSchema } from "../schemas";

export class BrandEntity {
  private constructor(public readonly props: Brand) {}

  /**
   * Factory method to create a valid BrandEntity from raw data
   */
  public static create(data: unknown): BrandEntity {
    const result = brandSchema.safeParse(data);
    if (!result.success) {
      const messages = result.errors.map(e => `${e.field}: ${e.message}`).join(", ");
      throw new Error(`Domain Validation Failed for Brand: ${messages}`);
    }
    return new BrandEntity(result.data);
  }

  /**
   * Get brand ID
   */
  public get id(): string {
    return this.props.id;
  }

  /**
   * Get brand name
   */
  public get name(): string {
    return this.props.name;
  }

  /**
   * Get brand website
   */
  public get website(): string {
    return this.props.website;
  }

  /**
   * Get brand organization ID (multi-tenant boundary key)
   */
  public get organizationId(): string {
    return this.props.organizationId;
  }

  /**
   * Get target country or default to Global
   */
  public get country(): string {
    return this.props.country || "Global";
  }

  /**
   * Get audit metadata
   */
  public get audit(): AuditMetadata {
    return this.props.audit;
  }

  /**
   * Helper to inspect properties
   */
  public toJSON(): Brand {
    return { ...this.props };
  }
}
