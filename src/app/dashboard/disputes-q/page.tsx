'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flag, RefreshCw, CheckCircle2, XCircle, Eye, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function QuestionDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('question_disputes').select('*, questions(question_text, subject_id, level)').order('created_at', { ascending: false });
    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    const { data } = await q;
    if (data) setDisputes(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const resolve = async (id: string, action: 'resolved' | 'dismissed') => {
    await supabase.from('question_disputes').update({
      status: action, resolved_by: user,
      resolution, resolved_at: new Date().toISOString()
    }).eq('id', id);
    if (action === 'resolved' && selected?.question_id) {
      await supabase.from('questions').update({ verified: false, reject_reason: resolution }).eq('id', selected.question_id);
    }
    await supabase.from('audit_logs').insert([{
      user_email: user, action: `DISPUTE_${action.toUpperCase()}`,
      details: { dispute_id: id, resolution }
    }]);
    setSelected(null); setResolution('');
    fetchData();
  };

  const DISPUTE_TYPES = ['wrong_answer','outdated','duplicate','language_error','factual_error','copyright_violation'];
  const typeColor = (t: string) => ({
    wrong_answer: 'text-red-500 bg-red-500/10',
    outdated: 'text-orange-500 bg-orange-500/10',
    duplicate: 'text-yellow-500 bg-yellow-500/10',
    factual_error: 'text-red-600 bg-red-600/10',
    language_error: 'text-blue-500 bg-blue-500/10',
    copyright_violation: 'text-purple-500 bg-purple-500/10',
  }[t] || 'text-gray-500 bg-gray-500/10');

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Flag className="text-red-500" size={32}/> Question Disputes</h1>
          <p className="text-gray-500">{disputes.filter(d => d.status === 'open').length} open disputes needing review</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(disputes, 'TryIT_Disputes')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
            <RefreshCw size={18}/>
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {['open','resolved','dismissed','all'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${filterStatus === s ? 'bg-red-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {s}
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-6 max-w-lg w-full">
            <h2 className="font-bold text-lg mb-4">Resolve Dispute</h2>
            <div className="bg-[var(--card-bg)] rounded-xl p-4 mb-4 text-sm">
              <p className="font-bold">{selected.dispute_type?.replace(/_/g,' ').toUpperCase()}</p>
              <p className="text-gray-500 mt-1">{selected.description}</p>
              {selected.questions?.question_text && (
                <p className="text-xs text-gray-400 mt-2 border-t border-[var(--card-border)] pt-2">
                  Question: {selected.questions.question_text?.substring(0, 150)}...
                </p>
              )}
            </div>
            <textarea value={resolution} onChange={e => setResolution(e.target.value)}
              placeholder="Resolution note (required)..." rows={3}
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none mb-4 resize-none"/>
            <div className="flex gap-3">
              <button onClick={() => resolve(selected.id, 'resolved')} disabled={!resolution.trim()}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircle2 size={16}/> Resolve (Pull Question)
              </button>
              <button onClick={() => resolve(selected.id, 'dismissed')} disabled={!resolution.trim()}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                <XCircle size={16}/> Dismiss
              </button>
              <button onClick={() => setSelected(null)} className="px-4 bg-red-500/10 text-red-500 font-bold rounded-xl">✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {disputes.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
            <p className="font-bold">No {filterStatus} disputes</p>
          </div>
        ) : disputes.map(d => (
          <div key={d.id} className={`bg-[var(--card-bg)] border rounded-2xl p-5 flex items-start justify-between gap-4 ${d.status === 'open' ? 'border-red-500/20' : 'border-[var(--card-border)]'}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${typeColor(d.dispute_type)}`}>
                  {d.dispute_type?.replace(/_/g,' ').toUpperCase()}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  d.status === 'open' ? 'bg-yellow-500/10 text-yellow-600' :
                  d.status === 'resolved' ? 'bg-green-500/10 text-green-500' :
                  'bg-gray-500/10 text-gray-500'}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-sm font-medium">{d.description || 'No description'}</p>
              <p className="text-xs text-gray-400 mt-1">
                Reported by {d.reported_by?.split('@')[0]} · {new Date(d.created_at).toLocaleDateString('en-IN')}
              </p>
              {d.questions?.question_text && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">Q: {d.questions.question_text}</p>
              )}
              {d.resolution && <p className="text-xs text-green-500 mt-1">Resolution: {d.resolution}</p>}
            </div>
            {d.status === 'open' && (
              <button onClick={() => setSelected(d)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-sm font-bold shrink-0 transition-colors">
                <Eye size={14}/> Review
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}