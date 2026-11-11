'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertOctagon, Plus, RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function ExamIncidents() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    exam_name: '', incident_type: 'server_slow',
    severity: 'medium', students_affected: '',
    description: '', action_taken: ''
  });
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('exam_incidents').select('*').order('created_at', { ascending: false });
    if (data) setIncidents(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('exam_incidents').insert([{
      ...form,
      students_affected: parseInt(form.students_affected) || 0,
      reported_by: user
    }]);
    await supabase.from('audit_logs').insert([{
      user_email: user, action: 'EXAM_INCIDENT_LOGGED',
      details: { exam: form.exam_name, severity: form.severity }
    }]);
    setForm({ exam_name: '', incident_type: 'server_slow', severity: 'medium', students_affected: '', description: '', action_taken: '' });
    setShowForm(false);
    fetchData();
  };

  const resolve = async (id: string) => {
    await supabase.from('exam_incidents').update({ resolved: true }).eq('id', id);
    fetchData();
  };

  const severityColor = (s: string) => ({
    low: 'text-green-500 bg-green-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    critical: 'text-red-500 bg-red-500/10',
  }[s] || 'text-gray-500 bg-gray-500/10');

  const openCount = incidents.filter(i => !i.resolved).length;

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-orange-500" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><AlertOctagon className="text-orange-500" size={32}/> Exam Incidents</h1>
          <p className="text-gray-500">{openCount} unresolved · {incidents.length} total logged</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(incidents, 'TryIT_Incidents')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={18}/> Log Incident
          </button>
        </div>
      </div>

      {openCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertOctagon className="text-red-500 animate-pulse shrink-0" size={20}/>
          <span className="font-bold text-red-500">{openCount} unresolved exam incident{openCount > 1 ? 's' : ''} — action required</span>
        </div>
      )}

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <input required placeholder="Exam name *" value={form.exam_name}
              onChange={e => setForm(p => ({ ...p, exam_name: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"/>
            <select value={form.incident_type} onChange={e => setForm(p => ({ ...p, incident_type: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="server_slow">Server Slow</option>
              <option value="question_error">Question Error</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="mass_complaint">Mass Complaint</option>
              <option value="anti_cheat_trigger">Anti-Cheat Triggered</option>
              <option value="exam_cancelled">Exam Cancelled</option>
              <option value="data_loss">Data Loss</option>
            </select>
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input type="number" placeholder="Students affected" value={form.students_affected}
              onChange={e => setForm(p => ({ ...p, students_affected: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            <textarea required placeholder="What happened? *" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"/>
            <textarea placeholder="Action taken so far" value={form.action_taken}
              onChange={e => setForm(p => ({ ...p, action_taken: e.target.value }))} rows={2}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"/>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl">Log Incident</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
            <p className="font-bold">No incidents logged</p>
            <p className="text-gray-500 text-sm">Log incidents when exam-day issues occur for future reference</p>
          </div>
        ) : incidents.map(inc => (
          <div key={inc.id} className={`bg-[var(--card-bg)] border rounded-2xl p-5 ${!inc.resolved ? 'border-orange-500/20' : 'border-[var(--card-border)]'} ${inc.resolved ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${severityColor(inc.severity)}`}>
                    {inc.severity?.toUpperCase()}
                  </span>
                  <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded capitalize">
                    {inc.incident_type?.replace(/_/g,' ')}
                  </span>
                  {inc.resolved && <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">✓ Resolved</span>}
                </div>
                <p className="font-bold">{inc.exam_name}</p>
                <p className="text-sm text-gray-500 mt-1">{inc.description}</p>
                {inc.action_taken && <p className="text-xs text-blue-400 mt-1">Action: {inc.action_taken}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  {inc.students_affected > 0 && <span>👥 {inc.students_affected} students affected</span>}
                  <span>{new Date(inc.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                  <span>by {inc.reported_by?.split('@')[0]}</span>
                </div>
              </div>
              {!inc.resolved && (
                <button onClick={() => resolve(inc.id)}
                  className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-sm font-bold shrink-0 transition-colors">
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}