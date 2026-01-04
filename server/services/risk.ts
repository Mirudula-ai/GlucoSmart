import { db } from "../db";
import { glucoseLogs, riskAssessments, type InsertRiskAssessment } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { subDays } from "date-fns";

export async function calculateRisk(userId: string) {
  // Get logs for the last 14 days
  const twoWeeksAgo = subDays(new Date(), 14);
  const logs = await db.select()
    .from(glucoseLogs)
    .where(
      and(
        eq(glucoseLogs.userId, userId),
        gte(glucoseLogs.measuredAt, twoWeeksAgo),
        eq(glucoseLogs.isConfirmed, true)
      )
    )
    .orderBy(desc(glucoseLogs.measuredAt));

  if (logs.length < 3) {
    return {
      riskLevel: "Stable",
      factors: { message: "Not enough data for assessment" }
    };
  }

  // 1. Glucose Over Time & Trends
  // Calculate average glucose
  const values = logs.map(l => Number(l.value));
  const avgGlucose = values.reduce((a, b) => a + b, 0) / values.length;

  // 2. Variability (Standard Deviation)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avgGlucose, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avgGlucose) * 100; // Coefficient of Variation

  // 3. Compliance (Missed days in last 7 days)
  // Simple check: how many unique days have logs?
  const uniqueDays = new Set(logs.map(l => l.measuredAt.toISOString().split('T')[0])).size;
  const complianceScore = Math.min(uniqueDays / 14, 1); // rough score

  // 4. Determine Risk State
  // Stable, Moderate, High, Critical
  let riskLevel = "Stable";
  const factors: any = {
    avgGlucose: Math.round(avgGlucose),
    stdDev: Math.round(stdDev),
    cv: Math.round(cv),
    compliance: Math.round(complianceScore * 100) + "%"
  };

  // Logic inspired by general diabetic guidelines (NOT medical diagnosis)
  // High avg glucose
  if (avgGlucose > 180) riskLevel = "Moderate";
  if (avgGlucose > 250) riskLevel = "High";

  // High variability
  if (cv > 36) { // >36% is often considered unstable
    if (riskLevel === "Stable") riskLevel = "Moderate";
    else if (riskLevel === "Moderate") riskLevel = "High";
  }

  // Critical conditions (Hypo/Hyper events)
  const hypoEvents = values.filter(v => v < 70).length;
  const hyperEvents = values.filter(v => v > 300).length;

  if (hypoEvents > 0 || hyperEvents > 0) {
    riskLevel = "Critical";
    factors.alerts = { hypo: hypoEvents, hyper: hyperEvents };
  }

  return { riskLevel, factors };
}

export async function updateRiskAssessment(userId: string) {
  const assessment = await calculateRisk(userId);
  
  await db.insert(riskAssessments).values({
    userId,
    riskLevel: assessment.riskLevel as any,
    factors: assessment.factors,
  });

  return assessment;
}
