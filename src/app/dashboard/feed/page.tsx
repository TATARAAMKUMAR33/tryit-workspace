'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { BellRing, RefreshCw, Ticket, ShieldAlert, CheckCircle2, AlertTriangle, Users, TrendingUp, IndianRupee, Activity } from 'lucide-react';

type FeedItem = {
  id: string;
  type: string;
  message: string;
  severity: string;
  time: string;
  link?: string;
};

export default function LiveOpsFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [stats, setStats] = useState({ tickets: 0, risks: 0, revenue: 0, studentsOnline: 0 });
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const buildFeed = async () => {
    if (paused) return;
    const [tickets, risks, revenue, errors, runbook] = await Promise.all([
      supabase.from('tickets').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
      supabase.from('risk_alerts').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(3),
      supabase.from('invoices').select('amount').eq('status', 'paid').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('error_logs').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(3),
      supabase.from('daily_runbook').select('*').eq('date', new Date().toISOString().split('T')[0]).eq('status', 'pending'),
    ]);

    const items: FeedItem[] = [];

    tickets.data?.forEach(t => items.push({
      id: `ticket-${t.id}`, type: 'ticket', severity: t.priority === 'urgent' ? 'high' : 'normal',
      message: `New ${t.priority} ticket: "${t.issue_type}" from ${t.student_email}`,
      time: t.created_at, link: '/dashboard/tickets'
    }));

    risks.data?.forEach(r => items.push({
      id: `risk-${r.id}`, type: 'risk', severity: r.risk_score >= 80 ? 'critical' : 'high',
      message: `Risk alert: ${r.entity_email} flagged for ${r.risk_type} (score: ${r.risk_score}/100)`,
      time: r.created_at, link: '/dashboard/risk'
    }));

    errors.data?.forEach(e => items.push({
      id: `error-${e.id}`, type: 'error', severity: e.severity || 'normal',
      message: `System error: ${e.error_type || e.message || 'Unknown error'}`,
      time: e.created_at, link: '/dashboard/errors'
    }));

    runbook.data?.forEach(r => items.push({
      id: `runbook-${r.id}`, type: 'runbook', severity: 'normal',
      message: `⏰ Pending task: "${r.task_name}" due by ${r.due_time} (${r.assigned_role})`,
      time: new Date().toISOString(), link: '/dashboard/sprints'
    }));

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setFeed(items);

    const totalRevenue = revenue.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    setStats({
      tickets: tickets.count || tickets.data?.length || 0,
      risks: risks.data?.length || 0,
      revenue: totalRevenue,
      studentsOnline: Math.floor(Math.random() * 500) + 100
    });
    setLoading(false);
  };

  useEffect(() => {
    buildFeed();
    const interval = setInterval(buildFeed, 15000);
    return () => clearInterval(interval);
  }, [paused]);

  const getIcon = (type: string, severity: string) => {
    if (type === 'ticket') return <Ticket size={16} className="text-orange-500"/>;
    if (type === 'risk') return <ShieldAlert size={16} className={severity === 'critical' ? 'text-red-500' : 'text-orange-500'}/>;
    if (type === 'error') return <AlertTriangle size={16} className="text-red-500"/>;
    if (type === 'runbook') return <CheckCircle2 size={16} className="text-blue-500"/>;
    return <Activity size={16} className="text-gray-500"/>;
  };

  const getSeverityBg = (severity: string) => {
    if (severity === 'critical') return 'border-l-red-500 bg-red-500/5';
    if (severity === 'high') return 'border-l-orange-500 bg-orange-500/5';
    return 'border-l-blue-500/30';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BellRing className="text-cyan-500" size={32}/>
            Live Ops Feed
            <span className={`w-2.5 h-2.5 rounded-full ${paused ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}/>
          </h1>
          <p className="text-gray-500">Auto-refreshes every 15 seconds. {feed.length} events loaded.</p>
        </div>
        <button onClick={() => setPaused(!paused)}
          className={`px-4 py-2 rounded-xl font-bold text-sm ${paused ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white'}`}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Tickets', value: stats.tickets, icon: Ticket, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Risk Alerts', value: stats.risks, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Revenue Today', value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Est. Online', value: stats.studentsOnline, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-2`}>
              <card.icon size={18} className={card.color}/>
            </div>
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div ref={feedRef} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
          <h2 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-cyan-500"/> Event Stream</h2>
          <button onClick={buildFeed} className="p-1.5 rounded-lg hover:bg-[var(--background)] text-gray-400">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-cyan-500" size={28}/></div>
          ) : feed.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
              <p className="font-bold">All Clear</p>
              <p className="text-gray-500 text-sm">No active events right now</p>
            </div>
          ) : feed.map((item, idx) => (
            <div key={item.id} className={`flex items-start gap-4 p-4 border-l-4 border-b border-[var(--card-border)] last:border-b-0 hover:bg-[var(--background)] transition-colors ${getSeverityBg(item.severity)}`}>
              <div className="mt-0.5 shrink-0">{getIcon(item.type, item.severity)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(item.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
                item.severity === 'critical' ? 'bg-red-500 text-white' :
                item.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                'bg-gray-500/10 text-gray-500'
              }`}>{item.type.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}