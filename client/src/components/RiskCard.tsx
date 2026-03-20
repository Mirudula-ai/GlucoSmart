import { useRiskAssessment } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export function RiskCard({ userId }: { userId?: string }) {
  const { data: risk, isLoading } = useRiskAssessment(userId);

  if (isLoading) {
    return <div className="h-48 bg-muted/20 animate-pulse rounded-2xl" />;
  }

  // Fallback if no assessment exists yet
  if (!risk) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
          <Info className="w-8 h-8 mb-2 opacity-50" />
          <p>Not enough data for risk assessment.</p>
          <p className="text-sm">Log more entries to see your analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskConfig = (level: string) => {
    switch (level) {
      case "Stable":
        return {
          color: "bg-green-100 text-green-700 border-green-200",
          icon: CheckCircle,
          label: "Stable Condition",
          desc: "Your glucose levels are within a healthy range with low variability."
        };
      case "Moderate":
        return {
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: Info,
          label: "Moderate Risk",
          desc: "Some fluctuations detected. Keep monitoring regularly."
        };
      case "High":
        return {
          color: "bg-orange-100 text-orange-700 border-orange-200",
          icon: AlertTriangle,
          label: "High Risk",
          desc: "Significant variability or elevated levels observed."
        };
      case "Critical":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: ShieldAlert,
          label: "Critical Attention Needed",
          desc: "Immediate attention required. Please consult your doctor."
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: Info,
          label: "Unknown",
          desc: "Analysis pending."
        };
    }
  };

  const config = getRiskConfig(risk.riskLevel);
  const Icon = config.icon;

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "Improving": return "📉";
      case "Worsening": return "📈";
      default: return "➡️";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-2 ${config.color.split(' ')[2]} overflow-hidden shadow-md`}>
        <div className={`p-6 ${config.color}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/50 rounded-full backdrop-blur-sm shadow-inner">
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-2xl">{config.label}</h3>
                {(risk.factors as any)?.trend && (
                  <span className={clsx(
                    "text-xs font-bold px-2 py-1 rounded-full border bg-white/50",
                    (risk.factors as any).trend === 'Worsening' ? "text-red-700 border-red-200" :
                      (risk.factors as any).trend === 'Improving' ? "text-green-700 border-green-200" : "text-gray-700 border-gray-200"
                  )}>
                    {getTrendIcon((risk.factors as any).trend)} {(risk.factors as any).trend}
                  </span>
                )}
              </div>
              <p className="opacity-90 font-medium">{config.desc}</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <h1 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2">
            <ActivityIcon className="w-5 h-5 text-primary" />
            Clinical Analysis
          </h1>

          {!!risk.factors && typeof risk.factors === 'object' && (
            (() => {
              const factors = risk.factors as any;
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Core Metrics</p>
                    <div className="grid grid-cols-2 gap-2">
                      <MetricBox label="Avg Glucose" value={`${factors.avgGlucose} mg/dL`} />
                      <MetricBox label="Variability (CV)" value={`${factors.cv}%`} sub={factors.variability} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Patterns & Baseline</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm p-2 bg-secondary/20 rounded-lg">
                        <span className="text-muted-foreground">Compliance</span>
                        <span className="font-semibold">{factors.complianceRate}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm p-2 bg-secondary/20 rounded-lg">
                        <span className="text-muted-foreground">Time-of-Day</span>
                        <span className="font-semibold truncate max-w-[120px]">{factors.patterns || "None detected"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 mt-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Early Risk Flags
                    </p>
                    <p className="text-sm font-medium text-foreground italic">
                      {factors.alerts || "No predictive flags detected at this time."}
                    </p>
                  </div>
                </div>
              );
            })()
          )}

          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-muted-foreground mb-1 font-bold">CLINICAL SUGGESTION</p>
            <p className="text-sm text-primary font-medium">{(risk.factors as any)?.suggestion}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricBox({ label, value, sub }: { label: string, value: string, sub?: string }) {
  return (
    <div className="bg-secondary/30 p-3 rounded-xl border border-secondary/50">
      <p className="text-[10px] uppercase font-bold text-muted-foreground leading-tight">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] font-medium text-muted-foreground">{sub} Variability</p>}
    </div>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
