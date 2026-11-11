'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Plus, RefreshCw, CheckCircle2, TrendingUp, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

const METRICS = [
  { key: 'tickets_resolved_per_day', label: 'Tickets Resolved/Day', role: 'crm_agent' },
  { key: 'questions_reviewed_per_day', label: 'Questions Reviewed/Day', role: 'qa_agent' },
  { key: 'doubts_answered_per_day', label: 'Doubts Answered/Day', role: 'mentor' },
  { key: 'sla_compliance_pct', label: 'SLA Compliance %', role: 'crm_agent' },
  { key: 'kb_articles_per_week', label: 'KB Articles/Week', role: 'content_lead' },
  { key: 'leave_approvals_per_day', label: 'Leave Approvals/Day', role: 'hr' },
];

export default function StaffTargets() {
  const [targets, setTargets] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_email: '', metric_name: METRICS[0].key, target_value: '', period: 'daily' });
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    const [t, s, sc] = await Promise.all([
      supabase.from('staff_targets').select('*').order('created_at', { ascending: false }),
      supabase.from('staff_roles').select('user_email, role').eq('is_active', true),
      supabase.from('staff_scorecards').select('*'),
    ]);
    if (t.data) setTargets(t.data);
    if (s.data) setStaff(s.data);
    if (sc.data) setScorecards(sc.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('staff_targets').upsert([{
      ...form,
      target_value: Number(form.target_value),
      set_by: user,
      valid_from: new Date().toISOString().split('T')[0]
    }], { onConflict: 'user_email,metric_name,valid_from' });
    setForm({ user_email: '', metric_name: METRICS[0].key, target_value: '', period: 'daily' });
    setShowForm(false);
    fetchData();
  };

  const getActual = (email: string, metric: string) => {
    const sc = scorecards.find(s => s.user_email === email);
    if (!sc) return 0;
    if (metric === 'tickets_resolved_per_day') return sc.tickets_today || 0;
    if (metric === 'questions_reviewed_per_day') return sc.tickets_today || 0;
    return 0;
  };

  const getPct = (actual: number, target: number) => target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Target className="text-blue-500" size={32}/> Staff Targets</h1>
          <p className="text-gray-500">{targets.length} active targets across {new Set(targets.map(t => t.user_email)).size} staff members</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(targets, 'TryIT_Staff_Targets')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={18}/> Set Target
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select required value={form.user_email} onChange={e => setForm(p => ({ ...p, user_email: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="">Select staff...</option>
              {staff.map(s => <option key={s.user_email} value={s.user_email}>{s.user_email.split('@')[0]} ({s.role.replace('_',' ')})</option>)}
            </select>
            <select value={form.metric_name} onChange={e => setForm(p => ({ ...p, metric_name: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <input required type="number" placeholder="Target value *" value={form.target_value}
              onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            <select value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="col-span-2 md:col-span-4 flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl">Set Target</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {targets.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <Target size={40} className="text-gray-300 mx-auto mb-3"/>
            <p className="font-bold">No targets set yet</p>
            <p className="text-gray-500 text-sm">Set daily/weekly targets for each staff member</p>
          </div>
        ) : targets.map(t => {
          const actual = getActual(t.user_email, t.metric_name);
          const pct = getPct(actual, t.target_value);
          const metric = METRICS.find(m => m.key === t.metric_name);
          return (
            <div key={t.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold">{t.user_email.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{metric?.label || t.metric_name} · {t.period}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black ${pct >= 100 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {actual} / {t.target_value}
                  </p>
                  <p className="text-xs text-gray-400">{pct}% of target</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, pct)}%` }}/>
              </div>
              {pct >= 100 && <p className="text-xs text-green-500 font-bold mt-1">✓ Target achieved!</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}