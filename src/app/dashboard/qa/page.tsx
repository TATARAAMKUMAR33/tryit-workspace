'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CheckSquare, RefreshCw, CheckCircle2, XCircle,
  Search, Filter, ChevronDown, ChevronUp,
  AlertTriangle, Eye, Download, Zap
} from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function QAInspector() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, myApproved: 0, myRejected: 0 });
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchQuestions = async () => {
    setLoading(true);
    let q = supabase.from('questions').select('*')
  .order('created_at', { ascending: false })
  .limit(100);

  if (filterStatus === 'verified') q = q.eq('verified', true);
  if (filterStatus === 'pending') q = q.eq('verified', false);

    const [{ data }, subData, myStats] = await Promise.all([
  q,
  supabase.from('questions').select('subject_id').limit(1000),
      supabase.from('qa_votes').select('id, vote')
        .eq('voter_email', user)
        .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    ]);

    if (data) setQuestions(data);

    if (subData.data) {
      const unique = [...new Set(subData.data.map(s => s.subject).filter(Boolean))];
      setSubjects(unique as string[]);
    }

    if (myStats.data) {
      setStats({
        total: data?.length || 0,
        myApproved: myStats.data.filter(v => v.vote === 'approve').length,
        myRejected: myStats.data.filter(v => v.vote === 'reject').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [filterSubject, filterLevel]);

  const approve = async (id: string) => {
    await supabase.from('questions').update({ verified: true, verified_by: user, verified_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('qa_votes').insert([{ question_id: id, voter_email: user, vote: 'approve' }]);
    await supabase.from('staff_sessions').insert([{ user_email: user, event_type: 'qa_approve', notes: id }]);
    setQuestions(prev => prev.filter(q => q.id !== id));
    setSelected(prev => prev.filter(s => s !== id));
    setStats(prev => ({ ...prev, myApproved: prev.myApproved + 1, total: prev.total - 1 }));
  };

  const reject = async (id: string, reason: string) => {
    await supabase.from('questions').update({
      verified: false,
      reject_reason: reason,
      rejected_by: user,
      rejected_at: new Date().toISOString()
    }).eq('id', id);
    await supabase.from('qa_votes').insert([{ question_id: id, voter_email: user, vote: 'reject', reason }]);
    setQuestions(prev => prev.filter(q => q.id !== id));
    setSelected(prev => prev.filter(s => s !== id));
    setRejectingId(null);
    setRejectReason('');
    setStats(prev => ({ ...prev, myRejected: prev.myRejected + 1, total: prev.total - 1 }));
  };

  const bulkApprove = async () => {
    if (selected.length === 0) return;
    setBulkProcessing(true);
    for (const id of selected) await approve(id);
    setSelected([]);
    setBulkProcessing(false);
  };

  const bulkReject = async () => {
    if (selected.length === 0) return;
    const reason = prompt('Rejection reason for all selected questions:');
    if (!reason) return;
    setBulkProcessing(true);
    for (const id of selected) await reject(id, reason);
    setSelected([]);
    setBulkProcessing(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(filtered.map(q => q.id));
  };

  const filtered = questions.filter(q =>
    !search ||
    q.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.question_text?.toLowerCase().includes(search.toLowerCase()) ||
    q.id?.toLowerCase().includes(search.toLowerCase())
  );

  const getLevelLabel = (level: number) => {
    if (level <= 3) return { label: 'Easy', color: 'text-green-500 bg-green-500/10' };
    if (level <= 6) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-500/10' };
    return { label: 'Hard', color: 'text-red-500 bg-red-500/10' };
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-purple-500" size={40}/>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CheckSquare className="text-purple-500" size={32}/> QA Inspector
          </h1>
          <p className="text-gray-500">
            {stats.total} pending · Today: {stats.myApproved} approved · {stats.myRejected} rejected by you
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(filtered, 'TryIT_QA_Queue')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchQuestions}
            className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Queue', value: stats.total, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'You Approved Today', value: stats.myApproved, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'You Rejected Today', value: stats.myRejected, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-5 text-center`}>
            <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject, question text, or ID..."
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none"/>
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="all">All Subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="all">All Levels</option>
          {[1,2,3,4,5,6,7,8,9,10].map(l => <option key={l} value={l}>Level {l}</option>)}
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between">
          <span className="font-bold text-purple-600">{selected.length} question{selected.length > 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button onClick={selectAll} className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs font-bold">
              Select All ({filtered.length})
            </button>
            <button onClick={bulkApprove} disabled={bulkProcessing}
              className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50">
              <CheckCircle2 size={14}/> {bulkProcessing ? 'Processing...' : `Approve All (${selected.length})`}
            </button>
            <button onClick={bulkReject} disabled={bulkProcessing}
              className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50">
              <XCircle size={14}/> Reject All ({selected.length})
            </button>
            <button onClick={() => setSelected([])} className="px-3 py-1.5 bg-gray-500/10 text-gray-500 rounded-xl text-xs font-bold">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-6 max-w-md w-full">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <XCircle size={18} className="text-red-500"/> Reject Question
            </h2>
            <p className="text-xs text-gray-500 mb-3">Question ID: {rejectingId.substring(0, 16)}...</p>
            <div className="space-y-2 mb-4">
              {['Factually incorrect', 'Poor question quality', 'Duplicate question', 'Wrong subject/topic', 'Answer explanation missing', 'Language issues'].map(reason => (
                <button key={reason} onClick={() => setRejectReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${rejectReason === reason ? 'bg-red-500/10 border border-red-500/30 text-red-600 font-bold' : 'bg-[var(--card-bg)] border border-[var(--card-border)]'}`}>
                  {reason}
                </button>
              ))}
              <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Or type custom reason..."
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => reject(rejectingId, rejectReason)} disabled={!rejectReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
                Confirm Reject
              </button>
              <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-16 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4"/>
            <h2 className="text-xl font-bold mb-2">Queue is Clear!</h2>
            <p className="text-gray-500">All questions have been reviewed. Great work.</p>
          </div>
        ) : filtered.map(q => {
          const isExpanded = expanded === q.id;
          const isSelected = selected.includes(q.id);
          const level = getLevelLabel(q.level || 5);
          return (
            <div key={q.id}
              className={`bg-[var(--card-bg)] border rounded-2xl overflow-hidden transition-all ${isSelected ? 'border-purple-500/50 bg-purple-500/5' : 'border-[var(--card-border)]'}`}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(q.id)}
                    className="mt-1 w-4 h-4 rounded accent-purple-500 cursor-pointer shrink-0"/>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {(q.subject_name || q.subject_id) && (
              <span className="text-xs font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
               {q.subject_name || q.subject_id}
               </span>
               )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${level.color}`}>
                        {level.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {q.id.substring(0, 12)}...
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(q.created_at).toLocaleDateString('en-IN')}
                      </span>
                      {q.language_code && q.language_code !== 'en' && (
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded uppercase font-bold">
                          {q.language_code}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium leading-relaxed line-clamp-2">
                      {q.question_text || 'No question text available'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpanded(isExpanded ? null : q.id)}
                      className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-colors"
                      title="Preview full question">
                      {isExpanded ? <ChevronUp size={16}/> : <Eye size={16}/>}
                    </button>
                    <button onClick={() => approve(q.id)}
                      className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5">
                      <CheckCircle2 size={14}/> Approve
                    </button>
                    <button onClick={() => { setRejectingId(q.id); setRejectReason(''); }}
                      className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5">
                      <XCircle size={14}/> Reject
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-[var(--card-border)] pt-4 space-y-3">
                    {q.question_text && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Full Question</p>
                        <p className="text-sm bg-[var(--background)] rounded-xl p-3">{q.question_text}</p>
                      </div>
                    )}

                    {/* Options */}
                    {(q.option_a || q.options) && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Options</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.option_a && ['option_a','option_b','option_c','option_d'].map((opt, idx) => (
                            <div key={opt} className={`text-sm p-2 rounded-xl border ${
                              q.correct_answer === String.fromCharCode(65+idx).toLowerCase()
                                ? 'bg-green-500/10 border-green-500/40 font-bold text-green-700'
                                : 'bg-[var(--background)] border-[var(--card-border)]'
                            }`}>
                              <span className="font-bold mr-2">{String.fromCharCode(65+idx)}.</span>
                              {q[opt]}
                              {q.correct_answer === String.fromCharCode(65+idx).toLowerCase() && (
                                <span className="ml-1 text-green-500">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Explanation</p>
                        <p className="text-sm bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">{q.explanation}</p>
                      </div>
                    )}

                    {q.hint && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Hint</p>
                        <p className="text-sm text-gray-600 bg-[var(--background)] rounded-xl p-3">{q.hint}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {q.syllabus_version && <div className="bg-[var(--background)] rounded-xl p-2"><span className="text-gray-400">Syllabus: </span><span className="font-bold">{q.syllabus_version}</span></div>}
                      {q.quality_score && <div className="bg-[var(--background)] rounded-xl p-2"><span className="text-gray-400">Quality: </span><span className="font-bold">{Math.round(q.quality_score * 100)}%</span></div>}
                      {q.generated_by && <div className="bg-[var(--background)] rounded-xl p-2 truncate"><span className="text-gray-400">Source: </span><span className="font-bold">{q.generated_by.split('/').pop()?.substring(0, 20)}</span></div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Showing {filtered.length} questions · Select all and bulk approve to process faster</p>
          <div className="flex justify-center gap-3 mt-3">
            <button onClick={selectAll}
              className="px-6 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded-xl text-sm font-bold transition-colors">
              Select All {filtered.length} Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}