import { useState } from "react";
import { Link } from "wouter";
import { usePatients, useAddPatient } from "@/hooks/use-patients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Plus,
    Search,
    ChevronRight,
    Activity,
    RefreshCw,
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function DoctorDashboard() {
    const { data: patients, isLoading, refetch } = usePatients();
    const addPatientMutation = useAddPatient();
    const [newPatientEmail, setNewPatientEmail] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const handleAddPatient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPatientEmail) return;
        addPatientMutation.mutate(newPatientEmail, {
            onSuccess: () => setNewPatientEmail(""),
        });
    };

    const filteredPatients = patients?.filter(p =>
        `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRiskColor = (level?: string) => {
        switch (level) {
            case "Stable": return "bg-green-100 text-green-700";
            case "Moderate": return "bg-yellow-100 text-yellow-700";
            case "High": return "bg-orange-100 text-orange-700";
            case "Critical": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
                        <Activity className="w-10 h-10 text-primary" />
                        GlucoSmart Console
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">Predictive clinical monitoring for your patients.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="bg-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Sync Data
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                    label="Total Patients"
                    value={patients?.length || 0}
                    icon={Users}
                    color="text-primary bg-primary/10"
                />
                <SummaryCard
                    label="Critical Attention"
                    value={patients?.filter(p => p.latestRisk?.riskLevel === "Critical").length || 0}
                    icon={AlertCircle}
                    color="text-red-600 bg-red-50"
                    pulse={patients?.some(p => p.latestRisk?.riskLevel === "Critical")}
                />
                <SummaryCard
                    label="Stable Patterns"
                    value={patients?.filter(p => p.latestRisk?.riskLevel === "Stable").length || 0}
                    icon={CheckCircle}
                    color="text-green-600 bg-green-50"
                />
                <SummaryCard
                    label="Recent Syncs"
                    value={patients?.filter(p => {
                        const lastLog = p.latestRisk?.generatedAt;
                        if (!lastLog) return false;
                        return new Date(lastLog) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                    }).length || 0}
                    icon={RefreshCw}
                    color="text-indigo-600 bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Patient List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Active Patient Profiles
                                </CardTitle>
                                <div className="relative w-48 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search patients..."
                                        className="pl-9 h-10 bg-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-xl" />)}
                                </div>
                            ) : filteredPatients?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-primary/40" />
                                    </div>
                                    <h3 className="font-semibold text-lg font-display">No patients linked</h3>
                                    <p className="text-muted-foreground text-sm">Add a patient email to start monitoring.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredPatients?.map((pt, idx) => (
                                        <Link key={pt.id} href={`/patient/${pt.id}`}>
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group flex items-center justify-between p-4 rounded-2xl border bg-white hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                                        <span className="text-primary font-bold text-xl">
                                                            {pt.firstName?.[0] || pt.email?.[0]?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                                                {pt.firstName} {pt.lastName}
                                                            </h4>
                                                            {(pt.latestRisk?.factors as any)?.trend === 'Worsening' && (
                                                                <span className="text-red-500 animate-pulse">📈</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{pt.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="hidden md:flex gap-6 text-sm">
                                                        <div className="text-center">
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Avg</p>
                                                            <p className="font-mono font-bold">
                                                                {(pt.latestRisk?.factors as any)?.avgGlucose || "--"}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CV %</p>
                                                            <p className="font-mono font-bold">
                                                                {(pt.latestRisk?.factors as any)?.cv || "--"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider text-center">Risk</p>
                                                        <Badge className={`${getRiskColor(pt.latestRisk?.riskLevel)} border-none shadow-none rounded-lg px-3`}>
                                                            {pt.latestRisk?.riskLevel || "Pending"}
                                                        </Badge>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Manage & Intelligence */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-primary/5 ring-1 ring-primary/20 overflow-hidden">
                        <div className="p-4 bg-primary text-primary-foreground flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            <h3 className="font-bold font-display">Link Patient</h3>
                        </div>
                        <CardContent className="pt-6">
                            <form onSubmit={handleAddPatient} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Email Address"
                                        type="email"
                                        className="bg-white border-primary/20 h-11"
                                        value={newPatientEmail}
                                        onChange={(e) => setNewPatientEmail(e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground italic px-1 text-center">
                                        Patient must have an active baseline account.
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-11 shadow-sm"
                                    disabled={addPatientMutation.isPending}
                                >
                                    {addPatientMutation.isPending ? "Connecting..." : "Initialize Link"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white overflow-hidden border-l-4 border-l-accent">
                        <CardHeader className="bg-accent/5">
                            <CardTitle className="text-lg flex items-center gap-2 text-accent">
                                <AlertCircle className="w-5 h-5" />
                                Clinical Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {patients?.some(p => p.latestRisk?.riskLevel === "Critical" || p.latestRisk?.riskLevel === "High") ? (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 items-start">
                                    <div className="p-1 bg-red-200 rounded text-red-700">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm text-red-900 leading-tight">
                                        <strong>{patients.filter(p => ["High", "Critical"].includes(p.latestRisk?.riskLevel || "")).length} patients</strong> show clinical instability. Immediate review recommended.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground italic text-sm">
                                    All linked patient baselines are currently stable.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color, pulse }: any) {
    return (
        <Card className={`border-none shadow-sm h-full`}>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${color} ${pulse ? 'animate-pulse' : ''}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function CheckCircle(props: any) {
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}
