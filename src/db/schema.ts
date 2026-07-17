import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  real,
  uuid,
} from "drizzle-orm/pg-core";

export const encryptionHistory = pgTable("encryption_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().default("anonymous"),
  fileName: text("file_name").notNull(),
  originalSize: integer("original_size").notNull(),
  encryptedSize: integer("encrypted_size").notNull(),
  encryptionTimeMs: real("encryption_time_ms").notNull(),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  settings: text("settings").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const encryptionStats = pgTable("encryption_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  totalFiles: integer("total_files").notNull().default(0),
  totalEncrypted: integer("total_encrypted").notNull().default(0),
  totalFailed: integer("total_failed").notNull().default(0),
  avgProcessTimeMs: real("avg_process_time_ms").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
