'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, RefreshCw, CheckCircle2, AlertTriangle, Upload, Users, FileText, Calendar } from 'lucide-react';

export default function ContentOps() {
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [offline, setOffline] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('syllabus');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [s, c, i, o, e, sub, f] = await Promise.all([
        supabase.from('syllabus_maps').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('cohort_outcomes').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('b2b_import_logs').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('offline_sync_queue').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('exam_countdown').select('*').limit(5),
        supabase.from('submitted_question_papers').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('questions').select('id, subject, last_sme_reviewed_at').not('last_sme_reviewed_at', 'is', null)
          .lt('last_sme_reviewed_at', new Date(Date.now() - 180 * 86400000).toISOString()).limit(10),
      ]);
      if (s.data) setSyllabus(s.data);
      if (c.data) setCohorts(c.data);
      if (i.data) setImports(i.data);
      if (o.data) setOffline(o.data);
      if (e.data) setExams(e.data);
      if (sub.data) setSubmitted(sub.data);
      if (f.data) setFreshness(f.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const resolveOffline = async (id: string) => {
    await supabase.from('offline_sync_queue').update({ status: 'resolved' }).eq('id', id);
  };

  const tabs = [
    { id: 'syllabus', label: 'Syllabus', icon: FileText, count: syllabus.length },
    { id: 'submissions', label: 'Submissions', icon: Upload, count: submitted.filter(s => s.status === 'pending_qa').length },
    { id: 'cohorts', label: 'Cohorts', icon: Users, count: cohorts.length },
    { id: 'offline', label: 'Offline Queue', icon: RefreshCw, count: offline.filter(o => o.status !== 'resolved').length },
    { id: 'exams', label: 'Exam Calendar', icon: Calendar, count: exams.length },
    { id: 'freshness', label: 'Stale Content', icon: AlertTriangle, count: freshness.length },
  ];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-teal-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><BookOpen className="text-teal-500" size={32}/> Content Ops Center</h1>
        <p className="text-gray-500">Syllabus versioning, mentor submissions, offline sync, and content freshness.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-teal-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500 hover:border-teal-500/50'
            }`}>
            <tab.icon size={16}/>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-teal-500/10 text-teal-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'syllabus' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><FileText className="text-blue-500" size={18}/> Syllabus Version Map</h2>
          {syllabus.length === 0
            ? <p className="text-gray-500 text-sm">No syllabus maps yet.</p>
            : syllabus.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl mb-2">
                <div>
                  <p className="font-bold text-sm">{s.exam_name || s.exam_id}</p>
                  <p className="text-xs text-gray-500">{s.chapter_name} · {s.topic_name}</p>
                </div>
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded font-bold">{s.version || 'v1'}</span>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Upload className="text-purple-500" size={18}/> Mentor & Institution Submissions</h2>
          {submitted.length === 0
            ? <div className="text-center py-8"><CheckCircle2 className="text-green-500 mx-auto mb-2" size={32}/><p className="text-gray-500">No pending submissions</p></div>
            : submitted.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl mb-2">
                <div>
                  <p className="font-bold text-sm">{s.paper_title}</p>
                  <p className="text-xs text-gray-500">{s.submitted_by} · {s.total_questions} questions · {s.exam_category}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-bold ${
                  s.status === 'pending_qa' ? 'bg-yellow-500/10 text-yellow-500' :
                  s.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                  'bg-red-500/10 text-red-500'
                }`}>{s.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'cohorts' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Users className="text-green-500" size={18}/> Cohort Outcomes</h2>
          {cohorts.length === 0
            ? <p className="text-gray-500 text-sm">No cohort data yet. Students self-report results after clearing exams.</p>
            : cohorts.map(c => (
              <div key={c.id} className="p-3 bg-[var(--background)] rounded-xl mb-2">
                <div className="flex justify-between">
                  <p className="font-bold text-sm">{c.student_email}</p>
                  <span className="text-xs text-green-500 font-bold">{c.exam_name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{c.result} · {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'offline' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><RefreshCw className="text-orange-500" size={18}/> Offline Sync Queue</h2>
          {offline.length === 0
            ? <div className="text-center py-8"><CheckCircle2 className="text-green-500 mx-auto mb-2" size={32}/><p className="text-gray-500">No offline submissions pending</p></div>
            : offline.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl mb-2">
                <div>
                  <p className="font-bold text-sm">{o.student_email}</p>
                  <p className="text-xs text-gray-500">{o.exam_name} · Submitted offline</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${o.status === 'resolved' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {o.status || 'pending'}
                  </span>
                  {o.status !== 'resolved' && (
                    <button onClick={() => resolveOffline(o.id)} className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded hover:bg-green-500 hover:text-white">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Calendar className="text-red-500" size={18}/> Upcoming Exams</h2>
          {exams.map(e => (
            <div key={e.exam_name} className={`flex items-center justify-between p-4 rounded-xl mb-2 ${
              e.urgency_level === 'CRITICAL' ? 'bg-red-500/10 border border-red-500/30' :
              e.urgency_level === 'HIGH' ? 'bg-orange-500/10 border border-orange-500/30' :
              'bg-[var(--background)] border border-[var(--card-border)]'
            }`}>
              <div>
                <p className="font-bold text-sm">{e.exam_name}</p>
                <p className="text-xs text-gray-500">{e.exam_body} · {e.exam_date}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${e.days_to_exam <= 7 ? 'text-red-500' : e.days_to_exam <= 30 ? 'text-orange-500' : 'text-blue-500'}`}>{e.days_to_exam}</p>
                <p className="text-xs text-gray-500">days left</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'freshness' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-500" size={18}/> Stale Content (180+ days)</h2>
          {freshness.length === 0
            ? <div className="text-center py-8"><CheckCircle2 className="text-green-500 mx-auto mb-2" size={32}/><p className="text-gray-500">All content recently reviewed</p></div>
            : freshness.map(q => (
              <div key={q.id} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-2">
                <div>
                  <p className="font-bold text-sm text-xs">{q.id.substring(0, 8)}...</p>
                  <p className="text-xs text-gray-500">Subject: {q.subject}</p>
                </div>
                <p className="text-xs text-yellow-500 font-bold">
                  Last reviewed: {new Date(q.last_sme_reviewed_at).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}