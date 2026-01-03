import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border p-8 md:p-12 text-center space-y-8">
        
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-2xl">
            <Activity className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-gray-900">Welcome to GlucoSmart</h1>
          <p className="text-muted-foreground text-lg">
            Smart diabetic management powered by AI.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 rounded-xl"
            onClick={handleLogin}
          >
            Get Started
          </Button>
          <p className="text-xs text-muted-foreground">
            Secure login via Replit Auth
          </p>
        </div>
      </div>
    </div>
  );
}
