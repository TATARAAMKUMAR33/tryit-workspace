'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCircle, RefreshCw, Search, AlertTriangle, TrendingDown, Shield } from 'lucide-react';

export default function Student360() {
  const [students, setStudents] = useState<any[]>([]);
  const [dropout, setDropout] = useState<any[]>([]);
  const [anticheat, setAnticheat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const [s, d, a] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('dropout_risk').select('*').eq('churn_risk', 'HIGH').limit(20),
      supabase.from('anticheat_suspicious').select('*').limit(20),
    ]);
    if (s.data) setStudents(s.data);
    if (d.data) setDropout(d.data);
    if (a.data) setAnticheat(a.data);
    setLoading(false);
  };

  const fetchStudentDetail = async (email: string) => {
    const [profile, exams, tickets, telemetry] = await Promise.all([
      supabase.from('profiles').select('*').eq('email', email).single(),
      supabase.from('exam_submissions').select('*').eq('student_email', email).order('submitted_at', { ascending: false }).limit(5),
      supabase.from('tickets').select('*').eq('student_email', email).order('created_at', { ascending: false }).limit(5),
      supabase.from('user_telemetry').select('*').eq('user_email', email).single(),
    ]);
    setSelected({ profile: profile.data, exams: exams.data || [], tickets: tickets.data || [], telemetry: telemetry.data });
  };

  useEffect(() => { fetchData(); }, []);

  const getList = () => {
    if (activeTab === 'dropout') return dropout;
    if (activeTab === 'anticheat') return anticheat;
    return students;
  };

  const filtered = getList().filter(s => {
    const email = s.email || s.student_email || '';
    return !search || email.includes(search) || s.name?.toLowerCase().includes(search.toLowerCase());
  });

  const planColor = (plan: string) => {
    if (plan === 'ultra') return 'text-purple-500 bg-purple-500/10';
    if (plan === 'pro') return 'text-blue-500 bg-blue-500/10';
    return 'text-gray-500 bg-gray-500/10';
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-teal-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><UserCircle className="text-teal-500" size={32}/> Student 360°</h1>
        <p className="text-gray-500">{students.length} total students · {dropout.length} high dropout risk · {anticheat.length} anticheat flags</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: `All Students (${students.length})` },
          { id: 'dropout', label: `Dropout Risk (${dropout.length})`, alert: dropout.length > 0 },
          { id: 'anticheat', label: `Anticheat Flags (${anticheat.length})`, alert: anticheat.length > 0 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-teal-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'
            }`}>
            {tab.alert && <span className="w-2 h-2 bg-red-500 rounded-full"/>}
            {tab.label}
          </button>
        ))}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none"/>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selected.profile?.name || 'Unknown'}</h2>
                <p className="text-gray-500 text-sm">{selected.profile?.email}</p>
                <p className="text-xs text-gray-400">{selected.profile?.tryit_id} · {selected.profile?.city}, {selected.profile?.state}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white p-2">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Plan', value: selected.profile?.plan?.toUpperCase() || 'FREE' },
                { label: 'Streak', value: `${selected.profile?.streak || 0} days` },
                { label: 'XP', value: selected.profile?.xp || 0 },
              ].map(stat => (
                <div key={stat.label} className="bg-[var(--card-bg)] rounded-xl p-3 text-center">
                  <div className="font-black text-lg text-teal-500">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {selected.exams.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2 text-sm">Recent Exams</h3>
                {selected.exams.map((e: any) => (
                  <div key={e.id} className="flex justify-between text-sm bg-[var(--card-bg)] rounded-xl p-3 mb-1">
                    <span className="text-gray-600">{e.exam_name}</span>
                    <span className="font-bold text-teal-500">{e.score}/{e.total_questions}</span>
                  </div>
                ))}
              </div>
            )}

            {selected.tickets.length > 0 && (
              <div>
                <h3 className="font-bold mb-2 text-sm">Support History</h3>
                {selected.tickets.map((t: any) => (
                  <div key={t.id} className="flex justify-between text-sm bg-[var(--card-bg)] rounded-xl p-3 mb-1">
                    <span className="text-gray-600">{t.issue_type}</span>
                    <span className={`font-bold text-xs ${t.status === 'resolved' ? 'text-green-500' : 'text-orange-500'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}

            {selected.telemetry && (
              <div className="mt-4 bg-[var(--card-bg)] rounded-xl p-4">
                <h3 className="font-bold mb-2 text-sm">Device & Location</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  {selected.telemetry.device_type && <span>Device: {selected.telemetry.device_type}</span>}
                  {selected.telemetry.os && <span>OS: {selected.telemetry.os}</span>}
                  {selected.telemetry.city && <span>Location: {selected.telemetry.city}</span>}
                  {selected.telemetry.connection_type && <span>Connection: {selected.telemetry.connection_type}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <UserCircle size={40} className="text-gray-300 mx-auto mb-3"/>
            <p className="font-bold">No students found</p>
          </div>
        ) : activeTab === 'anticheat' ? (
          filtered.map((s, idx) => (
            <div key={idx} className="bg-[var(--card-bg)] border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-red-500"/>
                <div>
                  <p className="font-bold text-sm">{s.student_email}</p>
                  <p className="text-xs text-gray-500">{s.exam_name} · {s.seconds_per_question}s/question · Score: {s.score}%</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded-xl">{s.flag_reason}</span>
            </div>
          ))
        ) : activeTab === 'dropout' ? (
          filtered.map((s, idx) => (
            <div key={idx} className="bg-[var(--card-bg)] border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown size={20} className="text-orange-500"/>
                <div>
                  <p className="font-bold text-sm">{s.email}</p>
                  <p className="text-xs text-gray-500">{s.name} · {s.city}, {s.state} · Plan: {s.plan}</p>
                  <p className="text-xs text-orange-400 mt-0.5">{s.days_inactive} days inactive · Streak: {s.streak}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded-xl">HIGH RISK</span>
                <button onClick={() => fetchStudentDetail(s.email)} className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-xl font-bold hover:bg-blue-500 hover:text-white">
                  View Profile
                </button>
              </div>
            </div>
          ))
        ) : (
          filtered.map(s => (
            <div key={s.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center justify-between hover:border-teal-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {s.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{s.name || s.email.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{s.email} · {s.city}, {s.state}</p>
                  <p className="text-xs text-gray-400">{s.tryit_id} · Streak: {s.streak} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded ${planColor(s.plan)}`}>{(s.plan || 'free').toUpperCase()}</span>
                <button onClick={() => fetchStudentDetail(s.email)} className="text-xs bg-teal-500/10 text-teal-500 hover:bg-teal-500 hover:text-white px-3 py-1.5 rounded-xl font-bold transition-colors">
                  360° View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}