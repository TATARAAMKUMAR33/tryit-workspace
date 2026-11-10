'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Database, RefreshCw, Search, Download,
  TrendingUp, CheckCircle2, Clock, Zap,
  ChevronDown, ChevronUp, GitBranch, Globe
} from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function QuestionBankViewer() {
  const [summary, setSummary] = useState<any>(null);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [topicStats, setTopicStats] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [hourlyStats, setHourlyStats] = useState<any[]>([]);
  const [runStats, setRunStats] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterExam, setFilterExam] = useState('all');
  const [filterRun, setFilterRun] = useState('all');
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview'|'subjects'|'topics'|'runs'|'daily'|'browse'>('overview');
  const [expandedQ, setExpandedQ] = useState<string|null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [exams, setExams] = useState<string[]>([]);
  const PAGE_SIZE = 100;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [sum, sub, top, day, hour, run, langs, examList] = await Promise.all([
      supabase.from('question_summary').select('*').single(),
      supabase.from('subject_question_counts').select('*').limit(50),
      supabase.from('topic_question_counts').select('*').limit(100),
      supabase.from('daily_question_stats').select('*').limit(14),
      supabase.from('hourly_generation_today').select('*'),
      supabase.from('github_run_stats').select('*').limit(20),
      supabase.from('questions').select('language_code').limit(1000),
      supabase.from('questions').select('exam_target').limit(1000),
    ]);

    if (sum.data) { setSummary(sum.data); setLiveCount(sum.data.total); }
    if (sub.data) setSubjectStats(sub.data);
    if (top.data) setTopicStats(top.data);
    if (day.data) setDailyStats([...day.data].reverse());
    if (hour.data) setHourlyStats(hour.data);
    if (run.data) setRunStats(run.data);
    if (langs.data) setLanguages([...new Set(langs.data.map((l:any) => l.language_code).filter(Boolean))]);
    if (examList.data) setExams([...new Set(examList.data.map((e:any) => e.exam_target).filter(Boolean))]);

    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  const fetchQuestions = useCallback(async () => {
    let q = supabase.from('question_full_intelligence').select('*')
      .order('created_at', { ascending: false });

    if (filterSubject !== 'all') q = q.eq('subject_id', filterSubject);
    if (filterStatus === 'verified') q = q.eq('verified', true);
    if (filterStatus === 'pending') q = q.eq('verified', false);
    if (filterDifficulty === 'easy') q = q.lte('level', 3);
    if (filterDifficulty === 'medium') q = q.gte('level', 4).lte('level', 6);
    if (filterDifficulty === 'hard') q = q.gte('level', 7).lte('level', 8);
    if (filterDifficulty === 'expert') q = q.gte('level', 9);
    if (filterLanguage !== 'all') q = q.eq('language_code', filterLanguage);
    if (filterExam !== 'all') q = q.eq('exam_target', filterExam);
    if (filterRun !== 'all') q = q.eq('github_run_id', filterRun);
    if (filterTopic !== 'all') q = q.eq('topic_name', filterTopic);
    if (filterDate === 'hour') q = q.gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if (filterDate === 'today') q = q.gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
    if (filterDate === 'week') q = q.gte('created_at', new Date(Date.now() - 7*86400000).toISOString());
    if (filterDate === 'month') q = q.gte('created_at', new Date(Date.now() - 30*86400000).toISOString());

    q = q.range(page * PAGE_SIZE, (page+1)*PAGE_SIZE - 1);
    const { data } = await q;
    if (data) setQuestions(data);
  }, [filterSubject, filterStatus, filterDifficulty, filterLanguage, filterExam, filterRun, filterTopic, filterDate, page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // REALTIME — auto-update on new question
  useEffect(() => {
    const sub = supabase.channel('questions-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'questions' },
        () => {
          setLiveCount(prev => prev + 1);
          setLastUpdate(new Date());
          fetchAll();
        })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchAll]);

  const filtered = questions.filter(q =>
    !search ||
    q.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.topic_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.exam_target?.toLowerCase().includes(search.toLowerCase()) ||
    q.id?.toLowerCase().includes(search.toLowerCase()) ||
    q.github_run_id?.toLowerCase().includes(search.toLowerCase())
  );

  const topics = [...new Set(topicStats.map(t => t.topic_name).filter(Boolean))];

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-purple-500" size={40}/>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Database className="text-purple-500" size={32}/> Question Bank Intelligence
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-500 font-bold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
              Live · {liveCount.toLocaleString()} total
            </span>
            {lastUpdate && (
              <span className="text-gray-400">
                Updated {lastUpdate.toLocaleTimeString('en-IN')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(filtered, 'TryIT_Questions')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchAll}
            className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Total', value: liveCount.toLocaleString(), color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Verified', value: summary.verified?.toLocaleString(), color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Pending QA', value: summary.pending_qa?.toLocaleString(), color: summary.pending_qa > 0 ? 'text-orange-500' : 'text-green-500', bg: 'bg-orange-500/10' },
            { label: 'Today', value: summary.added_today?.toLocaleString(), color: 'text-teal-500', bg: 'bg-teal-500/10' },
            { label: 'This Week', value: summary.added_this_week?.toLocaleString(), color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Subjects', value: summary.total_subjects, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            { label: 'Quality', value: summary.avg_quality_score ? `${Math.round(summary.avg_quality_score * 100)}%` : '—', color: 'text-pink-500', bg: 'bg-pink-500/10' },
            { label: 'Sources', value: summary.total_sources, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} rounded-2xl p-3 text-center`}>
              <div className={`text-xl font-black ${card.color}`}>{card.value}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Difficulty Row */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Easy (L1-3)', value: summary.easy, pct: Math.round(summary.easy/summary.total*100), color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            { label: 'Medium (L4-6)', value: summary.medium, pct: Math.round(summary.medium/summary.total*100), color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
            { label: 'Hard (L7-8)', value: summary.hard, pct: Math.round(summary.hard/summary.total*100), color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Expert (L9-10)', value: summary.expert, pct: Math.round(summary.expert/summary.total*100), color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-black ${card.color}`}>{card.value?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-bold mt-0.5">{card.label}</div>
              <div className="text-xs text-gray-400">{card.pct || 0}% of total</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '📊 Charts' },
          { id: 'subjects', label: `📚 Subjects (${subjectStats.length})` },
          { id: 'topics', label: `🏷️ Topics (${topicStats.length})` },
          { id: 'runs', label: `⚡ GitHub Runs (${runStats.length})` },
          { id: 'daily', label: '📅 Daily' },
          { id: 'browse', label: '🔍 Browse All' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4">Questions Per Day (Last 14 Days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10}
                  tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}/>
                <YAxis stroke="#6b7280" fontSize={10}/>
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', fontSize: '12px' }}/>
                <Line type="monotone" dataKey="total_generated" stroke="#3b82f6" strokeWidth={2} dot={false} name="Generated"/>
                <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={false} name="Approved"/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4">Today by Hour (IST)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
                <XAxis dataKey="hour_ist" stroke="#6b7280" fontSize={10} tickFormatter={h => `${h}:00`}/>
                <YAxis stroke="#6b7280" fontSize={10}/>
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', fontSize: '12px' }} labelFormatter={h => `${h}:00 IST`}/>
                <Bar dataKey="questions_generated" fill="#8b5cf6" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                  {['Subject', 'Total', 'Verified', 'Pending', 'Easy', 'Medium', 'Hard', 'Today', 'Week', 'Last Added'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((s, idx) => (
                  <tr key={idx} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                    <td className="px-3 py-3 font-bold">{s.subject_name || 'Unknown'}</td>
                    <td className="px-3 py-3 font-black text-blue-500">{s.total?.toLocaleString()}</td>
                    <td className="px-3 py-3 text-green-500 font-bold">{s.verified?.toLocaleString()}</td>
                    <td className="px-3 py-3"><span className={s.pending > 0 ? 'text-orange-500 font-bold' : 'text-gray-400'}>{s.pending}</span></td>
                    <td className="px-3 py-3 text-green-500">{s.easy}</td>
                    <td className="px-3 py-3 text-yellow-600">{s.medium}</td>
                    <td className="px-3 py-3 text-orange-500">{s.hard}</td>
                    <td className="px-3 py-3 text-teal-500 font-bold">{s.added_today}</td>
                    <td className="px-3 py-3 text-purple-500 font-bold">{s.added_this_week}</td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      {s.last_added ? new Date(s.last_added).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[var(--card-border)]">
            <button onClick={() => exportToCSV(subjectStats, 'TryIT_Subject_Stats')}
              className="px-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
              <Download size={14}/> Export
            </button>
          </div>
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                  {['Topic', 'Subject', 'Language', 'Total', 'Verified', 'Easy', 'Medium', 'Hard', 'Today', 'Last Added'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topicStats.map((t, idx) => (
                  <tr key={idx} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                    <td className="px-3 py-3 font-bold">{t.topic_name || '—'}</td>
                    <td className="px-3 py-3 text-gray-500">{t.subject_name || '—'}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded uppercase font-bold">{t.language_code || 'en'}</span>
                    </td>
                    <td className="px-3 py-3 font-black text-blue-500">{t.total}</td>
                    <td className="px-3 py-3 text-green-500 font-bold">{t.verified}</td>
                    <td className="px-3 py-3 text-green-500">{t.easy}</td>
                    <td className="px-3 py-3 text-yellow-600">{t.medium}</td>
                    <td className="px-3 py-3 text-orange-500">{t.hard}</td>
                    <td className="px-3 py-3 text-teal-500 font-bold">{t.added_today}</td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      {t.last_added ? new Date(t.last_added).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GitHub Runs Tab */}
      {activeTab === 'runs' && (
        <div className="space-y-3">
          {runStats.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
              <GitBranch size={40} className="text-gray-300 mx-auto mb-3"/>
              <p className="font-bold">No run data yet</p>
              <p className="text-gray-500 text-sm">Run data appears after workers tag questions with github_run_id</p>
            </div>
          ) : runStats.map((run, idx) => (
            <div key={idx} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch size={16} className="text-green-500"/>
                    <span className="font-bold">Run #{run.github_run_number || '—'}</span>
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">{run.workflow_name}</span>
                    <span className="font-mono text-xs text-gray-400">{run.run_id?.substring(0, 12)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Started: {run.run_started_ist ? new Date(run.run_started_ist).toLocaleString('en-IN') : '—'}
                    {run.run_ended_ist && ` · Ended: ${new Date(run.run_ended_ist).toLocaleString('en-IN')}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {run.subjects_covered} subjects · {run.topics_covered} topics · {run.languages_used} languages
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-blue-500">{run.questions_generated?.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">questions</div>
                  <div className="text-xs text-green-500 font-bold">{run.approved} approved</div>
                  {run.avg_quality && <div className="text-xs text-purple-500">{Math.round(run.avg_quality * 100)}% quality</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Tab */}
      {activeTab === 'daily' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                  {['Date', 'Generated', 'Approved', 'Pending', 'Easy', 'Medium', 'Hard', 'Quality', 'Runs'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...dailyStats].reverse().map((d, idx) => (
                  <tr key={idx} className={`border-b border-[var(--card-border)] hover:bg-[var(--background)] ${idx === 0 ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-4 py-3 font-bold">
                      {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {idx === 0 && <span className="ml-2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">TODAY</span>}
                    </td>
                    <td className="px-4 py-3 font-black text-blue-500 text-base">{d.total_generated?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-500 font-bold">{d.approved?.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={d.pending > 0 ? 'text-orange-500 font-bold' : 'text-gray-400'}>{d.pending}</span></td>
                    <td className="px-4 py-3 text-green-500">{d.easy}</td>
                    <td className="px-4 py-3 text-yellow-600">{d.medium}</td>
                    <td className="px-4 py-3 text-orange-500">{d.hard}</td>
                    <td className="px-4 py-3">{d.avg_quality ? `${Math.round(d.avg_quality * 100)}%` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{d.sources_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[var(--card-border)]">
            <button onClick={() => exportToCSV([...dailyStats].reverse(), 'TryIT_Daily_Stats')}
              className="px-4 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
              <Download size={14}/> Export Daily Report
            </button>
          </div>
        </div>
      )}

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search subject, topic, exam, run ID..."
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none"/>
            </div>
            <select value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(0); }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="hour">Last Hour</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <select value={filterDifficulty} onChange={e => { setFilterDifficulty(e.target.value); setPage(0); }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="all">All Difficulty</option>
              <option value="easy">Easy (L1-3)</option>
              <option value="medium">Medium (L4-6)</option>
              <option value="hard">Hard (L7-8)</option>
              <option value="expert">Expert (L9-10)</option>
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
            <select value={filterLanguage} onChange={e => { setFilterLanguage(e.target.value); setPage(0); }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="all">All Languages</option>
              {languages.map(l => <option key={l} value={l}>{l?.toUpperCase()}</option>)}
            </select>
            <select value={filterExam} onChange={e => { setFilterExam(e.target.value); setPage(0); }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="all">All Exams</option>
              {exams.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={filterRun} onChange={e => { setFilterRun(e.target.value); setPage(0); }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="all">All Runs</option>
              {runStats.map(r => <option key={r.run_id} value={r.run_id}>Run #{r.github_run_number} ({r.questions_generated}q)</option>)}
            </select>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-[var(--card-border)] flex justify-between items-center">
              <span className="text-sm font-bold">{filtered.length} questions</span>
              <button onClick={() => exportToCSV(filtered, 'TryIT_Questions_Filtered')}
                className="px-3 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Download size={12}/> Export Filtered
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                    {['ID', 'Subject', 'Topic', 'Exam', 'Level', 'Lang', 'Status', 'Quality', 'Run', 'Generated At (IST)', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <>
                      <tr key={q.id} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                        <td className="px-3 py-2 font-mono text-xs text-gray-400">{q.id?.substring(0, 8)}...</td>
                        <td className="px-3 py-2 font-medium text-xs">{q.subject_name || '—'}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{q.topic_name || '—'}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{q.exam_target || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            q.difficulty_label === 'Easy' ? 'bg-green-500/10 text-green-600' :
                            q.difficulty_label === 'Medium' ? 'bg-yellow-500/10 text-yellow-600' :
                            q.difficulty_label === 'Hard' ? 'bg-red-500/10 text-red-600' :
                            'bg-purple-500/10 text-purple-600'
                          }`}>L{q.level}</span>
                        </td>
                        <td className="px-3 py-2 text-xs uppercase text-gray-500">{q.language_code || 'en'}</td>
                        <td className="px-3 py-2">
                          {q.verified
                            ? <span className="text-xs text-green-500 font-bold flex items-center gap-1"><CheckCircle2 size={10}/> OK</span>
                            : <span className="text-xs text-orange-500 font-bold flex items-center gap-1"><Clock size={10}/> QA</span>}
                        </td>
                        <td className="px-3 py-2 text-xs font-bold">{q.quality_score ? `${Math.round(q.quality_score*100)}%` : '—'}</td>
                        <td className="px-3 py-2 text-xs font-mono text-gray-400">#{q.github_run_number || '—'}</td>
                        <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                          {q.created_at_ist ? new Date(q.created_at_ist).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                            className="p-1 text-gray-400 hover:text-blue-500 rounded">
                            {expandedQ === q.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                          </button>
                        </td>
                      </tr>
                      {expandedQ === q.id && (
                        <tr key={`${q.id}-exp`} className="bg-blue-500/5">
                          <td colSpan={11} className="px-6 py-3 text-xs text-gray-500 space-x-4">
                            <span>Full ID: {q.id}</span>
                            <span>Run ID: {q.github_run_id || '—'}</span>
                            <span>Workflow: {q.workflow_name || '—'}</span>
                            <span>Batch: {q.batch_id || '—'}</span>
                            <span>Age: {q.age_bucket}</span>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-[var(--card-border)]">
              <p className="text-xs text-gray-500">Page {page + 1} · {PAGE_SIZE} per page</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                  className="px-4 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => p+1)} disabled={filtered.length < PAGE_SIZE}
                  className="px-4 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}