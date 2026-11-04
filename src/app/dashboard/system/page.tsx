'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Terminal, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity, Database, Zap } from 'lucide-react';

export default function SystemHealth() {
  const [deps, setDeps] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [d, e, h, q] = await Promise.all([
      supabase.from('integration_status').select('*').order('last_checked', { ascending: false }),
      supabase.from('system_events').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('platform_health_score').select('*').single(),
      supabase.from('information_schema.tables').select('table_name', { count: 'exact', head: true }).eq('table_schema', 'public'),
    ]);
    if (d.data) setDeps(d.data);
    if (e.data) setEvents(e.data);
    if (h.data) setHealth(h.data);
    setQuota({ tables: q.count || 0 });
    setLoading(false);
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'healthy' || status === 'up') return <CheckCircle2 size={18} className="text-green-500"/>;
    if (status === 'degraded' || status === 'slow') return <AlertTriangle size={18} className="text-yellow-500"/>;
    return <XCircle size={18} className="text-red-500"/>;
  };

  const getStatusColor = (status: string) => {
    if (status === 'healthy' || status === 'up') return 'border-green-500/30 bg-green-500/5';
    if (status === 'degraded' || status === 'slow') return 'border-yellow-500/30 bg-yellow-500/5';
    return 'border-red-500/30 bg-red-500/5';
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-gray-500" size={40}/></div>;

  const healthScore = health?.health_score || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Terminal className="text-gray-500" size={32}/> System Health</h1>
          <p className="text-gray-500">Live infrastructure monitoring. Auto-refreshes every 30 seconds.</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Platform Health', value: `${healthScore}/100`, icon: Activity, color: healthScore > 80 ? 'text-green-500' : 'text-red-500', bg: healthScore > 80 ? 'bg-green-500/10' : 'bg-red-500/10' },
          { label: 'DB Tables', value: quota?.tables || 0, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Services Up', value: deps.filter(d => d.status === 'healthy' || d.status === 'up').length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Services Down', value: deps.filter(d => d.status === 'down' || d.status === 'error').length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon size={20} className={card.color}/>
            </div>
            <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-lg mb-3">Service Dependencies</h2>
          {deps.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center">
              <p className="text-gray-500">No dependency records. Pinger worker will populate this.</p>
            </div>
          ) : deps.map(dep => (
            <div key={dep.id} className={`border rounded-2xl p-4 mb-3 ${getStatusColor(dep.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(dep.status)}
                  <div>
                    <p className="font-bold">{dep.service_name || dep.name}</p>
                    <p className="text-xs text-gray-500">
                      Last checked: {dep.last_checked ? new Date(dep.last_checked).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold uppercase ${dep.status === 'healthy' || dep.status === 'up' ? 'text-green-500' : dep.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {dep.status || 'unknown'}
                  </span>
                  {dep.response_time_ms && <p className="text-xs text-gray-400">{dep.response_time_ms}ms</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">System Events</h2>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Zap size={32} className="text-gray-300 mx-auto mb-2"/>
                <p className="text-gray-500 text-sm">No system events recorded yet</p>
              </div>
            ) : events.map(event => (
              <div key={event.id} className="flex items-start gap-3 py-2 border-b border-[var(--card-border)] last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  event.severity === 'critical' ? 'bg-red-500' :
                  event.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.event_type || event.message}</p>
                  <p className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}