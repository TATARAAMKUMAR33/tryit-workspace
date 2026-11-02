'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Upload, AlertTriangle, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ContentOps() {
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [offline, setOffline] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [s, c, i, o] = await Promise.all([
        supabase.from('syllabus_maps').select('*').limit(5),
        supabase.from('cohort_outcomes').select('*').limit(5),
        supabase.from('b2b_import_logs').select('*').limit(5),
        supabase.from('offline_sync_queue').select('*').limit(5)
      ]);
      if(s.data) setSyllabus(s.data);
      if(c.data) setCohorts(c.data);
      if(i.data) setImports(i.data);
      if(o.data) setOffline(o.data);
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <h1 className="text-3xl font-bold flex items-center gap-3"><BookOpen className="text-teal-500" /> Content Ops & QA Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task 32: Syllabus Versioning */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="text-blue-500"/> Syllabus Versioning</h2>
          {syllabus.map(s => <div key={s.id} className="text-sm p-2 bg-[var(--background)] rounded-lg mb-2">{s.exam_name} - {s.chapter_name} ({s.version})</div>)}
        </div>

        {/* Task 33: Content Freshness */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="text-orange-500"/> Content Freshness Score</h2>
          <div className="h-32 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold border border-orange-200">
            Run Python Worker to Calculate Freshness Heatmap
          </div>
        </div>

        {/* Task 30: Cohort Tracker */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="text-green-500"/> Cohort Outcome Tracker</h2>
          {cohorts.length === 0 ? <p className="text-sm text-gray-500">No results reported yet.</p> : cohorts.map(c => <div key={c.id} className="text-sm p-2 bg-[var(--background)] rounded-lg mb-2">{c.student_email} - {c.exam_name} : <span className="font-bold">{c.result_status}</span></div>)}
        </div>

        {/* Task 31: Bulk B2B Import */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Upload className="text-purple-500"/> Bulk B2B Student Import</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
            <p>Drag & Drop CSV here</p>
            <button className="mt-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-lg text-sm font-bold">Select File</button>
          </div>
          {imports.map(i => <div key={i.id} className="text-sm mt-2">{i.institution_name}: {i.total_records} records</div>)}
        </div>

        {/* Task 39: Offline Sync Resolver */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><RefreshCw className="text-blue-500"/> Offline Sync Conflict Resolver</h2>
          {offline.length === 0 ? <p className="text-sm text-gray-500">No pending offline submissions.</p> : (
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-gray-100"><th className="p-2">Student</th><th className="p-2">Duration</th><th className="p-2">Action</th></tr></thead>
              <tbody>
                {offline.map(o => (
                  <tr key={o.id} className="border-b"><td className="p-2">{o.student_email}</td><td className="p-2">{o.client_duration_ms}ms</td><td className="p-2"><button className="bg-green-500 text-white px-2 py-1 rounded text-xs">Review</button></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
