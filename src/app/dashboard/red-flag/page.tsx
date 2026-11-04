'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertOctagon, RefreshCw, Clock, ShieldAlert, Users, CheckCircle2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RedFlagDashboard() {
  const router = useRouter();
  const [data, setData] = useState({
    sla_breaches: 0, risk_alerts: 0, stale_tasks: 0,
    health_score: 0, dropout_high: 0, security_incidents: 0
  });
  const [breachedTickets, setBreachedTickets] = useState<any[]>([]);
  const [pendingRisks, setPendingRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [sla, risk, stale, health, dropout, incidents, bTickets, pRisks] = await Promise.all([
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open').lt('sla_deadline', new Date().toISOString()),
      supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done').lt('updated_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('platform_health_score').select('health_score').single(),
      supabase.from('dropout_risk').select('id', { count: 'exact', head: true }).eq('churn_risk', 'HIGH'),
      supabase.from('security_incidents').select('id', { count: 'exact', head: true }).eq('status', 'investigating'),
      supabase.from('tickets').select('*').eq('status', 'open').lt('sla_deadline', new Date().toISOString()).order('sla_deadline').limit(5),
      supabase.from('risk_alerts').select('*').eq('status', 'pending').order('risk_score', { ascending: false }).limit(5),
    ]);
    setData({
      sla_breaches: sla.count || 0, risk_alerts: risk.count || 0,
      stale_tasks: stale.count || 0, health_score: health.data?.health_score || 0,
      dropout_high: dropout.count || 0, security_incidents: incidents.count || 0
    });
    if (bTickets.data) setBreachedTickets(bTickets.data);
    if (pRisks.data) setPendingRisks(pRisks.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 60000); return () => clearInterval(i); }, []);

  const cards = [
    { label: 'SLA Breaches', value: data.sla_breaches, icon: Clock, color: 'red', href: '/dashboard/tickets' },
    { label: 'Risk Alerts', value: data.risk_alerts, icon: ShieldAlert, color: 'orange', href: '/dashboard/risk' },
    { label: 'Stale Tasks', value: data.stale_tasks, icon: AlertOctagon, color: 'yellow', href: '/dashboard/sprints' },
    { label: 'High Dropout Risk', value: data.dropout_high, icon: Users, color: 'purple', href: '/dashboard/students' },
    { label: 'Security Incidents', value: data.security_incidents, icon: ShieldAlert, color: 'red', href: '/dashboard/security' },
    { label: 'Platform Health', value: `${data.health_score}/100`, icon: CheckCircle2, color: data.health_score > 80 ? 'green' : 'red', href: '/dashboard/system' },
  ];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40} /></div>;

  const totalAlerts = data.sla_breaches + data.risk_alerts + data.stale_tasks + data.security_incidents;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <div className="text-center">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 ${totalAlerts > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
          <AlertOctagon size={28} className={totalAlerts > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'} />
          <h1 className="text-3xl font-black">{totalAlerts > 0 ? `${totalAlerts} ITEMS NEED ATTENTION` : 'ALL CLEAR'}</h1>
        </div>
        <p className="text-gray-500">Auto-refreshes every 60 seconds. Click any card to action.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} onClick={() => router.push(card.href)}
            className={`bg-[var(--card-bg)] border rounded-2xl p-6 text-center cursor-pointer hover:scale-105 transition-transform ${
              card.color === 'red' && typeof card.value === 'number' && card.value > 0
                ? 'border-red-500/50 bg-red-500/5'
                : card.color === 'orange' && typeof card.value === 'number' && card.value > 0
                ? 'border-orange-500/50 bg-orange-500/5'
                : 'border-[var(--card-border)]'
            }`}>
            <card.icon size={28} className={`mx-auto mb-3 text-${card.color}-500`} />
            <div className={`text-4xl font-black mb-1 ${
              typeof card.value === 'number' && card.value > 0 ? `text-${card.color}-500` : 'text-green-500'
            }`}>{card.value}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4 text-red-500 flex items-center gap-2"><Clock size={20}/> SLA Breached Tickets</h2>
          {breachedTickets.length === 0
            ? <p className="text-green-500 text-sm">✅ No SLA breaches</p>
            : breachedTickets.map(t => (
              <div key={t.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">{t.issue_type}</p>
                    <p className="text-xs text-gray-500">{t.student_email}</p>
                  </div>
                  <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold">BREACHED</span>
                </div>
              </div>
            ))}
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4 text-orange-500 flex items-center gap-2"><ShieldAlert size={20}/> Top Risk Alerts</h2>
          {pendingRisks.length === 0
            ? <p className="text-green-500 text-sm">✅ No pending risks</p>
            : pendingRisks.map(r => (
              <div key={r.id} className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 mb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">{r.entity_email}</p>
                    <p className="text-xs text-gray-500">{r.risk_type}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded ${r.risk_score >= 80 ? 'bg-red-500 text-white' : 'bg-orange-500/20 text-orange-500'}`}>
                    {r.risk_score}/100
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="text-center">
        <button onClick={fetchAll} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center gap-2 mx-auto">
          <RefreshCw size={18}/> Refresh Now
        </button>
      </div>
    </div>
  );
}