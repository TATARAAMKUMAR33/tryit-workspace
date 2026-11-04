'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Zap, Calendar, RefreshCw, CheckCircle2, IndianRupee, Bell, Users, AlertOctagon, FileText, Clock } from 'lucide-react';

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState<'ops' | 'finance' | 'content'>('ops');
  const [loading, setLoading] = useState(true);
  const [battleMode, setBattleMode] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [togglingBattle, setTogglingBattle] = useState(false);
  const user = localStorage.getItem('tryit_user') || '';

  const fetchData = async () => {
    setLoading(true);
    const [b, e, d, t, r, p, s, c] = await Promise.all([
      supabase.from('platform_controls').select('*').eq('id', 'battle_mode').maybeSingle(),
      supabase.from('exam_countdown').select('*').limit(5),
      supabase.from('duplicate_account_flags').select('*').limit(5),
      supabase.from('notification_templates').select('*').limit(5),
      supabase.from('refund_requests').select('*').eq('status', 'initiated').limit(5),
      supabase.from('payroll_approvals').select('*').eq('status', 'pending').limit(5),
      supabase.from('syllabus_maps').select('*').limit(5),
      supabase.from('cohort_outcomes').select('*').limit(5),
    ]);
    if (b.data) setBattleMode(b.data.is_active || false);
    if (e.data) setExams(e.data);
    if (d.data) setDuplicates(d.data);
    if (t.data) setTemplates(t.data);
    if (r.data) setRefunds(r.data);
    if (p.data) setPayrolls(p.data);
    if (s.data) setSyllabus(s.data);
    if (c.data) setCohorts(c.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleBattleMode = async () => {
    setTogglingBattle(true);
    const newState = !battleMode;
    await supabase.from('platform_controls').upsert([{ id: 'battle_mode', is_active: newState, updated_by: user, updated_at: new Date().toISOString() }]);
    await supabase.from('audit_logs').insert([{ user_email: user, action: newState ? 'BATTLE_MODE_ACTIVATED' : 'BATTLE_MODE_DEACTIVATED', details: { timestamp: new Date().toISOString() } }]);
    setBattleMode(newState);
    setTogglingBattle(false);
  };

  const approveRefund = async (id: string) => {
    await supabase.from('refund_requests').update({ status: 'approved', reviewed_by: user }).eq('id', id);
    fetchData();
  };

  const approvePayroll = async (id: string) => {
    await supabase.from('payroll_approvals').update({ status: 'approved', approved_by: user, approved_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const tabs = [
    { id: 'ops' as const, label: 'Operations' },
    { id: 'finance' as const, label: 'Finance Queue' },
    { id: 'content' as const, label: 'Content' },
  ];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><ShieldAlert className="text-red-600" size={32}/> Command Center</h1>
          <p className="text-gray-500">Battle mode, exam calendar, duplicates, refunds, and payroll approvals.</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      <div className={`rounded-2xl p-6 border-2 ${battleMode ? 'bg-red-500/10 border-red-500' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${battleMode ? 'bg-red-500 animate-pulse' : 'bg-gray-500/10'}`}>
              <Zap size={28} className={battleMode ? 'text-white' : 'text-gray-500'}/>
            </div>
            <div>
              <h2 className="text-xl font-bold">Battle Mode</h2>
              <p className="text-sm text-gray-500">
                {battleMode
                  ? '🔴 ACTIVE — Non-critical routes intercepted, DB routed to CRM, auto-replies enabled'
                  : '⚪ Standby — Activate on exam result days or traffic surges'}
              </p>
            </div>
          </div>
          <button onClick={toggleBattleMode} disabled={togglingBattle}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 ${
              battleMode ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40' : 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:opacity-80'
            }`}>
            {togglingBattle ? 'Switching...' : battleMode ? '🔴 DEACTIVATE' : '⚡ ACTIVATE BATTLE MODE'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? 'bg-red-600 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ops' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Calendar size={18} className="text-blue-500"/> Exam Countdown</h2>
            {exams.length === 0 ? <p className="text-gray-500 text-sm">No upcoming exams</p>
              : exams.map(e => (
                <div key={e.exam_name} className={`flex items-center justify-between p-3 rounded-xl mb-2 ${e.urgency_level === 'CRITICAL' ? 'bg-red-500/10 border border-red-500/30' : 'bg-[var(--background)]'}`}>
                  <div>
                    <p className="font-bold text-sm">{e.exam_name}</p>
                    <p className="text-xs text-gray-500">{e.exam_body}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${e.days_to_exam <= 7 ? 'text-red-500' : e.days_to_exam <= 30 ? 'text-orange-500' : 'text-blue-500'}`}>{e.days_to_exam}</p>
                    <p className="text-xs text-gray-500">days</p>
                  </div>
                </div>
              ))}
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-orange-500"/> Duplicate Accounts</h2>
            {duplicates.length === 0 ? (
              <div className="text-center py-6"><CheckCircle2 className="text-green-500 mx-auto mb-2" size={28}/><p className="text-sm text-gray-500">No duplicate flags</p></div>
            ) : duplicates.map(d => (
              <div key={d.id} className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl mb-2">
                <p className="font-bold text-sm text-xs">{d.email_1} ↔ {d.email_2}</p>
                <p className="text-xs text-gray-500">{d.match_type} · {d.match_score}% match</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><IndianRupee size={18} className="text-green-500"/> Pending Refunds</h2>
            {refunds.length === 0 ? (
              <div className="text-center py-6"><CheckCircle2 className="text-green-500 mx-auto mb-2" size={28}/><p className="text-sm text-gray-500">No pending refunds</p></div>
            ) : refunds.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl mb-2">
                <div>
                  <p className="font-bold text-sm">{r.user_email || r.student_email}</p>
                  <p className="text-xs text-gray-500">{r.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.amount && <span className="font-black text-green-500">₹{r.amount}</span>}
                  <button onClick={() => approveRefund(r.id)} className="px-2 py-1 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Clock size={18} className="text-purple-500"/> Payroll Approvals</h2>
            {payrolls.length === 0 ? (
              <div className="text-center py-6"><CheckCircle2 className="text-green-500 mx-auto mb-2" size={28}/><p className="text-sm text-gray-500">No pending payroll approvals</p></div>
            ) : payrolls.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl mb-2">
                <div>
                  <p className="font-bold text-sm">{p.mentor_email || p.staff_email}</p>
                  <p className="text-xs text-gray-500">Period: {p.period || 'Monthly'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.amount && <span className="font-black text-purple-500">₹{p.amount}</span>}
                  <button onClick={() => approvePayroll(p.id)} className="px-2 py-1 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded-lg text-xs font-bold">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-teal-500"/> Syllabus Maps</h2>
            {syllabus.length === 0 ? <p className="text-gray-500 text-sm">No syllabus data</p>
              : syllabus.map(s => (
                <div key={s.id} className="p-3 bg-[var(--background)] rounded-xl mb-2">
                  <p className="font-bold text-sm">{s.exam_name || s.exam_id}</p>
                  <p className="text-xs text-gray-500">{s.chapter_name} · {s.version || 'v1'}</p>
                </div>
              ))}
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><AlertOctagon size={18} className="text-blue-500"/> Cohort Outcomes</h2>
            {cohorts.length === 0 ? <p className="text-gray-500 text-sm text-center py-6">No cohort outcomes yet. Students self-report when they clear exams.</p>
              : cohorts.map(c => (
                <div key={c.id} className="p-3 bg-[var(--background)] rounded-xl mb-2 flex justify-between">
                  <div>
                    <p className="font-bold text-sm">{c.student_email}</p>
                    <p className="text-xs text-gray-500">{c.exam_name}</p>
                  </div>
                  <span className="text-xs text-green-500 font-bold">{c.result}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}