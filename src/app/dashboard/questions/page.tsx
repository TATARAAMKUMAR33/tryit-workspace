'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, RefreshCw, Search, Filter, Download, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function QuestionBankViewer() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [totals, setTotals] = useState({
    total: 0, verified: 0, pending: 0,
    today: 0, thisWeek: 0, fromMentors: 0
  });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchData = async () => {
    setLoading(true);

    const [subStats, dayStats, totalCount, verifiedCount, todayCount, weekCount, mentorCount] = await Promise.all([
      supabase.from('subject_question_counts').select('*').limit(20),
      supabase.from('daily_question_stats').select('*').limit(14),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('questions').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      supabase.from('questions').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('submitted_questions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ]);
  if (subStats.data) {
  setSubjectStats(subStats.data);
  setSubjects(subStats.data.map((s: any) => s.subject_name).filter(Boolean));
}
    if (dayStats.data) setDailyStats(dayStats.data.reverse());

    setTotals({
      total: totalCount.count || 0,
      verified: verifiedCount.count || 0,
      pending: (totalCount.count || 0) - (verifiedCount.count || 0),
      today: todayCount.count || 0,
      thisWeek: weekCount.count || 0,
      fromMentors: mentorCount.count || 0,
    });

    fetchQuestions();
    setLoading(false);
  };

  const fetchQuestions = async () => {
    let query = supabase.from('questions').select('id, subject, level, verified, generated_by, created_at, quality_score, language_code, syllabus_version').order('created_at', { ascending: false });

    if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
    if (filterStatus === 'verified') query = query.eq('verified', true);
    if (filterStatus === 'pending') query = query.eq('verified', false);
    if (filterDate === 'today') query = query.gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
    if (filterDate === 'week') query = query.gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
    if (filterDate === 'month') query = query.gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data } = await query;
    if (data) setQuestions(data);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchQuestions(); }, [filterSubject, filterStatus, filterDate, page]);

  const filtered = questions.filter(q =>
    !search || q.subject?.toLowerCase().includes(search.toLowerCase()) ||
    q.id?.toLowerCase().includes(search.toLowerCase()) ||
    q.generated_by?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-purple-500" size={40}/></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Database className="text-purple-500" size={32}/> Question Bank</h1>
          <p className="text-gray-500">Real-time view of all questions with filters, timestamps, and generation source.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(filtered, 'TryIT_Questions')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: totals.total.toLocaleString(), color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Verified', value: totals.verified.toLocaleString(), color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending QA', value: totals.pending.toLocaleString(), color: totals.pending > 500 ? 'text-red-500' : 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Added Today', value: totals.today.toLocaleString(), color: 'text-teal-500', bg: 'bg-teal-500/10' },
          { label: 'This Week', value: totals.thisWeek.toLocaleString(), color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'From Mentors', value: totals.fromMentors.toLocaleString(), color: 'text-pink-500', bg: 'bg-pink-500/10' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4 text-center border border-transparent`}>
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Questions Generated Per Day</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}/>
              <YAxis stroke="#6b7280" fontSize={10}/>
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px', fontSize: '12px' }}/>
              <Line type="monotone" dataKey="total_generated" stroke="#3b82f6" strokeWidth={2} dot={false} name="Generated"/>
              <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={false} name="Approved"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Database size={16} className="text-purple-500"/> Questions by Subject</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectStats.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
              <XAxis type="number" stroke="#6b7280" fontSize={10}/>
              <YAxis dataKey="subject_name" type="category" stroke="#6b7280" fontSize={10} width={80}/>
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px', fontSize: '12px' }}/>
              <Bar dataKey="total" fill="#8b5cf6" radius={[0,8,8,0]} name="Total"/>
              <Bar dataKey="verified" fill="#10b981" radius={[0,8,8,0]} name="Verified"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Coverage Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
        <h2 className="font-bold mb-4">Subject Coverage</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                {['Subject', 'Total', 'Verified', 'Pending', 'Added Today', 'This Week', 'Last Added'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjectStats.map((s, idx) => (
                <tr key={idx} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                  <td className="px-3 py-2 font-medium">{s.subject_name || 'Unknown'}</td>
                  <td className="px-3 py-2 font-black text-blue-500">{s.total}</td>
                  <td className="px-3 py-2 text-green-500 font-bold">{s.verified}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold ${s.pending > 100 ? 'text-red-500' : s.pending > 50 ? 'text-orange-500' : 'text-gray-500'}`}>{s.pending}</span>
                  </td>
                  <td className="px-3 py-2 text-teal-500 font-bold">{s.added_today}</td>
                  <td className="px-3 py-2 text-purple-500 font-bold">{s.added_this_week}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">{s.last_added ? new Date(s.last_added).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters + Question List */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject, ID, source..."
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none"/>
          </div>
          <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setPage(0); }}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="all">All Status</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending QA</option>
          </select>
          <select value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(0); }}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                {['ID', 'Subject', 'Difficulty', 'Status', 'Source', 'Language', 'Quality', 'Created At'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} className="border-b border-[var(--card-border)] hover:bg-[var(--background)] transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">{q.id.substring(0, 8)}...</td>
                  <td className="px-3 py-2 font-medium">{q.subject_name || q.subject_id || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      q.level <= 3 ? 'bg-green-500/10 text-green-600' :
                      q.level <= 6 ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>L{q.level || '?'}</span>
                  </td>
                  <td className="px-3 py-2">
                    {q.verified
                      ? <span className="flex items-center gap-1 text-xs text-green-500 font-bold"><CheckCircle2 size={12}/> Verified</span>
                      : <span className="flex items-center gap-1 text-xs text-orange-500 font-bold"><Clock size={12}/> Pending</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{q.generated_by ? q.generated_by.split('/').pop()?.substring(0, 15) : '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 uppercase">{q.language_code || 'en'}</td>
                  <td className="px-3 py-2">
                    {q.quality_score
                      ? <span className={`text-xs font-bold ${q.quality_score >= 0.8 ? 'text-green-500' : q.quality_score >= 0.5 ? 'text-orange-500' : 'text-red-500'}`}>
                          {Math.round(q.quality_score * 100)}%
                        </span>
                      : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(q.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {PAGE_SIZE} per page</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-4 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm disabled:opacity-50">
              Previous
            </button>
            <span className="px-4 py-1.5 text-sm font-bold">Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < PAGE_SIZE}
              className="px-4 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}