import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGlucoseLogs } from "@/hooks/use-glucose-logs";
import { usePatients } from "@/hooks/use-patients";
import { useProfile, useRiskAssessment } from "@/hooks/use-profile";
import { RiskCard } from "@/components/RiskCard";
import { GlucoseChart } from "@/components/GlucoseChart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientDetail() {
    const { user } = useAuth();
    const { data: profile } = useProfile();
    const [, params] = useRoute("/patient/:id");
    const [, setLocation] = useLocation();
    const patientId = params?.id;

    // Redirect non-doctors away from this view
    if (profile && profile.role !== "doctor") {
        setLocation("/");
        return null;
    }

    const { data: patients } = usePatients();
    const patient = patients?.find(p => p.id === patientId);

    const { data: logs, isLoading: logsLoading } = useGlucoseLogs({ userId: patientId });

    if (!patient && !logsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <h2 className="text-2xl font-bold">Patient Not Found</h2>
                <Link href="/">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-primary">
                            {patient?.firstName} {patient?.lastName}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <UserIcon className="w-4 h-4" /> {patient?.email}
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <FileText className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Charts */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold font-display">Glucose Trends</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                <Calendar className="w-4 h-4" />
                                Last 14 Days
                            </div>
                        </div>
                        {logsLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <GlucoseChart userId={patientId} />
                        )}
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <h2 className="text-xl font-bold font-display mb-4">Recent Readings</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b">
                                    <tr>
                                        <th className="pb-3 pt-1 font-semibold text-sm">Date/Time</th>
                                        <th className="pb-3 pt-1 font-semibold text-sm">Value</th>
                                        <th className="pb-3 pt-1 font-semibold text-sm">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {logs?.slice(0, 10).map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 pr-4">{format(new Date(log.measuredAt), "MMM d, h:mm a")}</td>
                                            <td className="py-3">
                                                <span className={`font-bold ${log.value > 180 || log.value < 70 ? 'text-red-600' : 'text-primary'}`}>
                                                    {log.value} mg/dL
                                                </span>
                                            </td>
                                            <td className="py-3 capitalize text-muted-foreground">{log.type.replace('_', ' ')}</td>
                                        </tr>
                                    ))}
                                    {!logs?.length && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-muted-foreground italic">No readings recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Risk Assessment */}
                    <RiskCard userId={patientId} />

                    {/* Patient Details Bio */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-primary" />
                            Patient Profile
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Joined</span>
                                <span>{patient?.profile?.diagnosisDate ? format(new Date(patient.profile.diagnosisDate), "MMM yyyy") : "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Date of Birth</span>
                                <span>{patient?.profile?.dateOfBirth ? format(new Date(patient.profile.dateOfBirth), "MMM d, yyyy") : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
