import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Export auth models
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === PROFILES ===
// Linked to auth users
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["doctor", "patient"] }).default("patient").notNull(),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  diagnosisDate: integer("diagnosis_date", { mode: "timestamp" }),
  doctorId: text("doctor_id").references(() => users.id),
});

// === GLUCOSE LOGS ===
export const glucoseLogs = sqliteTable("glucose_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  value: real("value").notNull(), // stored as real in sqlite
  unit: text("unit").default("mg/dL").notNull(),
  type: text("type", { enum: ["fasting", "post_prandial", "hba1c", "random"] }).notNull(),
  measuredAt: integer("measured_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  source: text("source", { enum: ["manual", "ocr"] }).default("manual").notNull(),
  imageUrl: text("image_url"), // for OCR proof
  notes: text("notes"),
  isConfirmed: integer("is_confirmed", { mode: "boolean" }).default(true).notNull(),
});

// === RISK ASSESSMENTS ===
export const riskAssessments = sqliteTable("risk_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  riskLevel: text("risk_level", { enum: ["Stable", "Moderate", "High", "Critical"] }).notNull(),
  factors: text("factors", { mode: "json" }), // Store details about why (variability, compliance)
  generatedAt: integer("generated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// === RELATIONS ===
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const glucoseLogsRelations = relations(glucoseLogs, ({ one }) => ({
  user: one(users, {
    fields: [glucoseLogs.userId],
    references: [users.id],
  }),
}));

export const riskAssessmentsRelations = relations(riskAssessments, ({ one }) => ({
  user: one(users, {
    fields: [riskAssessments.userId],
    references: [users.id],
  }),
}));

// === SCHEMAS ===
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertGlucoseLogSchema = createInsertSchema(glucoseLogs).omit({ id: true });
export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({ id: true, generatedAt: true });

// === TYPES ===
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type GlucoseLog = typeof glucoseLogs.$inferSelect;
export type InsertGlucoseLog = z.infer<typeof insertGlucoseLogSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;

// API Types
export type OcrResponse = {
  extractedValues: {
    value: number;
    type: "fasting" | "post_prandial" | "hba1c" | "random";
    confidence: number;
  }[];
  rawText?: string;
};
