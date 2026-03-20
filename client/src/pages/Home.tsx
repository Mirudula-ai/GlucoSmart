import { useAuth } from "@/hooks/use-auth";
import { useProfile, useRiskAssessment } from "@/hooks/use-profile";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RiskCard } from "@/components/RiskCard";
import { GlucoseChart } from "@/components/GlucoseChart";
import { LogEntryModal } from "@/components/LogEntryModal";
import { PlusCircle, Upload, ArrowRight, Activity, FileText, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="loader" /></div>;

  // If no profile, we should probably force profile creation, but for now fallback to Patient view
  const role = profile?.role || "patient";

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-primary flex items-center gap-3">
            <Activity className="w-8 h-8 md:w-12 md:h-12" />
            GlucoSmart
          </h1>
          <p className="text-muted-foreground mt-2 text-lg md:text-xl font-medium">
            Welcome, {user?.firstName || "Patient"}. Your longitudinal health baseline is active.
          </p>
        </motion.div>

        <div className="flex gap-3">
          <LogEntryModal>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Reading
            </Button>
          </LogEntryModal>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <ClinicalAlerts />
        </div>

        {/* Risk Assessment Card - Takes full width on mobile, 1/3 on desktop */}
        <div className="lg:col-span-1">
          <RiskCard />

          <div className="mt-6 space-y-4">
            <div className="bg-gradient-to-br from-white to-secondary/30 p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">Smart Upload</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Have a lab report? Upload a photo and our AI will extract the values for you instantly.
              </p>
              <LogEntryModal defaultTab="ocr">
                <Button variant="outline" className="w-full bg-white">
                  Try OCR Upload <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </LogEntryModal>
            </div>
          </div>
        </div>

        {/* Charts Area */}
        <div className="lg:col-span-2 space-y-6">
          <GlucoseChart />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mini Stats or Quick Links */}
            <div
              onClick={() => window.print()}
              className="p-6 rounded-2xl bg-white border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Reports</h4>
                <p className="text-muted-foreground text-sm">Print health summary</p>
              </div>
            </div>

            <Link href="/logs">
              <div className="p-6 rounded-2xl bg-white border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="p-4 rounded-xl bg-pink-50 text-pink-600 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">History</h4>
                  <p className="text-muted-foreground text-sm">View all past logs</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity Section */}
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

function ClinicalAlerts() {
  const { data: risk } = useRiskAssessment();

  if (!risk || !risk.factors) return null;

  const factors = risk.factors as any;
  const alertList = factors.alerts ? factors.alerts.split(';') : [];

  if (alertList.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl shadow-sm flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-xl text-red-600 animate-pulse">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-900 font-display mb-2">Clinical Intelligence Alert</h3>
          <div className="space-y-2">
            {alertList.map((alert: string, idx: number) => (
              <p key={idx} className="text-red-700 flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                {alert.trim()}
              </p>
            ))}
          </div>
          <p className="mt-4 text-sm font-bold text-red-800 uppercase tracking-wider">
            Clinical Suggestion: <span className="normal-case font-medium">{factors.suggestion}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RecentActivity() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["glucose-logs", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/logs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      return data.slice(0, 5); // Just first 5
    }
  });

  if (isLoading) return <div className="h-48 bg-muted/20 animate-pulse rounded-2xl" />;

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold font-display">Recent Activity</h3>
        <Link href="/logs" className="text-sm text-primary font-medium hover:underline">View All</Link>
      </div>
      <div className="space-y-4">
        {logs?.length > 0 ? (
          logs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-xl transition-all border border-transparent hover:border-border">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "p-3 rounded-xl",
                  log.value > 180 ? "bg-red-50 text-red-600" :
                    log.value < 70 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                )}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">{log.value} <span className="text-xs font-normal text-muted-foreground">mg/dL</span></p>
                  <p className="text-xs text-muted-foreground capitalize">{log.type.replace('_', ' ')} • {new Date(log.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {new Date(log.measuredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-8 text-muted-foreground italic">No recent activity found.</p>
        )}
      </div>
    </div>
  );
}
