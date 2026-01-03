import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  
  const [role, setRole] = useState("patient");
  // Basic date handling for simplicity in this example
  const [dob, setDob] = useState(""); 

  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      if (profile.dateOfBirth) {
        setDob(new Date(profile.dateOfBirth).toISOString().split('T')[0]);
      }
    }
  }, [profile]);

  const handleSave = () => {
    updateMutation.mutate({
      role: role as "patient" | "doctor",
      dateOfBirth: dob ? new Date(dob).toISOString() : undefined,
    });
  };

  if (isLoading) return <div className="loader" />;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
          {user?.firstName?.[0] || user?.username[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">{user?.firstName} {user?.lastName}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label>I am a...</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select 'Doctor' to view patient data analytics.</p>
          </div>

          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input 
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
            />
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
