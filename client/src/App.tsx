import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";

// Pages
import Home from "@/pages/Home";
import DoctorDashboard from "@/pages/DoctorDashboard";
import PatientDetail from "@/pages/PatientDetail";
import Logs from "@/pages/Logs";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useProfile } from "./hooks/use-profile";

function Router() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isDoctor = profile?.role === "doctor";

  return (
    <Layout>
      <Switch>
        <Route path="/">
          {isDoctor ? <DoctorDashboard /> : <Home />}
        </Route>
        <Route path="/logs" component={Logs} />
        <Route path="/profile" component={Profile} />
        <Route path="/patient/:id" component={PatientDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
