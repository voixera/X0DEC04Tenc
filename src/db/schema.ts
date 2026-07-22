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

export const authUsers = pgTable("auth_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authOtps = pgTable("auth_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  purpose: text("purpose").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
