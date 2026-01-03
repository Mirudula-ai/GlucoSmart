import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export auth models
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === PROFILES ===
// Linked to auth users
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["doctor", "patient"] }).default("patient").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  diagnosisDate: timestamp("diagnosis_date"),
});

// === GLUCOSE LOGS ===
export const glucoseLogs = pgTable("glucose_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  value: numeric("value").notNull(), // stored as string in numeric
  unit: text("unit").default("mg/dL").notNull(),
  type: text("type", { enum: ["fasting", "post_prandial", "hba1c", "random"] }).notNull(),
  measuredAt: timestamp("measured_at").defaultNow().notNull(),
  source: text("source", { enum: ["manual", "ocr"] }).default("manual").notNull(),
  imageUrl: text("image_url"), // for OCR proof
  notes: text("notes"),
  isConfirmed: boolean("is_confirmed").default(true).notNull(), // OCR entries might be unconfirmed initially
});

// === RISK ASSESSMENTS ===
export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  riskLevel: text("risk_level", { enum: ["Stable", "Moderate", "High", "Critical"] }).notNull(),
  factors: jsonb("factors"), // Store details about why (variability, compliance)
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
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
