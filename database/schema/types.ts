export interface ColumnDefinition {
  name: string;
  type: "UUID" | "TEXT" | "INTEGER" | "DOUBLE PRECISION" | "TIMESTAMP" | "TEXT[]" | "BOOLEAN" | "JSONB" | "VECTOR";
  nullable: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string;
  references?: {
    table: string;
    column: string;
    onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  };
  description?: string;
}

export interface TableDefinition {
  tableName: string;
  columns: ColumnDefinition[];
  indexes?: string[];
  sql: string;
}
