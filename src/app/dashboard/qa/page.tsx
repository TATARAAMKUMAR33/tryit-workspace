'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CheckSquare, RefreshCw, CheckCircle2, XCircle,
  Search, ChevronDown, ChevronUp, Download,
  Clock, Eye, Database
} from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function QAInspector() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0, verified: 0, pending: 0,
    myApproved: 0, myRejected: 0
  });
  const PAGE_SIZE = 50;
  const user = typeof window !== 'undefined'
    ? localStorage.getItem('tryit_user') || '' : '';

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects').select('subject_id, subject_name');
    if (data) setSubjects(data);
  };

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [total, verified, pending, myVotes] = await Promise.all([
      supabase.from('questions')
        .select('id', { count: 'exact', head: true }),
      supabase.from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('verified', true),
      supabase.from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('verified', false),
      supabase.from('qa_votes')
        .select('vote')
        .eq('voter_email', user)
        .gte('created_at', today.toISOString()),
    ]);
    setStats({
      total: total.count || 0,
      verified: verified.count || 0,
      pending: pending.count || 0,
      myApproved: myVotes.data?.filter(v => v.vote === 'approve').length || 0,
      myRejected: myVotes.data?.filter(v => v.vote === 'reject').length || 0,
    });
  };

  const fetchQuestions = async () => {
    setLoading(true);
    let q = supabase.from('questions').select(`
      id,
      question_en,
      options_en,
      correct_answer,
      explanation,
      level,
      difficulty,
      verified,
      subject_id,
      topic_id,
      topic_name,
      exam_target,
      language_code,
      quality_score,
      generated_by,
      github_run_number,
      github_run_id,
      workflow_name,
      batch_id,
      created_at,
      reject_reason,
      review_notes,
      syllabus_version,
      access_tier,
      pattern_type
    `, { count: 'exact' }).order('created_at', { ascending: false });

    if (filterStatus === 'verified') q = q.eq('verified', true);
    if (filterStatus === 'pending') q = q.eq('verified', false);
    if (filterSubject !== 'all') q = q.eq('subject_id', filterSubject);
    if (filterDifficulty === 'easy') q = q.lte('level', 3);
    if (filterDifficulty === 'medium') q = q.gte('level', 4).lte('level', 6);
    if (filterDifficulty === 'hard') q = q.gte('level', 7).lte('level', 8);
    if (filterDifficulty === 'expert') q = q.gte('level', 9);
    q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await q;
    if (data) setQuestions(data);
    if (count !== null) setTotalCount(count);
    setLoading(false);
  };

  useEffect(() => { fetchSubjects(); fetchStats(); }, []);
  useEffect(() => { fetchQuestions(); }, [filterStatus, filterSubject, filterDifficulty, page]);

  const approve = async (id: string) => {
    await supabase.from('questions').update({
      verified: true,
      verified_by: user,
      verified_at: new Date().toISOString()
    }).eq('id', id);
    await supabase.from('qa_votes').insert([{
      question_id: id, voter_email: user, vote: 'approve'
    }]);
    await supabase.from('staff_sessions').insert([{
      user_email: user, event_type: 'qa_approve', notes: id.substring(0, 8)
    }]);
    setQuestions(prev =>
      filterStatus === 'pending'
        ? prev.filter(q => q.id !== id)
        : prev.map(q => q.id === id ? { ...q, verified: true } : q)
    );
    setSelected(prev => prev.filter(s => s !== id));
    setStats(prev => ({
      ...prev,
      verified: prev.verified + 1,
      pending: Math.max(0, prev.pending - 1),
      myApproved: prev.myApproved + 1
    }));
  };

  const reject = async (id: string, reason: string) => {
    await supabase.from('questions').update({
      verified: false,
      reject_reason: reason,
      rejected_by: user,
      rejected_at: new Date().toISOString()
    }).eq('id', id);
    await supabase.from('qa_votes').insert([{
      question_id: id, voter_email: user, vote: 'reject', reason
    }]);
    setQuestions(prev =>
      filterStatus === 'verified'
        ? prev.filter(q => q.id !== id)
        : prev.map(q => q.id === id
          ? { ...q, verified: false, reject_reason: reason } : q)
    );
    setSelected(prev => prev.filter(s => s !== id));
    setRejectingId(null);
    setRejectReason('');
    setStats(prev => ({ ...prev, myRejected: prev.myRejected + 1 }));
  };

  const bulkApprove = async () => {
    if (!selected.length) return;
    setBulkProcessing(true);
    for (const id of selected) await approve(id);
    setSelected([]);
    setBulkProcessing(false);
    fetchStats();
  };

  const bulkReject = async () => {
    if (!selected.length) return;
    const reason = prompt('Rejection reason for all selected:');
    if (!reason) return;
    setBulkProcessing(true);
    for (const id of selected) await reject(id, reason);
    setSelected([]);
    setBulkProcessing(false);
  };

  const toggleSelect = (id: string) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );

  // Parse options_en — handles both array and JSON string
  const parseOptions = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return [raw]; }
    }
    if (typeof raw === 'object') return Object.values(raw);
    return [];
  };

  // Get correct answer index (could be 0, 1, 2, 3 or 'A','B','C','D' or 'a','b','c','d')
  const getCorrectIndex = (answer: string): number => {
    if (!answer) return -1;
    const a = answer.toString().toLowerCase().trim();
    if (a === '0' || a === 'a') return 0;
    if (a === '1' || a === 'b') return 1;
    if (a === '2' || a === 'c') return 2;
    if (a === '3' || a === 'd') return 3;
    // Try numeric
    const n = parseInt(a);
    if (!isNaN(n)) return n;
    return -1;
  };

  const filtered = questions.filter(q => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.question_en?.toLowerCase().includes(s) ||
      q.topic_name?.toLowerCase().includes(s) ||
      q.exam_target?.toLowerCase().includes(s) ||
      q.id?.toLowerCase().includes(s) ||
      q.explanation?.toLowerCase().includes(s)
    );
  });

  const getSubjectName = (id: string) =>
    subjects.find(s => s.subject_id === id)?.subject_name || '—';

  const getDiff = (level: number) => {
    if (!level) return { label: '?', color: 'text-gray-400 bg-gray-500/10' };
    if (level <= 3) return { label: `Easy L${level}`, color: 'text-green-600 bg-green-500/10' };
    if (level <= 6) return { label: `Medium L${level}`, color: 'text-yellow-600 bg-yellow-500/10' };
    if (level <= 8) return { label: `Hard L${level}`, color: 'text-orange-500 bg-orange-500/10' };
    return { label: `Expert L${level}`, color: 'text-red-500 bg-red-500/10' };
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckSquare className="text-purple-500" size={32}/> QA Inspector
          </h1>
          <p className="text-gray-500 mt-1">
            {stats.total.toLocaleString()} total ·
            <span className="text-green-500 font-bold"> {stats.verified.toLocaleString()} verified</span> ·
            <span className="text-orange-500 font-bold"> {stats.pending.toLocaleString()} pending</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(filtered, 'TryIT_QA')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={() => { fetchQuestions(); fetchStats(); }}
            className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total.toLocaleString(), color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Verified', value: stats.verified.toLocaleString(), color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending', value: stats.pending.toLocaleString(), color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'You Approved Today', value: stats.myApproved, color: 'text-teal-500', bg: 'bg-teal-500/10' },
          { label: 'You Rejected Today', value: stats.myRejected, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-center`}>
            <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search question text, topic, exam..."
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none"/>
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm">
          <option value="all">All Questions</option>
          <option value="pending">Pending QA</option>
          <option value="verified">Verified</option>
        </select>
        <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setPage(0); }}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm">
          <option value="all">All Subjects</option>
          {subjects.map(s => (
            <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
          ))}
        </select>
        <select value={filterDifficulty} onChange={e => { setFilterDifficulty(e.target.value); setPage(0); }}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm">
          <option value="all">All Difficulty</option>
          <option value="easy">Easy (L1-3)</option>
          <option value="medium">Medium (L4-6)</option>
          <option value="hard">Hard (L7-8)</option>
          <option value="expert">Expert (L9-10)</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <span className="font-bold text-purple-600">{selected.length} selected</span>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelected(filtered.map(q => q.id))}
              className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs font-bold">
              Select All ({filtered.length})
            </button>
            <button onClick={bulkApprove} disabled={bulkProcessing}
              className="px-4 py-1.5 bg-green-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <CheckCircle2 size={12}/>
              {bulkProcessing ? 'Processing...' : `Approve (${selected.length})`}
            </button>
            <button onClick={bulkReject} disabled={bulkProcessing}
              className="px-4 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <XCircle size={12}/> Reject ({selected.length})
            </button>
            <button onClick={() => setSelected([])}
              className="px-3 py-1.5 bg-gray-500/10 text-gray-500 rounded-xl text-xs font-bold">
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
            <div className="space-y-2 mb-4">
              {[
                'Factually incorrect',
                'Answer key is wrong',
                'Poor question quality',
                'Duplicate question',
                'Wrong subject or topic',
                'Explanation missing or wrong',
                'Language or grammar issues',
                'Options are ambiguous or unclear',
              ].map(r => (
                <button key={r} onClick={() => setRejectReason(r)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                    rejectReason === r
                      ? 'bg-red-500/10 border border-red-500/30 text-red-600 font-bold'
                      : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                  }`}>
                  {r}
                </button>
              ))}
              <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Or type a custom reason..."
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => reject(rejectingId, rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
                Confirm Reject
              </button>
              <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-purple-500" size={32}/>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-16 text-center">
          <Database size={48} className="text-gray-200 mx-auto mb-4"/>
          <h2 className="text-xl font-bold mb-2">No questions found</h2>
          <p className="text-gray-500 text-sm">
            {filterStatus === 'pending'
              ? 'All questions reviewed. Queue is clear.'
              : 'Try changing filters.'}
          </p>
          {filterStatus !== 'all' && (
            <button onClick={() => setFilterStatus('all')}
              className="mt-4 px-4 py-2 bg-purple-500/10 text-purple-500 rounded-xl text-sm font-bold">
              Show All Questions
            </button>
          )}
        </div>
      )}

      {/* Question Cards */}
      {!loading && filtered.map(q => {
        const isExpanded = expanded === q.id;
        const isSelected = selected.includes(q.id);
        const diff = getDiff(q.level);
        const options = parseOptions(q.options_en);
        const correctIdx = getCorrectIndex(q.correct_answer);

        return (
          <div key={q.id}
            className={`bg-[var(--card-bg)] border rounded-2xl overflow-hidden ${
              isSelected
                ? 'border-purple-500/50 bg-purple-500/5'
                : q.verified
                ? 'border-green-500/20'
                : 'border-orange-500/20'
            }`}>

            {/* Header Row */}
            <div className="p-5">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={isSelected}
                  onChange={() => toggleSelect(q.id)}
                  className="mt-1 w-4 h-4 accent-purple-500 cursor-pointer shrink-0"/>

                <div className="flex-1 min-w-0">
                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {q.verified
                      ? <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                          <CheckCircle2 size={10}/> Verified
                        </span>
                      : <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                          <Clock size={10}/> Pending QA
                        </span>
                    }
                    <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-bold">
                      {getSubjectName(q.subject_id)}
                    </span>
                    {q.topic_name && (
                      <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">
                        {q.topic_name}
                      </span>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${diff.color}`}>
                      {diff.label}
                    </span>
                    {q.language_code && q.language_code !== 'en' && (
                      <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded uppercase font-bold">
                        {q.language_code}
                      </span>
                    )}
                    {q.exam_target && (
                      <span className="text-xs text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded">
                        {q.exam_target}
                      </span>
                    )}
                    {q.pattern_type && (
                      <span className="text-xs text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">
                        {q.pattern_type}
                      </span>
                    )}
                    {q.quality_score && (
                      <span className={`text-xs font-bold ${
                        q.quality_score >= 0.8 ? 'text-green-500' :
                        q.quality_score >= 0.5 ? 'text-yellow-500' : 'text-red-500'
                      }`}>{Math.round(q.quality_score * 100)}% quality</span>
                    )}
                  </div>

                  {/* Question Text */}
                  <p className={`text-sm font-medium leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {q.question_en || <span className="text-gray-400 italic">No question text</span>}
                  </p>

                  {/* Quick Options Preview when collapsed */}
                  {!isExpanded && options.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {options.slice(0, 4).map((opt: string, i: number) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded border ${
                          i === correctIdx
                            ? 'bg-green-500/10 border-green-500/30 text-green-600 font-bold'
                            : 'bg-[var(--background)] border-[var(--card-border)] text-gray-500'
                        }`}>
                          {optionLabels[i]}. {String(opt).substring(0, 30)}{String(opt).length > 30 ? '...' : ''}
                          {i === correctIdx && ' ✓'}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.reject_reason && (
                    <p className="text-xs text-red-400 mt-1">Rejected: {q.reject_reason}</p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(q.created_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })} IST
                    {q.github_run_number && ` · Run #${q.github_run_number}`}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setExpanded(isExpanded ? null : q.id)}
                    className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-colors">
                    {isExpanded ? <ChevronUp size={16}/> : <Eye size={16}/>}
                  </button>
                  <button onClick={() => approve(q.id)}
                    className="px-3 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                    <CheckCircle2 size={13}/> Approve
                  </button>
                  <button onClick={() => { setRejectingId(q.id); setRejectReason(''); }}
                    className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                    <XCircle size={13}/> Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
              <div className="border-t border-[var(--card-border)] p-5 bg-[var(--background)] space-y-4">

                {/* Full Question */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Question</p>
                  <p className="text-sm bg-[var(--card-bg)] rounded-xl p-4 leading-relaxed font-medium">
                    {q.question_en || <span className="text-gray-400 italic">No question text stored</span>}
                  </p>
                </div>

                {/* Options */}
                {options.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                      Answer Options ({options.length} options)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {options.map((opt: any, i: number) => {
                        const isCorrect = i === correctIdx;
                        const optText = typeof opt === 'object' ? JSON.stringify(opt) : String(opt);
                        return (
                          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                            isCorrect
                              ? 'bg-green-500/10 border-green-500/40'
                              : 'bg-[var(--card-bg)] border-[var(--card-border)]'
                          }`}>
                            <span className={`font-black text-base shrink-0 w-6 ${
                              isCorrect ? 'text-green-500' : 'text-gray-400'
                            }`}>{optionLabels[i] || i}.</span>
                            <span className={`text-sm ${isCorrect ? 'font-bold text-green-700' : ''}`}>
                              {optText}
                              {isCorrect && (
                                <span className="ml-2 text-green-500 font-black">✓ CORRECT</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                    <p className="text-xs text-orange-500 font-bold">
                      ⚠️ options_en is empty or null for this question.
                      Raw value: {JSON.stringify(q.options_en)}
                    </p>
                  </div>
                )}

                {/* Correct Answer */}
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Correct Answer (raw)</p>
                    <span className="inline-block bg-green-500/10 text-green-600 font-black text-lg px-4 py-1 rounded-xl border border-green-500/30">
                      {q.correct_answer !== null && q.correct_answer !== undefined
                        ? String(q.correct_answer).toUpperCase()
                        : '—'}
                    </span>
                  </div>
                  {correctIdx >= 0 && options[correctIdx] && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Correct Option Text</p>
                      <span className="text-sm font-bold text-green-600 bg-green-500/10 px-3 py-1 rounded-xl">
                        {String(options[correctIdx]).substring(0, 60)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {q.explanation ? (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Explanation</p>
                    <p className="text-sm bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                    <p className="text-xs text-orange-500 font-bold">
                      ⚠️ No explanation stored for this question.
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'ID', value: q.id?.substring(0, 12) + '...' },
                    { label: 'Subject', value: getSubjectName(q.subject_id) },
                    { label: 'Topic', value: q.topic_name || q.topic_id || '—' },
                    { label: 'Exam', value: q.exam_target || '—' },
                    { label: 'Language', value: (q.language_code || 'en').toUpperCase() },
                    { label: 'Level', value: q.level || '—' },
                    { label: 'Pattern', value: q.pattern_type || '—' },
                    { label: 'Access Tier', value: q.access_tier || '—' },
                    { label: 'Quality', value: q.quality_score ? `${Math.round(q.quality_score * 100)}%` : '—' },
                    { label: 'Syllabus Ver', value: q.syllabus_version || '—' },
                    { label: 'GitHub Run', value: q.github_run_number ? `#${q.github_run_number}` : 'manual' },
                    { label: 'Workflow', value: q.workflow_name || '—' },
                  ].map(item => (
                    <div key={item.label} className="bg-[var(--card-bg)] rounded-xl p-2 text-center">
                      <p className="text-[10px] text-gray-400 uppercase">{item.label}</p>
                      <p className="text-xs font-bold mt-0.5 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Review Notes */}
                {q.review_notes && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Review Notes</p>
                    <p className="text-sm text-gray-600 bg-[var(--card-bg)] rounded-xl p-3">{q.review_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages} · {totalCount.toLocaleString()} questions
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm disabled:opacity-50">
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(0, page - 2) + i;
              if (p >= totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-2 rounded-xl text-sm ${
                    p === page
                      ? 'bg-purple-500 text-white font-bold'
                      : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                  }`}>
                  {p + 1}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}