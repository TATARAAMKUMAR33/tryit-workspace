'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flag, RefreshCw, CheckCircle2, XCircle, Eye, Search, AlertTriangle } from 'lucide-react';

export default function Moderation() {
  const [reports, setReports] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('reports');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ incident_type: 'paper_leak', severity: 'high', description: '', affected_exam: '' });
  const user = localStorage.getItem('tryit_user') || '';

  const fetchData = async () => {
    setLoading(true);
    const [r, i] = await Promise.all([
      supabase.from('bharat_pulse').select('*').gt('report_count', 0).order('report_count', { ascending: false }),
      supabase.from('security_incidents').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    if (r.data) setReports(r.data);
    if (i.data) setIncidents(i.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const moderatePost = async (id: string, action: 'remove' | 'clear') => {
    if (action === 'remove') {
      await supabase.from('bharat_pulse').delete().eq('id', id);
      await supabase.from('audit_logs').insert([{ user_email: user, action: 'POST_REMOVED', details: { post_id: id } }]);
    } else {
      await supabase.from('bharat_pulse').update({ report_count: 0 }).eq('id', id);
    }
    fetchData();
  };

  const createIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('security_incidents').insert([{ ...incidentForm, reported_by: user }]);
    setIncidentForm({ incident_type: 'paper_leak', severity: 'high', description: '', affected_exam: '' });
    setShowIncidentForm(false);
    fetchData();
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    await supabase.from('security_incidents').update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', id);
    fetchData();
  };

  const filtered = reports.filter(r => !search || r.content?.toLowerCase().includes(search.toLowerCase()) || r.author_email?.includes(search));

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-amber-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Flag className="text-amber-500" size={32}/> Trust & Safety</h1>
          <p className="text-gray-500">{reports.length} reported posts · {incidents.filter(i => i.status === 'investigating').length} active incidents</p>
        </div>
        <button onClick={() => setShowIncidentForm(!showIncidentForm)} className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
          <AlertTriangle size={18}/> Log Incident
        </button>
      </div>

      {showIncidentForm && (
        <div className="bg-[var(--card-bg)] border border-red-500/30 rounded-2xl p-6">
          <h2 className="font-bold mb-4 text-red-500">Log Security Incident</h2>
          <form onSubmit={createIncident} className="grid grid-cols-2 gap-4">
            <select value={incidentForm.incident_type} onChange={e => setIncidentForm(p => ({ ...p, incident_type: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="paper_leak">Question Paper Leak</option>
              <option value="data_breach">Data Breach</option>
              <option value="unauthorized_access">Unauthorized Access</option>
              <option value="cheating_organized">Organized Cheating</option>
              <option value="impersonation">Impersonation</option>
            </select>
            <select value={incidentForm.severity} onChange={e => setIncidentForm(p => ({ ...p, severity: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input placeholder="Affected exam (optional)" value={incidentForm.affected_exam}
              onChange={e => setIncidentForm(p => ({ ...p, affected_exam: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"/>
            <div/>
            <textarea required placeholder="Describe the incident *" value={incidentForm.description}
              onChange={e => setIncidentForm(p => ({ ...p, description: e.target.value }))}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 resize-none h-24"/>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl">Log Incident</button>
              <button type="button" onClick={() => setShowIncidentForm(false)} className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { id: 'reports', label: `Reported Posts (${reports.length})` },
          { id: 'incidents', label: `Security Incidents (${incidents.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? 'bg-amber-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reports' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reported posts..."
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500"/>
          </div>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
                <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
                <p className="font-bold">No reported posts</p>
              </div>
            ) : filtered.map(post => (
              <div key={post.id} className="bg-[var(--card-bg)] border border-orange-500/30 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-orange-500/10 text-orange-500 px-2 py-1 rounded">{post.report_count} reports</span>
                      <span className="text-xs text-gray-500">{post.author_email} · {post.author_role}</span>
                    </div>
                    <p className="text-sm">{post.content}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => moderatePost(post.id, 'clear')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold">
                      <CheckCircle2 size={14}/> Clear
                    </button>
                    <button onClick={() => moderatePost(post.id, 'remove')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg text-xs font-bold">
                      <XCircle size={14}/> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
              <p className="font-bold">No security incidents logged</p>
            </div>
          ) : incidents.map(inc => (
            <div key={inc.id} className={`bg-[var(--card-bg)] border rounded-2xl p-5 ${
              inc.status === 'investigating' ? 'border-red-500/30' : 'border-[var(--card-border)]'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      inc.severity === 'critical' ? 'bg-red-500 text-white' :
                      inc.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>{inc.severity.toUpperCase()}</span>
                    <span className="text-xs font-bold text-gray-600">{inc.incident_type.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className={`text-xs font-bold ${inc.status === 'resolved' ? 'text-green-500' : 'text-red-500'}`}>{inc.status}</span>
                  </div>
                  <p className="text-sm">{inc.description}</p>
                  {inc.affected_exam && <p className="text-xs text-gray-500 mt-1">Exam: {inc.affected_exam}</p>}
                  <p className="text-xs text-gray-400 mt-1">Reported by {inc.reported_by} · {new Date(inc.created_at).toLocaleString()}</p>
                </div>
                {inc.status === 'investigating' && (
                  <button onClick={() => updateIncidentStatus(inc.id, 'resolved')}
                    className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold shrink-0">
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}