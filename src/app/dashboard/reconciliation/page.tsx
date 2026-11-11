'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Scale, RefreshCw, Plus, Download, AlertTriangle, CheckCircle2, IndianRupee } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function FinancialReconciliation() {
  const [records, setRecords] = useState<any[]>([]);
  const [leakage, setLeakage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [computing, setComputing] = useState(false);
  const [liveStats, setLiveStats] = useState({ revenue: 0, refunds: 0, payouts: 0 });
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const [rec, leak, rev, ref, pay] = await Promise.all([
      supabase.from('financial_reconciliation').select('*').order('created_at', { ascending: false }).limit(12),
      supabase.from('revenue_leakage_alerts').select('*').limit(20),
      supabase.from('invoices').select('amount').eq('status', 'paid').gte('created_at', monthStart),
      supabase.from('refund_requests').select('amount').eq('status', 'approved').gte('created_at', monthStart),
      supabase.from('mentor_wallets').select('balance'),
    ]);
    if (rec.data) setRecords(rec.data);
    if (leak.data) setLeakage(leak.data);
    if (rev.data) setLiveStats(prev => ({ ...prev, revenue: rev.data.reduce((s: number, i: any) => s + Number(i.amount), 0) }));
    if (ref.data) setLiveStats(prev => ({ ...prev, refunds: ref.data.reduce((s: number, r: any) => s + Number(r.amount || 0), 0) }));
    if (pay.data) setLiveStats(prev => ({ ...prev, payouts: pay.data.reduce((s: number, p: any) => s + Number(p.balance || 0), 0) }));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const computeReconciliation = async () => {
    setComputing(true);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = today.toISOString().split('T')[0];
    const net = liveStats.revenue - liveStats.refunds - liveStats.payouts;

    await supabase.from('financial_reconciliation').insert([{
      period_start: monthStart,
      period_end: monthEnd,
      total_revenue: liveStats.revenue,
      total_refunds: liveStats.refunds,
      total_payouts: liveStats.payouts,
      net_revenue: net,
      discrepancy_amount: 0,
      reconciled_by: user,
      status: 'completed'
    }]);
    await supabase.from('audit_logs').insert([{
      user_email: user, action: 'RECONCILIATION_RUN',
      details: { revenue: liveStats.revenue, net }
    }]);
    setComputing(false);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-green-500" size={40}/></div>;

  const net = liveStats.revenue - liveStats.refunds - liveStats.payouts;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Scale className="text-green-500" size={32}/> Financial Reconciliation</h1>
          <p className="text-gray-500">Monthly revenue vs payouts vs refunds. {leakage.length} leakage alerts.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(records, 'TryIT_Reconciliation')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={computeReconciliation} disabled={computing}
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            <Scale size={18}/> {computing ? 'Computing...' : 'Run Reconciliation'}
          </button>
        </div>
      </div>

      {/* This Month Live */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4">This Month — Live Numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Revenue', value: liveStats.revenue, color: 'text-green-500' },
            { label: 'Refunds', value: liveStats.refunds, color: 'text-red-500' },
            { label: 'Mentor Payouts', value: liveStats.payouts, color: 'text-orange-500' },
            { label: 'Net Revenue', value: net, color: net >= 0 ? 'text-blue-500' : 'text-red-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-[var(--background)] rounded-2xl p-5 text-center">
              <IndianRupee size={16} className={`mx-auto mb-1 ${stat.color}`}/>
              <div className={`text-2xl font-black ${stat.color}`}>₹{stat.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Leakage Alerts */}
      {leakage.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-orange-500/30 rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-orange-500">
            <AlertTriangle size={18}/> Revenue Leakage Alerts ({leakage.length})
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {leakage.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl text-sm">
                <div>
                  <p className="font-bold text-orange-600">{alert.alert_type}</p>
                  <p className="text-xs text-gray-500">{alert.email} · Plan: {alert.plan}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${alert.severity === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600'}`}>
                  {alert.severity?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Records */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--card-border)]">
          <h2 className="font-bold">Reconciliation History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                {['Period', 'Revenue', 'Refunds', 'Payouts', 'Net', 'Discrepancy', 'Status', 'By'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No reconciliation runs yet. Click Run Reconciliation.</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                  <td className="px-4 py-3 font-medium">{r.period_start} → {r.period_end}</td>
                  <td className="px-4 py-3 text-green-500 font-bold">₹{Number(r.total_revenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">₹{Number(r.total_refunds).toLocaleString()}</td>
                  <td className="px-4 py-3 text-orange-500">₹{Number(r.total_payouts).toLocaleString()}</td>
                  <td className={`px-4 py-3 font-black ${Number(r.net_revenue) >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    ₹{Number(r.net_revenue).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {Number(r.discrepancy_amount) > 0
                      ? <span className="text-red-500 font-bold">₹{Number(r.discrepancy_amount).toLocaleString()}</span>
                      : <span className="text-green-500">✓ None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{r.reconciled_by?.split('@')[0] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}