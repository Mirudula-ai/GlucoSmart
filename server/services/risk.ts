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
      factors: { 
        message: "Not enough data for assessment (min 3 logs)",
        variability: "Low",
        compliance: "Non-Compliant",
        suggestion: "Please log at least 3 glucose readings to generate a risk assessment."
      }
    };
  }

  // 1. Glucose Over Time & Trends
  const values = logs.map(l => Number(l.value));
  const avgGlucose = values.reduce((a, b) => a + b, 0) / values.length;

  // 2. Variability (Trend Intelligence)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avgGlucose, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avgGlucose) * 100; // Coefficient of Variation

  let variabilityScore: "Low" | "Moderate" | "High" = "Low";
  if (cv > 36) variabilityScore = "High";
  else if (cv > 20) variabilityScore = "Moderate";

  // 3. Compliance Tracking (Behavioral Layer)
  const uniqueDays = new Set(logs.map(l => l.measuredAt.toISOString().split('T')[0])).size;
  const compliancePercentage = (uniqueDays / 14) * 100;

  let complianceStatus: "Compliant" | "Partially Compliant" | "Non-Compliant" = "Non-Compliant";
  if (compliancePercentage >= 80) complianceStatus = "Compliant";
  else if (compliancePercentage >= 50) complianceStatus = "Partially Compliant";

  // 4. Determine Risk State (Doctor-Facing Output)
  let riskLevel: "Stable" | "Moderate" | "High" | "Critical" = "Stable";
  
  // High avg glucose
  if (avgGlucose > 180) riskLevel = "Moderate";
  if (avgGlucose > 250) riskLevel = "High";

  // Impact of variability
  if (variabilityScore === "High") {
    if (riskLevel === "Stable") riskLevel = "Moderate";
    else if (riskLevel === "Moderate") riskLevel = "High";
    else if (riskLevel === "High") riskLevel = "Critical";
  }

  // Critical conditions (Hypo/Hyper events)
  const hypoEvents = values.filter(v => v < 70).length;
  const hyperEvents = values.filter(v => v > 300).length;

  if (hypoEvents > 0 || hyperEvents > 2) {
    riskLevel = "Critical";
  }

  // 5. Clinical Suggestions (Decision Support)
  const suggestions = {
    Stable: "Maintain current monitoring frequency. Target fasting glucose < 130 mg/dL.",
    Moderate: "Review carbohydrate intake and activity levels. Increase testing frequency.",
    High: "Schedule clinical review within 48-72 hours. Check for medication adherence.",
    Critical: "Immediate clinical intervention recommended. High risk of acute complications."
  };

  const factors = {
    avgGlucose: Math.round(avgGlucose),
    stdDev: Math.round(stdDev),
    cv: Math.round(cv),
    variability: variabilityScore,
    compliance: complianceStatus,
    complianceRate: Math.round(compliancePercentage) + "%",
    alerts: { hypo: hypoEvents, hyper: hyperEvents },
    suggestion: suggestions[riskLevel]
  };

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
