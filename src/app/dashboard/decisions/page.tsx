'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function DecisionsLog() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ decision_title: '', decision_body: '', category: 'general', impact_level: 'low', review_date: '' });
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('decisions_log').select('*').order('created_at', { ascending: false });
    if (data) setDecisions(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('decisions_log').insert([{ ...form, decided_by: user }]);
    setForm({ decision_title: '', decision_body: '', category: 'general', impact_level: 'low', review_date: '' });
    setShowForm(false);
    fetchData();
  };

  const impactColor = (level: string) => {
    if (level === 'critical') return 'text-red-500 bg-red-500/10';
    if (level === 'high') return 'text-orange-500 bg-orange-500/10';
    if (level === 'medium') return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><BookOpen className="text-blue-500" size={32}/> Decisions Log</h1>
          <p className="text-gray-500">Record key decisions for transparency and future reference.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(decisions, 'TryIT_Decisions')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={18}/> Log Decision
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <input required placeholder="Decision title *" value={form.decision_title} onChange={e => setForm(p => ({ ...p, decision_title: e.target.value }))}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
            <textarea required placeholder="Decision details and rationale *" value={form.decision_body} onChange={e => setForm(p => ({ ...p, decision_body: e.target.value }))}
              rows={4} className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"/>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="general">General</option>
              <option value="product">Product</option>
              <option value="hiring">Hiring</option>
              <option value="finance">Finance</option>
              <option value="policy">Policy</option>
              <option value="technical">Technical</option>
              <option value="partnership">Partnership</option>
            </select>
            <select value={form.impact_level} onChange={e => setForm(p => ({ ...p, impact_level: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="low">Low Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="high">High Impact</option>
              <option value="critical">Critical Impact</option>
            </select>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Review Date (optional)</label>
              <input type="date" value={form.review_date} onChange={e => setForm(p => ({ ...p, review_date: e.target.value }))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl">Log Decision</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl py-2.5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {decisions.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <BookOpen size={40} className="text-gray-300 mx-auto mb-3"/>
            <p className="font-bold">No decisions logged yet</p>
            <p className="text-gray-500 text-sm">Start logging key decisions for institutional memory</p>
          </div>
        ) : decisions.map(d => (
          <div key={d.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${impactColor(d.impact_level)}`}>{d.impact_level}</span>
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded capitalize">{d.category}</span>
                {d.review_date && new Date(d.review_date) < new Date() && (
                  <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle size={10}/> Review overdue
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{new Date(d.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <h2 className="font-bold text-lg mb-2">{d.decision_title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{d.decision_body}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--card-border)]">
              <span className="text-xs text-gray-400">Decided by: <span className="font-bold">{d.decided_by?.split('@')[0]}</span></span>
              {d.review_date && <span className="text-xs text-gray-400">Review by: <span className="font-bold">{new Date(d.review_date).toLocaleDateString('en-IN')}</span></span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}