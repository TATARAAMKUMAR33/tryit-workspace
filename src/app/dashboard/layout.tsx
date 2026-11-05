'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Ticket, CheckSquare, Users, LogOut, Zap, Menu, Search, 
  UserPlus, Activity, Sparkles, ShieldAlert, UserCircle, MessageSquare, 
  BookOpen, Flag, Briefcase, CreditCard, Terminal, BarChart2, UserCheck, Gavel, 
  BarChart3, BellRing, AlertTriangle, ShieldX, Settings, Wallet, Bug, Columns, Target,
  Camera, X,Calendar,
  CalendarDays, UserCircle2} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import GlobalSearch from '@/components/GlobalSearch';
import EscalationAlerts from '@/components/EscalationAlerts';
import PushNotificationButton from '@/components/PushNotificationButton';

const rolePermissions: Record<string, string[]> = {
  super_admin: ['*'],
  qa_agent: ['/dashboard', '/dashboard/qa', '/dashboard/chat', '/dashboard/knowledge'],
  crm_agent: ['/dashboard', '/dashboard/tickets', '/dashboard/students', '/dashboard/chat', '/dashboard/knowledge', '/dashboard/disputes'],
  discipline_officer: ['/dashboard', '/dashboard/moderation', '/dashboard/risk', '/dashboard/chat'],
  hr: ['/dashboard', '/dashboard/staff', '/dashboard/team', '/dashboard/hr', '/dashboard/chat', '/dashboard/knowledge', '/dashboard/performance', '/dashboard/verification', '/dashboard/expenses'],
  finance: ['/dashboard', '/dashboard/billing', '/dashboard/expenses', '/dashboard/disputes', '/dashboard/hr'],
  content_lead: ['/dashboard', '/dashboard/qa', '/dashboard/content-ops', '/dashboard/knowledge', '/dashboard/chat', '/dashboard/moderation'],
  mentor: ['/dashboard', '/dashboard/qa', '/dashboard/chat', '/dashboard/knowledge']
};

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Live Ops Feed', href: '/dashboard/feed', icon: BellRing, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { name: 'QA Inspector', href: '/dashboard/qa', icon: CheckSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'CRM Tickets', href: '/dashboard/tickets', icon: Ticket, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'Disputes', href: '/dashboard/disputes', icon: Gavel, color: 'text-red-500', bg: 'bg-red-500/10' },
  { name: 'Team Hub', href: '/dashboard/team', icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
  { name: 'Sprints', href: '/dashboard/sprints', icon: Columns, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { name: 'Staff Chat', href: '/dashboard/chat', icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpen, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  { name: 'Student 360', href: '/dashboard/students', icon: UserCircle, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { name: 'B2B Leads', href: '/dashboard/leads', icon: Target, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { name: 'Verification', href: '/dashboard/verification', icon: UserCheck, color: 'text-lime-600', bg: 'bg-lime-500/10' },
  { name: 'Staff Directory', href: '/dashboard/staff', icon: UserPlus, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { name: 'Audit Logs', href: '/dashboard/audit', icon: Activity, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  { name: 'Bharat Pulse', href: '/dashboard/pulse', icon: Sparkles, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
  { name: 'God Mode', href: '/dashboard/god-mode', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-600/10' },
  { name: 'Master Control', href: '/dashboard/master-control', icon: Settings, color: 'text-gray-700', bg: 'bg-gray-700/10' },
  { name: 'Command Center', href: '/dashboard/command-center', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-600/10' },
  { name: 'Red Flag', href: '/dashboard/red-flag', icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-700/10' },
  { name: 'Content Ops', href: '/dashboard/content-ops', icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-600/10' },
  { name: 'Moderation', href: '/dashboard/moderation', icon: Flag, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Risk Radar', href: '/dashboard/risk', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-600/10' },
  { name: 'Security', href: '/dashboard/security', icon: ShieldX, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
  { name: 'HR & Payroll', href: '/dashboard/hr', icon: Briefcase, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { name: 'Expenses', href: '/dashboard/expenses', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-600/10' },
  { name: 'Error Logs', href: '/dashboard/errors', icon: Bug, color: 'text-red-500', bg: 'bg-red-500/10' },
  { name: 'Automation', href: '/dashboard/automation', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'System Logs', href: '/dashboard/system', icon: Terminal, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  { name: 'Staff KPI', href: '/dashboard/performance', icon: BarChart2, color: 'text-cyan-600', bg: 'bg-cyan-600/10' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-600/10' },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'My Profile', href: '/dashboard/profile', icon: UserCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('tryit_role');
    const storedEmail = localStorage.getItem('tryit_user');

    if (!storedRole || !storedEmail) {
      router.push('/login');
      return;
    }

    setRole(storedRole);
    setEmail(storedEmail);
    setMounted(true);

    supabase
      .from('staff_roles')
      .select('avatar_url, bio')
      .eq('user_email', storedEmail)
      .single()
      .then(({ data }) => {
        if (data) {
          setAvatarUrl(data.avatar_url);
          setBio(data.bio || '');
        }
      });

    const permissions = rolePermissions[storedRole] || [];
    if (permissions[0] !== '*' && !permissions.includes(pathname)) {
      router.push('/dashboard');
    }
  }, [pathname, router]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${email.replace('@', '_')}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) { alert('Upload error: ' + uploadError.message); setIsUploading(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await supabase.from('staff_roles').update({ avatar_url: data.publicUrl, bio }).eq('user_email', email);
    setAvatarUrl(data.publicUrl);
    setIsUploading(false);
  };

  const filteredNavItems = navItems.filter(item => {
    if (role === 'super_admin') return true;
    return rolePermissions[role]?.includes(item.href);
  });

  if (!mounted) return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-4 rounded-2xl animate-pulse">
          <Zap className="text-white" size={32} />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading TryIT Hub...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[var(--background)] overflow-hidden">
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black"><X size={20} /></button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : email[0]?.toUpperCase()}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <p className="text-xs text-gray-500 mt-2">{isUploading ? 'Uploading...' : 'Click to change photo'}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Write something about yourself..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 mt-1" />
              </div>
              <button onClick={() => { supabase.from('staff_roles').update({ bio }).eq('user_email', email).then(() => { alert('Bio saved!'); setIsProfileModalOpen(false); }); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`bg-[var(--sidebar-bg)] border-r border-[var(--card-border)] flex flex-col transition-all duration-300 ease-in-out shadow-sm ${isSidebarOpen ? 'w-64' : 'w-20'} z-20 shrink-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--card-border)] shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
              <Zap className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-[var(--foreground)]">TryIT Hub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-white/50 text-gray-500 transition-colors">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button key={item.name} onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? `${item.bg} ${item.color} font-bold shadow-sm border border-white/50` : 'text-gray-600 hover:bg-white/60 hover:shadow-sm'}`}>
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${isActive ? 'bg-white/50' : 'bg-transparent'}`}>
                  <item.icon size={18} className={isActive ? item.color : 'text-gray-400 group-hover:text-gray-700'} />
                </div>
                <span className={`whitespace-nowrap text-sm ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--card-border)] bg-white/30 backdrop-blur-sm shrink-0">
          <div onClick={() => setIsProfileModalOpen(true)} className={`flex items-center gap-3 p-2 mb-2 rounded-xl hover:bg-white transition-colors cursor-pointer ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : email[0]?.toUpperCase()}
            </div>
            <div className={`overflow-hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
              <p className="text-sm font-bold text-[var(--foreground)] leading-tight">{email.split('@')[0]}</p>
              <p className="text-xs text-gray-500">🚀 {role.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={`w-full flex items-center gap-4 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors ${!isSidebarOpen && 'justify-center'}`}>
            <LogOut size={20} />
            <span className={`whitespace-nowrap font-medium text-sm ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="h-16 border-b border-[var(--card-border)] flex items-center justify-between px-8 bg-[var(--background)]/80 backdrop-blur-md z-10 sticky top-0 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Workspace</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSearchOpen(true)}
              className="relative hidden md:flex items-center bg-white border border-[var(--card-border)] rounded-full py-2 pl-10 pr-4 text-sm text-gray-500 hover:border-blue-400 hover:shadow-md transition-all w-64 text-left">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              Search anything...
              <kbd className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 rounded border border-gray-200">Ctrl K</kbd>
            </button>
            <PushNotificationButton />
            <EscalationAlerts />
            <div className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-200 shadow-sm">
              {role.replace('_', ' ')}
            </div>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto p-8 bg-[var(--background)]">
          {children}
        </div>
      </main>
    </div>
  );
}