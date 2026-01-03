import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  LogOut, 
  User, 
  FileText, 
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simple check for role - in real app, fetch from profile
  const isDoctor = false; // This would come from useProfile()

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-primary/10 text-primary font-semibold' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}
      `}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        {label}
      </Link>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-xl font-display">
              <Activity className="w-8 h-8" />
              <span>GlucoSmart</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary font-bold text-lg font-display">
          <Activity className="w-6 h-6" />
          <span>GlucoSmart</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-xl z-40 p-4 flex flex-col gap-2"
          >
            <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/logs" icon={FileText} label="Logs & Reports" />
            <NavItem href="/profile" icon={User} label="Profile" />
            <Button variant="destructive" className="mt-4 w-full" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white h-screen sticky top-0 p-6">
        <div className="flex items-center gap-3 text-primary font-bold text-2xl font-display mb-10 px-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Activity className="w-8 h-8" />
          </div>
          <span>GlucoSmart</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/logs" icon={FileText} label="Logs & Reports" />
          <NavItem href="/profile" icon={User} label="Profile" />
        </nav>

        <div className="pt-6 border-t mt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
              {user.firstName?.[0] || user.username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{user.firstName || user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5" onClick={() => logout()}>
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
