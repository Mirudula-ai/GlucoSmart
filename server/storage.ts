import { db } from "./db";
import { 
  glucoseLogs, profiles, riskAssessments, 
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
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(userId: string, profileData: Partial<InsertProfile>) {
    // Check if exists
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    if (existing) {
      const [updated] = await db.update(profiles)
        .set({ ...profileData })
        .where(eq(profiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(profiles)
        .values({ userId, role: "patient", ...profileData } as InsertProfile)
        .returning();
      return created;
    }
  }

  async getGlucoseLogs(userId: string) {
    return db.select()
      .from(glucoseLogs)
      .where(eq(glucoseLogs.userId, userId))
      .orderBy(desc(glucoseLogs.measuredAt));
  }

  async createGlucoseLog(log: InsertGlucoseLog) {
    const [entry] = await db.insert(glucoseLogs).values(log).returning();
    return entry;
  }

  async confirmGlucoseLog(id: number) {
    const [entry] = await db.update(glucoseLogs)
      .set({ isConfirmed: true })
      .where(eq(glucoseLogs.id, id))
      .returning();
    return entry;
  }

  async getLatestRiskAssessment(userId: string) {
    const [assessment] = await db.select()
      .from(riskAssessments)
      .where(eq(riskAssessments.userId, userId))
      .orderBy(desc(riskAssessments.generatedAt))
      .limit(1);
    return assessment;
  }

  async createRiskAssessment(assessment: InsertRiskAssessment) {
    const [entry] = await db.insert(riskAssessments).values(assessment).returning();
    return entry;
  }
}

export const storage = new DatabaseStorage();
