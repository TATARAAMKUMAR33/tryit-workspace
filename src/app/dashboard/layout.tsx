'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, Ticket, CheckSquare, Users, LogOut, Zap, Menu, Sun, Moon, 
  Search, UserPlus, Activity, Sparkles, ShieldAlert, UserCircle, MessageSquare, 
  BookOpen, Flag, Briefcase, CreditCard, Terminal, BarChart2, UserCheck, Gavel, 
  BarChart3, BellRing, AlertTriangle, ShieldX, Settings 
} from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';
import EscalationAlerts from '@/components/EscalationAlerts';

// --- RBAC CONFIGURATION ---
const rolePermissions: Record<string, string[]> = {
  super_admin: ['*'], // Access to everything
  qa_agent: ['/dashboard', '/dashboard/qa', '/dashboard/chat', '/dashboard/knowledge'],
  crm_agent: ['/dashboard', '/dashboard/tickets', '/dashboard/students', '/dashboard/chat', '/dashboard/knowledge', '/dashboard/disputes'],
  discipline_officer: ['/dashboard', '/dashboard/moderation', '/dashboard/risk', '/dashboard/chat'],
  hr: ['/dashboard', '/dashboard/staff', '/dashboard/team', '/dashboard/hr', '/dashboard/chat', '/dashboard/knowledge', '/dashboard/performance', '/dashboard/verification'],
  mentor: ['/dashboard', '/dashboard/qa', '/dashboard/chat', '/dashboard/knowledge']
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState('qa_agent');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userRole = localStorage.getItem('tryit_role') || 'qa_agent';
    setRole(userRole);

    // Bouncer: Check if user is allowed to be here
    const permissions = rolePermissions[userRole] || [];
    if (permissions[0] !== '*' && !permissions.includes(pathname)) {
      alert("Access Denied: You do not have permission to view this page.");
      router.push('/dashboard');
    }
  }, [pathname, router]);

  // Bind Ctrl+K to Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Ops Feed', href: '/dashboard/feed', icon: BellRing },
    { name: 'QA Inspector', href: '/dashboard/qa', icon: CheckSquare },
    { name: 'CRM Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Disputes', href: '/dashboard/disputes', icon: Gavel },
    { name: 'Team Hub', href: '/dashboard/team', icon: Users },
    { name: 'Staff Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen },
    { name: 'Student 360', href: '/dashboard/students', icon: UserCircle },
    { name: 'Verification', href: '/dashboard/verification', icon: UserCheck },
    { name: 'Staff Directory', href: '/dashboard/staff', icon: UserPlus },
    { name: 'Audit Logs', href: '/dashboard/audit', icon: Activity },
    { name: 'Bharat Pulse', href: '/dashboard/pulse', icon: Sparkles },
    { name: 'God Mode', href: '/dashboard/god-mode', icon: ShieldAlert },
    { name: 'Moderation', href: '/dashboard/moderation', icon: Flag },
    { name: 'Risk Radar', href: '/dashboard/risk', icon: AlertTriangle },
    { name: 'Security & Privacy', href: '/dashboard/security', icon: ShieldX },
    { name: 'HR & Payroll', href: '/dashboard/hr', icon: Briefcase },
    { name: 'Billing & Invoices', href: '/dashboard/billing', icon: CreditCard },
    { name: 'System Logs', href: '/dashboard/system', icon: Terminal },
    { name: 'Platform Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Staff KPI', href: '/dashboard/performance', icon: BarChart2 },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ];

  // Filter sidebar based on role
  const navItems = allNavItems.filter(item => {
    if (role === 'super_admin') return true;
    return rolePermissions[role]?.includes(item.href);
  });

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[var(--background)] transition-colors duration-300">
      
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <aside className={`bg-[var(--sidebar-bg)] backdrop-blur-3xl border-r border-[var(--card-border)] flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} z-20`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--card-border)]">
          <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <Zap className="text-blue-500 flex-shrink-0" size={24} />
            <span className="font-semibold text-lg tracking-tight">TryIT Hub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-500/10 text-gray-400 hover:text-[var(--foreground)] transition-colors">
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button key={item.name} onClick={() => router.push(item.href)} className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-gray-500 hover:bg-gray-500/10 hover:text-[var(--foreground)]'}`}>
                <item.icon size={20} className={isActive ? 'text-blue-500' : ''} />
                <span className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>{item.name}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-[var(--card-border)]">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-3 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={22} />
            <span className={`whitespace-nowrap font-medium text-sm ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[var(--card-border)] flex items-center justify-between px-8 bg-[var(--background)]/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Workspace</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="relative hidden md:flex items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full py-2 pl-10 pr-4 text-sm text-gray-500 hover:border-blue-500 transition-colors w-64 text-left"
            >
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              Search anything...
              <kbd className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono bg-gray-500/10 rounded border border-gray-500/20">Ctrl K</kbd>
            </button>
            
            <EscalationAlerts />
            
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500 hover:text-[var(--foreground)] transition-all">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="bg-blue-500/10 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-500 border border-blue-500/20">
              {role.toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
}
