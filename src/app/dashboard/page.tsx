'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, CheckCircle2, Ticket, Users, Activity, Server } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalQuestions: 0, pendingQA: 0, openTickets: 0, totalStaff: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    const { count: qaCount } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('generated_by', 'tryit_v3');
    const { count: tCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');
    const { count: sCount } = await supabase.from('staff_roles').select('*', { count: 'exact', head: true });
    
    setStats({ totalQuestions: qCount || 0, pendingQA: qaCount || 0, openTickets: tCount || 0, totalStaff: sCount || 0 });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-blue-500 font-medium animate-pulse flex items-center gap-3"><Activity className="animate-spin" /> Loading Live Database...</div>;

  const cards = [
    { title: 'Total Questions', value: stats.totalQuestions, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/30' },
    { title: 'New QA Pending', value: stats.pendingQA, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'hover:border-green-500/30' },
    { title: 'Open Tickets', value: stats.openTickets, icon: Ticket, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/30' },
    { title: 'Active Staff', value: stats.totalStaff, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/30' },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-[var(--foreground)]">
          Welcome back, <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Admin</span>
        </h1>
        <p className="text-gray-500 text-lg">Here is what is happening across the platform today. <span className="text-blue-500 font-bold text-sm ml-2">● Live Auto-Update ON</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`bg-white p-6 rounded-[1.5rem] border border-[var(--card-border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${card.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}><card.icon size={24} /></div>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-[var(--foreground)] tracking-tight">{card.value.toLocaleString()}</h3>
              <p className="text-gray-500 text-sm font-medium mt-1">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[var(--card-border)] rounded-[1.5rem] p-8">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[var(--foreground)]">
          <Activity size={20} className="text-blue-500" /> System Infrastructure
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-[var(--card-border)]">
            <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></div>
            <div><p className="text-xs text-gray-500 font-medium">GitHub Generator</p><p className="font-semibold text-sm text-[var(--foreground)]">Running (Hourly)</p></div>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-[var(--card-border)]">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <div><p className="text-xs text-gray-500 font-medium">Supabase Database</p><p className="font-semibold text-sm text-[var(--foreground)]">Connected</p></div>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-[var(--card-border)]">
            <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div><p className="text-xs text-gray-500 font-medium">AWS Bedrock</p><p className="font-semibold text-sm text-[var(--foreground)]">Auth Hold Pending</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
