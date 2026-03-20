import { db } from "./db";
import {
  glucoseLogs, profiles, riskAssessments, users,
  type InsertGlucoseLog, type InsertProfile, type InsertRiskAssessment
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth"; // Reuse auth storage for user lookups if needed

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<typeof profiles.$inferSelect | undefined>;
  upsertProfile(userId: string, profile: Partial<InsertProfile>): Promise<typeof profiles.$inferSelect>;

  // Logs
  getGlucoseLogs(userId: string): Promise<typeof glucoseLogs.$inferSelect[]>;
  createGlucoseLog(log: InsertGlucoseLog): Promise<typeof glucoseLogs.$inferSelect>;
  confirmGlucoseLog(id: number): Promise<typeof glucoseLogs.$inferSelect | undefined>;

  // Risk
  getLatestRiskAssessment(userId: string): Promise<typeof riskAssessments.$inferSelect | undefined>;
  createRiskAssessment(assessment: InsertRiskAssessment): Promise<typeof riskAssessments.$inferSelect>;

  // Patients (Doctor views)
  getPatients(doctorId: string): Promise<any[]>;
  getPatientLogs(patientId: string): Promise<typeof glucoseLogs.$inferSelect[]>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).all();
    return profile as any;
  }

  async upsertProfile(userId: string, profileData: Partial<InsertProfile>) {
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId)).all();

    if (existing) {
      const [updated] = await db.update(profiles)
        .set({ ...profileData })
        .where(eq(profiles.id, (existing as any).id))
        .returning();
      return updated as any;
    } else {
      const [created] = await db.insert(profiles)
        .values({ userId, role: "patient", ...profileData } as any)
        .returning();
      return created as any;
    }
  }

  async getGlucoseLogs(userId: string) {
    return db.select()
      .from(glucoseLogs)
      .where(eq(glucoseLogs.userId, userId))
      .orderBy(desc(glucoseLogs.measuredAt))
      .all() as any;
  }

  async createGlucoseLog(log: InsertGlucoseLog) {
    const [entry] = await db.insert(glucoseLogs).values(log as any).returning();
    return entry as any;
  }

  async confirmGlucoseLog(id: number) {
    const [entry] = await db.update(glucoseLogs)
      .set({ isConfirmed: true })
      .where(eq(glucoseLogs.id, id))
      .returning();
    return entry as any;
  }

  async getLatestRiskAssessment(userId: string) {
    const [assessment] = await db.select()
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.generatedAt))
      .limit(1)
      .all();
    return assessment as any;
  }

  async createRiskAssessment(assessment: InsertRiskAssessment) {
    const [entry] = await db.insert(riskAssessments).values(assessment as any).returning();
    return entry as any;
  }

  async getPatients(doctorId: string) {
    const patientProfiles = await db.select({
      user: users,
      profile: profiles,
    })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.doctorId, doctorId))
      .all();

    const results = await Promise.all(patientProfiles.map(async (row) => {
      const risk = await this.getLatestRiskAssessment((row.user as any).id);
      return {
        ...row.user,
        profile: row.profile,
        latestRisk: risk,
      };
    }));

    return results as any;
  }

  async getPatientLogs(patientId: string) {
    return this.getGlucoseLogs(patientId);
  }
}

export const storage = new DatabaseStorage();
