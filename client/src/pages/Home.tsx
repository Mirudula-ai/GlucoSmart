import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RiskCard } from "@/components/RiskCard";
import { GlucoseChart } from "@/components/GlucoseChart";
import { LogEntryModal } from "@/components/LogEntryModal";
import { PlusCircle, Upload, ArrowRight, Activity, FileText } from "lucide-react";
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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">
            Hello, {user?.firstName || "Patient"}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Here is your health overview for today.
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
             <div className="p-6 rounded-2xl bg-white border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
               <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                 <FileText className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="font-bold text-lg">Reports</h4>
                 <p className="text-muted-foreground text-sm">Download PDF summaries</p>
               </div>
             </div>

             <div className="p-6 rounded-2xl bg-white border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
               <div className="p-4 rounded-xl bg-pink-50 text-pink-600 group-hover:scale-110 transition-transform">
                 <Activity className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="font-bold text-lg">History</h4>
                 <p className="text-muted-foreground text-sm">View all past logs</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
