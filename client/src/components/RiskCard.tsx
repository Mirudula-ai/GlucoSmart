import { useRiskAssessment } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-2 ${config.color.split(' ')[2]} overflow-hidden`}>
        <div className={`p-6 ${config.color}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/50 rounded-full backdrop-blur-sm">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl">{config.label}</h3>
              <p className="opacity-90 font-medium">{config.desc}</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-primary" />
            Analysis Factors
          </h4>
          {risk.factors && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
               {/* Just simpler rendering of JSON factors, excluding alerts */}
               {Object.entries(risk.factors as Record<string, any>)
                 .filter(([key]) => key !== 'alerts')
                 .map(([key, val]) => (
                   <div key={key} className="flex justify-between items-center bg-secondary/30 p-2 rounded-lg">
                     <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                     <span className="font-mono font-medium text-foreground">{String(val)}</span>
                   </div>
                 ))}
             </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
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
