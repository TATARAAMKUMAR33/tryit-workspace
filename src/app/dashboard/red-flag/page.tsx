'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertOctagon, RefreshCw, Clock, Users, ShieldAlert } from 'lucide-react';

export default function RedFlagDashboard() {
  const [flags, setFlags] = useState<any>({ slas: 0, risks: 0, stale: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFlags() {
      const [sla, risk, stale] = await Promise.all([
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open').lt('sla_deadline', new Date().toISOString()),
        supabase.from('risk_alerts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done').lt('updated_at', new Date(Date.now() - 7 * 86400000).toISOString())
      ]);
      setFlags({ slas: sla.count || 0, risks: risk.count || 0, stale: stale.count || 0 });
      setLoading(false);
    }
    fetchFlags();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-up">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-red-600 mb-2 flex items-center justify-center gap-3"><AlertOctagon size={36} /> RED FLAG DASHBOARD</h1>
        <p className="text-gray-500">Aggregate view of everything that needs your immediate attention.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center shadow-sm">
          <Clock className="text-red-500 mx-auto mb-3" size={32} />
          <h2 className="text-4xl font-bold text-red-600">{flags.slas}</h2>
          <p className="text-sm font-bold text-red-800 uppercase mt-2">SLA Breaches</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl text-center shadow-sm">
          <ShieldAlert className="text-orange-500 mx-auto mb-3" size={32} />
          <h2 className="text-4xl font-bold text-orange-600">{flags.risks}</h2>
          <p className="text-sm font-bold text-orange-800 uppercase mt-2">Pending Risk Alerts</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-3xl text-center shadow-sm">
          <Users className="text-yellow-500 mx-auto mb-3" size={32} />
          <h2 className="text-4xl font-bold text-yellow-600">{flags.stale}</h2>
          <p className="text-sm font-bold text-yellow-800 uppercase mt-2">Dead Letter Tasks (7+ Days)</p>
        </div>
      </div>
    </div>
  );
}
