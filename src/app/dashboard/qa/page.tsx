'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, XCircle, RefreshCw, BookOpen, AlertTriangle, 
  Lightbulb, Search, ChevronLeft, ChevronRight, Calendar, 
  MessageSquare, ListFilter, PlayCircle, Download, CheckSquare
} from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function QAWorkspace() {
  const [activeTab, setActiveTab] = useState<'review' | 'list'>('list'); // Default to list for bulk actions
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Single Review State
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCategory, setRejectCategory] = useState('math_error');
  const [userEmail, setUserEmail] = useState('tatu.ind@hotmail.com');

  // List State
  const [list, setList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('tryit_v3');
  
  // Bulk Action State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchStats = async () => {
    const { count: total } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('generated_by', 'tryit_v3');
    const { count: approved } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('generated_by', 'tryit_v3_approved');
    const { count: rejected } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('generated_by', 'tryit_v3_rejected');
    setStats({ total: total || 0, pending: pending || 0, approved: approved || 0, rejected: rejected || 0 });
  };

  const fetchSingleQuestion = useCallback(async () => {
    setLoading(true);
    setRejecting(false);
    const { data } = await supabase.from('questions').select('*').eq('generated_by', 'tryit_v3').limit(1).maybeSingle();
    setQuestion(data || null);
    setLoading(false);
  }, []);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    let query = supabase.from('questions').select('*', { count: 'exact' }).eq('generated_by', statusFilter);
    
    if (search) {
      query = query.or(`question_en.ilike.%${search}%,id.ilike.%${search}%`);
    }
    
    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * 20, (page + 1) * 20 - 1);

    if (data) setList(data);
    if (count) setTotalPages(Math.ceil(count / 20));
    setListLoading(false);
    setSelectedIds([]); // Clear selection on page change
  }, [page, search, statusFilter]);

  useEffect(() => {
    setUserEmail(localStorage.getItem('tryit_user') || 'tatu.ind@hotmail.com');
    fetchStats();
    if (activeTab === 'review') fetchSingleQuestion();
    else fetchList();
  }, [activeTab, fetchSingleQuestion, fetchList]);

  // --- SINGLE ACTIONS ---
  const handleAction = async (action: 'approve' | 'reject') => {
    if (!question) return;
    if (action === 'reject' && !rejectReason) {
      alert('Please add a comment for the rejection reason.');
      return;
    }

    setLoading(true);
    const newStatus = action === 'approve' ? 'tryit_v3_approved' : 'tryit_v3_rejected';
    const updateData: any = { generated_by: newStatus, reviewed_by: userEmail };
    if (action === 'reject') updateData.review_notes = `[${rejectCategory.toUpperCase()}] ${rejectReason}`;

    const { error } = await supabase.from('questions').update(updateData).eq('id', question.id);

    if (!error) {
      setRejecting(false); setRejectReason('');
      fetchStats(); fetchSingleQuestion();
    } else {
      alert("Error saving: " + error.message);
      setLoading(false);
    }
  };

  // --- BULK ACTIONS ---
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === list.length) setSelectedIds([]);
    else setSelectedIds(list.map(q => q.id));
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    
    await supabase.from('questions').update({ 
      generated_by: 'tryit_v3_approved', 
      reviewed_by: userEmail 
    }).in('id', selectedIds);

    await supabase.from('audit_logs').insert([{ user_email: userEmail, action: 'BULK_APPROVE_QA', details: { count: selectedIds.length } }]);
    
    setBulkLoading(false);
    setSelectedIds([]);
    fetchList();
    fetchStats();
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to bulk reject ${selectedIds.length} questions?`)) return;
    setBulkLoading(true);
    
    await supabase.from('questions').update({ 
      generated_by: 'tryit_v3_rejected', 
      reviewed_by: userEmail 
    }).in('id', selectedIds);

    await supabase.from('audit_logs').insert([{ user_email: userEmail, action: 'BULK_REJECT_QA', details: { count: selectedIds.length } }]);
    
    setBulkLoading(false);
    setSelectedIds([]);
    fetchList();
    fetchStats();
  };

  const renderQuestionDetails = (q: any) => {
    const exp = q.explanation || {};
    const dateStr = new Date(q.created_at).toLocaleString();
    const examIntel = exp.cross_exam_intelligence || q.topic_id?.replace(/_/g, ' ').toUpperCase() || 'Not specified';

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="bg-slate-500/10 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase">{q.subject_id?.replace(/_/g, ' ') || 'General'}</span>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase ${q.level >= 7 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>Level {q.level}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-gray-500 ml-auto"><Calendar size={14} /> {dateStr}</span>
        </div>
        <h2 className="text-xl font-medium leading-relaxed mb-6 text-[var(--foreground)]">{q.question_en}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {q.options_en?.map((opt: string, i: number) => (
            <div key={i} className={`p-4 rounded-xl border ${i === q.correct_answer ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' : 'bg-[var(--background)] border-[var(--card-border)] text-gray-600 dark:text-gray-400'}`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
            </div>
          ))}
        </div>
        <div className="space-y-4 pt-6 border-t border-[var(--card-border)]">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[var(--foreground)]"><BookOpen size={20} className="text-blue-500" /> 7-Layer Explanation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
              <h4 className="font-bold text-blue-500 mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Why Correct</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{exp.why_correct}</p>
            </div>
            <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10">
              <h4 className="font-bold text-purple-500 mb-2 flex items-center gap-2"><Lightbulb size={16}/> Story Context</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{exp.story_explanation}</p>
            </div>
            <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10">
              <h4 className="font-bold text-orange-500 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Why B, C, D are Wrong</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li><strong>B:</strong> {exp.why_wrong_option_b}</li>
                <li><strong>C:</strong> {exp.why_wrong_option_c}</li>
                <li><strong>D:</strong> {exp.why_wrong_option_d}</li>
              </ul>
            </div>
            <div className="p-5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
              <h4 className="font-bold text-slate-500 mb-2 flex items-center gap-2"><RefreshCw size={16}/> Shortcut & Exam Intel</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2"><strong>Shortcut:</strong> {exp.shortcut_tips}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Exams:</strong> {examIntel}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      
      {/* Top Stats & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-3xl border border-[var(--card-border)] backdrop-blur-xl">
        <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--card-border)]">
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'list' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500'}`}><ListFilter size={16} /> Question Bank</button>
          <button onClick={() => setActiveTab('review')} className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'review' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500'}`}><PlayCircle size={16} /> Live Review</button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Total DB: {stats.total}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Pending: {stats.pending}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Approved: {stats.approved}</div>
        </div>
      </div>

      {/* REVIEW TAB */}
      {activeTab === 'review' && (
        <>
          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>
          ) : !question ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)]">
              <CheckCircle2 size={64} className="text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-[var(--foreground)]">All Caught Up!</h2>
              <p className="text-gray-500">No more pending questions.</p>
            </div>
          ) : (
            <>
              <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl p-8 shadow-xl">
                {renderQuestionDetails(question)}
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleAction('approve')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"><CheckCircle2 size={24} /> Approve Question</button>
                <button onClick={() => setRejecting(true)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"><XCircle size={24} /> Reject Question</button>
              </div>
            </>
          )}
        </>
      )}

      {/* LIST TAB WITH BULK ACTIONS */}
      {activeTab === 'list' && (
        <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[var(--card-border)] flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input type="text" placeholder="Search by ID or Text..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-2 px-4 text-sm font-medium focus:outline-none focus:border-blue-500">
              <option value="tryit_v3">V3 Pending</option>
              <option value="tryit_v3_approved">V3 Approved</option>
              <option value="tryit_v3_rejected">V3 Rejected</option>
            </select>
            <button onClick={() => exportToCSV(list, `Question_Bank_${statusFilter}`)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Download size={16} /> Export</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--background)]/50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold w-12 text-center">
                    <input type="checkbox" checked={selectedIds.length === list.length && list.length > 0} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                  </th>
                  <th className="p-4 font-semibold">ID / Date</th>
                  <th className="p-4 font-semibold">Question</th>
                  <th className="p-4 font-semibold">Topic / Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {listLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><RefreshCw className="animate-spin text-blue-500 inline-block" /></td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">No questions found.</td></tr>
                ) : (
                  list.map((q) => (
                    <tr key={q.id} className={`transition-colors ${selectedIds.includes(q.id) ? 'bg-blue-500/5' : 'hover:bg-[var(--background)]/30'}`}>
                      <td className="p-4 text-center">
                        <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => toggleSelection(q.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                      </td>
                      <td className="p-4 text-sm">
                        <div className="font-mono text-xs text-blue-500 mb-1">{q.id.slice(0, 10)}</div>
                        <div className="text-gray-500 text-xs flex items-center gap-1"><Calendar size={12}/> {new Date(q.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-[var(--foreground)] line-clamp-2 max-w-md">{q.question_en}</td>
                      <td className="p-4 text-sm">
                        <span className="block text-xs text-gray-500 mb-1">{q.topic_id?.replace(/_/g, ' ').slice(0, 30)}...</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.level >= 7 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>L{q.level}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[var(--card-border)] flex items-center justify-between bg-[var(--background)]/50">
            <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-[var(--card-border)] disabled:opacity-50 hover:bg-white/5"><ChevronLeft size={18} /></button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-[var(--card-border)] disabled:opacity-50 hover:bg-white/5"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTION BAR */}
      {selectedIds.length > 0 && activeTab === 'list' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-fade-up border border-slate-700">
          <div className="flex items-center gap-2 font-bold"><CheckSquare size={20} className="text-blue-400" /> {selectedIds.length} Questions Selected</div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex gap-2">
            <button onClick={handleBulkReject} disabled={bulkLoading} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
              {bulkLoading ? <RefreshCw className="animate-spin" size={16}/> : <XCircle size={16}/>} Reject All
            </button>
            <button onClick={handleBulkApprove} disabled={bulkLoading} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
              {bulkLoading ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} Approve All
            </button>
          </div>
          <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-[var(--background)] border border-[var(--card-border)] p-8 rounded-3xl max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><MessageSquare className="text-red-500"/> Reject & Comment</h3>
            <div className="space-y-4 mb-6 mt-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
                <select value={rejectCategory} onChange={e => setRejectCategory(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-red-500">
                  <option value="math_error">Math / Logic Error</option>
                  <option value="bad_story">Bad / Irrelevant Story</option>
                  <option value="wrong_answer">Wrong Answer Key</option>
                  <option value="formatting">Formatting Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Comment / Correction</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="E.g., The math in the explanation is wrong..." className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 h-32 focus:outline-none focus:border-red-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setRejecting(false)} className="flex-1 py-3 rounded-xl hover:bg-gray-500/10 font-semibold text-gray-500">Cancel</button>
              <button onClick={() => handleAction('reject')} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 shadow-lg shadow-red-500/30">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
