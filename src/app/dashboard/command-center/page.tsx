'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, Zap, Calendar, RefreshCw, CheckCircle2, 
  XCircle, IndianRupee, Bell, Users, AlertOctagon, FileText
} from 'lucide-react';

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState<'ops' | 'finance' | 'content'>('ops');
  const [loading, setLoading] = useState(true);

  // Ops State
  const [battleMode, setBattleMode] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Finance State
  const [refunds, setRefunds] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [b, e, d, t, r, p] = await Promise.all([
      supabase.from('platform_controls').select('*').eq('id', 'battle_mode').maybeSingle(),
      supabase.from('exam_calendar').select('*').order('event_date', { ascending: true }),
      supabase.from('duplicate_account_flags').select('*').limit(10),
      supabase.from('notification_templates').select('*').limit(5),
      supabase.from('refund_requests').select('*').eq('status', 'initiated'),
      supabase.from('payroll_approvals').select('*').eq('status', 'pending')
    ]);
    
    if (b.data) setBattleMode(b.data.is_active);
    if (e.data) setExams(e.data);
    if (d.data) setDuplicates(d.data);
    if (t.data) setTemplates(t.data);
    if (r.data) setRefunds(r.data);
    if (p.data) setPayrolls(p.data);
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleBattleMode = async () => {
    const newMode = !battleMode;
    setBattleMode(newMode);
    await supabase.from('platform_controls').update({ is_active: newMode }).eq('id', 'battle_mode');
  };

  const approveRefund = async (id: string) => {
    await supabase.from('refund_requests').update({ status: 'approved' }).eq('id', id);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[var(--card-bg)] p-4 rounded-3xl border border-[var(--card-border)] shadow-xl gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={28} />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Super Admin Command Center</h1>
        </div>
        <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--card-border)]">
          <button onClick={() => setActiveTab('ops')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'ops' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}>System Ops</button>
          <button onClick={() => setActiveTab('finance')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'finance' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'}`}>Finance & HR</button>
        </div>
      </div>

      {/* OPS TAB */}
      {activeTab === 'ops' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Battle Mode */}
          <div className={`p-6 rounded-3xl border shadow-sm transition-colors ${battleMode ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Zap className={battleMode ? 'text-red-500' : 'text-gray-400'} /> Battle Mode</h3>
              <button onClick={toggleBattleMode} className={`w-14 h-8 rounded-full transition-colors relative ${battleMode ? 'bg-red-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${battleMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-sm text-gray-500">Disables non-critical modules and routes all database connections to CRM and Exam Engine.</p>
          </div>

          {/* Exam Calendar */}
          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Calendar className="text-blue-500" /> Exam Surge Calendar</h3>
            <div className="space-y-2">
              {exams.length === 0 ? <p className="text-sm text-gray-500">No upcoming exams.</p> : exams.map(e => (
                <div key={e.id} className="flex justify-between items-center p-2 bg-[var(--background)] rounded-lg border border-[var(--card-border)]">
                  <span className="font-medium text-sm">{e.exam_name} ({e.event_type})</span>
                  <span className="text-xs font-bold text-gray-500">{new Date(e.event_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicate Scanner */}
          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Users className="text-purple-500" /> Duplicate Account Flags</h3>
            {duplicates.length === 0 ? <p className="text-sm text-gray-500">No duplicate accounts detected.</p> : duplicates.map(d => (
              <div key={d.id} className="flex justify-between items-center p-2 bg-[var(--background)] rounded-lg mb-2 border border-[var(--card-border)]">
                <span className="text-sm"><span className="text-blue-500">{d.primary_email}</span> linked to <span className="text-red-500">{d.linked_email}</span></span>
                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">{d.signal_type}</span>
              </div>
            ))}
          </div>

          {/* Notification Templates */}
          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Bell className="text-yellow-500" /> Notification Templates</h3>
            {templates.map(t => (
              <div key={t.id} className="mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase">{t.template_name}</p>
                <textarea className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-2 text-sm mt-1" defaultValue={t.message_body} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINANCE TAB */}
      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Refund State Machine */}
          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><IndianRupee className="text-green-500" /> Pending Refunds</h3>
            {refunds.length === 0 ? <p className="text-sm text-gray-500">No pending refunds.</p> : refunds.map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-[var(--background)] rounded-xl mb-2 border border-[var(--card-border)]">
                <div>
                  <p className="font-bold text-sm">{r.student_email}</p>
                  <p className="text-xs text-gray-500">Refund: ₹{r.amount}</p>
                </div>
                <button onClick={() => approveRefund(r.id)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">Approve</button>
              </div>
            ))}
          </div>

          {/* 4-Eyes Payroll */}
          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><FileText className="text-purple-500" /> Payroll Approvals (4-Eyes Check)</h3>
            {payrolls.length === 0 ? <p className="text-sm text-gray-500">No payrolls pending approval.</p> : payrolls.map(p => (
              <div key={p.id} className="p-3 bg-[var(--background)] rounded-xl mb-2 border border-[var(--card-border)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{p.month} Payroll</span>
                  <span className="text-sm font-bold text-green-600">₹{p.total_amount}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>Calculated by: {p.calculated_by}</span>
                  <span>Status: {p.status}</span>
                </div>
                <button className="w-full bg-blue-500 text-white py-1.5 rounded-lg text-sm font-bold hover:bg-blue-600">Approve as Second Admin</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
