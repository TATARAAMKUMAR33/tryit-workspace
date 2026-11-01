'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, UserX, 
  Search, Activity, RefreshCw, Zap, EyeOff
} from 'lucide-react';

type RiskType = {
  id: string;
  entity_email: string;
  entity_role: string;
  risk_type: string;
  risk_score: number;
  status: 'pending' | 'investigating' | 'cleared' | 'banned';
  details: string;
  created_at: string;
};

export default function RiskRadar() {
  const [alerts, setAlerts] = useState<RiskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('risk_alerts')
      .select('*')
      .order('risk_score', { ascending: false }); // Show highest risk first
    
    if (data) setAlerts(data as RiskType[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAction = async (id: string, email: string, newStatus: 'cleared' | 'banned' | 'investigating') => {
    if (newStatus === 'banned' && !confirm(`Are you sure you want to freeze/ban ${email}?`)) return;

    // 1. Update the alert status
    await supabase.from('risk_alerts').update({ status: newStatus }).eq('id', id);

    // 2. If banned, actually ban them in the user_bans table
    if (newStatus === 'banned') {
      await supabase.from('user_bans').upsert([{ 
        user_email: email, 
        reason: 'Banned via Risk Radar due to anomalous behavior.', 
        ban_type: 'permanent' 
      }], { onConflict: 'user_email' });
    }

    // 3. Log the action for your Audit Trail
    await supabase.from('audit_logs').insert([{
      user_email: localStorage.getItem('tryit_user') || 'admin',
      action: newStatus === 'banned' ? 'RISK_BAN' : 'RISK_CLEAR',
      details: { target_user: email, alert_id: id }
    }]);

    fetchAlerts();
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 50) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'banned') return <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">BANNED</span>;
    if (status === 'cleared') return <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">CLEARED</span>;
    if (status === 'investigating') return <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">INVESTIGATING</span>;
    return <span className="text-xs font-bold text-gray-500 bg-gray-500/10 px-2 py-1 rounded">PENDING</span>;
  };

  const filteredAlerts = alerts.filter(a => 
    a.entity_email.toLowerCase().includes(search.toLowerCase()) || 
    a.risk_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} /> Risk Radar
          </h1>
          <p className="text-gray-500">Detect fraud, AI-farming, and anomalous user behavior.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search email or risk type..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 w-64"
            />
          </div>
          <button onClick={fetchAlerts} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-gray-500/10 text-gray-500 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--foreground)]">All Clear</h3>
            <p className="text-gray-500">No risk alerts found matching your search.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div key={alert.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-red-500/30 transition-colors">
              
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-xl border ${getRiskColor(alert.risk_score)}`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-[var(--foreground)]">{alert.entity_email}</h3>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded">{alert.entity_role}</span>
                    {getStatusBadge(alert.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{alert.details}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-red-500 uppercase tracking-wider">{alert.risk_type.replace('_', ' ')}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">Risk Score: <strong className={alert.risk_score >= 80 ? 'text-red-500' : 'text-orange-500'}>{alert.risk_score}/100</strong></span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 md:border-l border-[var(--card-border)] md:pl-6">
                {alert.status !== 'cleared' && alert.status !== 'banned' && (
                  <>
                    <button onClick={() => handleAction(alert.id, alert.entity_email, 'cleared')} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-sm font-bold transition-colors">
                      <CheckCircle2 size={16} /> Clear Flag
                    </button>
                    <button onClick={() => handleAction(alert.id, alert.entity_email, 'banned')} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-red-500/20">
                      <UserX size={16} /> Freeze Account
                    </button>
                  </>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
