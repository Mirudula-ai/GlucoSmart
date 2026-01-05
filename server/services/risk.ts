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
        message: "Insufficient data",
        variability: "Low",
        compliance: "Non-Compliant",
        suggestion: "Please log at least 3 glucose readings to generate a risk assessment."
      }
    };
  }

  // 1. Mean and Standard Deviation
  const values = logs.map(l => Number(l.value));
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  
  // Dynamic calculation every time: Std Dev = sqrt( Σ(x − mean)² / n )
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // 2. CV (%) = (Std Dev / Mean) × 100
  const cv = (stdDev / mean) * 100;

  let variabilityScore: "Low" | "Moderate" | "High" = "Low";
  if (cv > 36) variabilityScore = "High";
  else if (cv > 20) variabilityScore = "Moderate";

  // 3. Compliance Calculation
  // Define compliance as: (number of days with at least one glucose reading ÷ number of days between first and last record) × 100
  const sortedLogs = [...logs].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  const firstDate = new Date(sortedLogs[0].measuredAt);
  const lastDate = new Date(sortedLogs[sortedLogs.length - 1].measuredAt);
  
  // Calculate day difference (inclusive)
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  
  const uniqueDays = new Set(logs.map(l => new Date(l.measuredAt).toISOString().split('T')[0])).size;
  const compliancePercentage = (uniqueDays / diffDays) * 100;

  let complianceStatus: "Compliant" | "Partially Compliant" | "Non-Compliant" = "Non-Compliant";
  if (compliancePercentage >= 80) complianceStatus = "Compliant";
  else if (compliancePercentage >= 50) complianceStatus = "Partially Compliant";

  // 4. Determine Risk State and Alerts
  let riskLevel: "Stable" | "Moderate" | "High" | "Critical" = "Stable";
  const alerts: string[] = [];
  
  // Variability Alerts
  if (cv > 36) alerts.push("High variability detected");
  else if (cv > 20) alerts.push("Moderate variability detected");

  // Mean Glucose Alerts
  if (mean > 250) {
    riskLevel = "High";
    alerts.push("Sustained hyperglycemia");
  } else if (mean > 180) {
    riskLevel = "Moderate";
    alerts.push("Elevated average glucose");
  }

  // Event Alerts
  const hypoEvents = values.filter(v => v < 70).length;
  const hyperEvents = values.filter(v => v > 300).length;

  if (hypoEvents > 0) {
    riskLevel = "Critical";
    alerts.push(`Critical low: ${hypoEvents} hypoglycemic event(s) detected`);
  }
  if (hyperEvents > 2) {
    riskLevel = "Critical";
    alerts.push("Severe hyperglycemia: Frequent high readings detected");
  }

  const factors = {
    avgGlucose: Math.round(mean),
    stdDev: Math.round(stdDev * 10) / 10,
    cv: Math.round(cv * 10) / 10,
    variability: variabilityScore,
    compliance: complianceStatus,
    complianceRate: Math.round(compliancePercentage) + "%",
    alerts: alerts.length > 0 ? alerts.join(", ") : "No acute alerts",
    suggestion: riskLevel === "Stable" 
      ? "Maintain current monitoring frequency. Target fasting glucose < 130 mg/dL."
      : riskLevel === "Moderate"
      ? "Review carbohydrate intake and activity levels. Increase testing frequency."
      : riskLevel === "High"
      ? "Schedule clinical review within 48-72 hours. Check for medication adherence."
      : "Immediate clinical intervention recommended. High risk of acute complications."
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
