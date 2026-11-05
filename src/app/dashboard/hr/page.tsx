'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Briefcase, Clock, CheckCircle2, XCircle, Download, FileText, Calendar, RefreshCw, Coffee } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function HRPayroll() {
  const [user] = useState({ email: localStorage.getItem('tryit_user') || '', role: localStorage.getItem('tryit_role') || '' });
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [activeAttendance, setActiveAttendance] = useState<any>(null);
  const [activeBreak, setActiveBreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeStr, setTimeStr] = useState('');
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '', substitute_email: '' });
  const isHROrAdmin = user.role === 'super_admin' || user.role === 'hr';

  const fetchData = async () => {
    setLoading(true);
    const [att, lv, bal, brk, activeAtt, activeBrk] = await Promise.all([
      supabase.from('staff_attendance').select('*').order('clock_in', { ascending: false }).limit(isHROrAdmin ? 100 : 10),
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('leave_balances').select('*'),
      supabase.from('staff_breaks').select('*').eq('date', new Date().toISOString().split('T')[0]),
      supabase.from('staff_attendance').select('*').eq('user_email', user.email).eq('status', 'active').maybeSingle(),
      supabase.from('staff_breaks').select('*').eq('user_email', user.email).is('break_end', null).maybeSingle(),
    ]);
    if (att.data) setAttendance(isHROrAdmin ? att.data : att.data.filter(a => a.user_email === user.email));
    if (lv.data) setLeaves(isHROrAdmin ? lv.data : lv.data.filter(l => l.user_email === user.email));
    if (bal.data) setBalances(isHROrAdmin ? bal.data : bal.data.filter(b => b.user_email === user.email));
    if (brk.data) setBreaks(brk.data);
    setActiveAttendance(activeAtt.data);
    setActiveBreak(activeBrk.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setTimeStr(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })), 1000);
    return () => clearInterval(timer);
  }, []);

  const clockIn = async () => {
    await supabase.from('staff_attendance').insert([{ user_email: user.email }]);
    await supabase.from('staff_sessions').insert([{ user_email: user.email, event_type: 'clock_in' }]);
    fetchData();
  };

  const clockOut = async () => {
    if (!activeAttendance) return;
    if (activeBreak) await endBreak();
    await supabase.from('staff_attendance').update({ clock_out: new Date().toISOString(), status: 'completed' }).eq('id', activeAttendance.id);
    await supabase.from('staff_sessions').insert([{ user_email: user.email, event_type: 'clock_out' }]);
    fetchData();
  };

  const startBreak = async (type: string) => {
    await supabase.from('staff_breaks').insert([{ user_email: user.email, break_type: type }]);
    await supabase.from('staff_sessions').insert([{ user_email: user.email, event_type: 'break_start', notes: type }]);
    fetchData();
  };

  const endBreak = async () => {
    if (!activeBreak) return;
    const duration = Math.round((Date.now() - new Date(activeBreak.break_start).getTime()) / 60000);
    await supabase.from('staff_breaks').update({ break_end: new Date().toISOString(), duration_minutes: duration }).eq('id', activeBreak.id);
    await supabase.from('staff_sessions').insert([{ user_email: user.email, event_type: 'break_end' }]);
    fetchData();
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('leave_requests').insert([{ user_email: user.email, ...leaveForm }]);
    setLeaveForm({ leave_type: 'casual', start_date: '', end_date: '', reason: '', substitute_email: '' });
    fetchData();
  };

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('leave_requests').update({ status, approved_by: user.email, approved_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user.email, action: `LEAVE_${status.toUpperCase()}`, details: { leave_id: id } }]);
    fetchData();
  };

  const getBalance = (email: string) => balances.find(b => b.user_email === email);
  const myBalance = getBalance(user.email);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-violet-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Briefcase className="text-violet-500" size={32}/> HR & Attendance</h1>
          <p className="text-gray-500">Clock in/out, breaks, leave requests, and attendance records.</p>
        </div>
        <div className="flex items-center gap-4">
          {isHROrAdmin && (
            <button onClick={() => exportToCSV(attendance, 'TryIT_Attendance')}
              className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
              <Download size={16}/> Export
            </button>
          )}
          <div className="text-2xl font-mono font-bold bg-[var(--card-bg)] px-4 py-2 rounded-2xl border border-[var(--card-border)]">{timeStr}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 text-center shadow-sm">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${activeAttendance ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
              <Clock className={activeAttendance ? 'text-green-500' : 'text-gray-400'} size={32}/>
            </div>
            <h2 className="text-lg font-bold mb-1">{activeAttendance ? '🟢 Clocked In' : '⚪ Clocked Out'}</h2>
            {activeAttendance && <p className="text-xs text-gray-500 mb-3">Since {new Date(activeAttendance.clock_in).toLocaleTimeString()}</p>}
            {activeBreak && <p className="text-xs text-orange-500 mb-2">☕ On break since {new Date(activeBreak.break_start).toLocaleTimeString()}</p>}

            {!activeAttendance ? (
              <button onClick={clockIn} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl">Clock In</button>
            ) : (
              <div className="space-y-2">
                {!activeBreak ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => startBreak('short')} className="bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-1">
                      <Coffee size={14}/> Break
                    </button>
                    <button onClick={() => startBreak('lunch')} className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white font-bold py-2 rounded-xl text-sm">
                      🍱 Lunch
                    </button>
                  </div>
                ) : (
                  <button onClick={endBreak} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-sm">End Break</button>
                )}
                <button onClick={clockOut} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl">Clock Out</button>
              </div>
            )}
          </div>

          {myBalance && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><Calendar size={16} className="text-blue-500"/> My Leave Balance</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Casual', value: myBalance.casual_leave, color: 'text-blue-500' },
                  { label: 'Sick', value: myBalance.sick_leave, color: 'text-red-500' },
                  { label: 'Earned', value: myBalance.earned_leave, color: 'text-green-500' },
                  { label: 'Emergency', value: myBalance.emergency_leave, color: 'text-orange-500' },
                ].map(item => (
                  <div key={item.label} className="bg-[var(--background)] rounded-xl p-3 text-center">
                    <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                    <div className="text-[10px] text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><FileText size={16} className="text-purple-500"/> Apply Leave</h3>
            <form onSubmit={submitLeave} className="space-y-3">
              <select value={leaveForm.leave_type} onChange={e => setLeaveForm(p => ({ ...p, leave_type: e.target.value }))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="earned">Earned Leave</option>
                <option value="emergency">Emergency</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" required value={leaveForm.start_date} onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))}
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none"/>
                <input type="date" required value={leaveForm.end_date} onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))}
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none"/>
              </div>
              <input placeholder="Substitute email (for leave > 2 days)" value={leaveForm.substitute_email}
                onChange={e => setLeaveForm(p => ({ ...p, substitute_email: e.target.value }))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"/>
              <input required placeholder="Reason *" value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"/>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-sm">Submit Leave Request</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isHROrAdmin && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <h2 className="font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-orange-500"/> Pending Leave Approvals</h2>
              {leaves.filter(l => l.status === 'pending').length === 0
                ? <p className="text-gray-500 text-sm">No pending leave requests</p>
                : leaves.filter(l => l.status === 'pending').map(leave => (
                  <div key={leave.id} className="bg-[var(--background)] border border-[var(--card-border)] p-4 rounded-2xl flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">{leave.user_email.split('@')[0]}
                        <span className="text-xs font-normal text-gray-500 ml-2">{leave.leave_type} leave</span>
                      </p>
                      <p className="text-xs text-gray-500">{leave.start_date} → {leave.end_date}</p>
                      <p className="text-xs text-gray-400">"{leave.reason}"</p>
                      {leave.substitute_email && <p className="text-xs text-blue-500">Substitute: {leave.substitute_email}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLeaveAction(leave.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg"><XCircle size={16}/></button>
                      <button onClick={() => handleLeaveAction(leave.id, 'approved')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg"><CheckCircle2 size={16}/></button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> {isHROrAdmin ? 'All Staff ' : 'My '}Attendance Log</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {attendance.length === 0 ? <p className="text-gray-500 text-sm">No attendance records</p>
                : attendance.slice(0, 15).map(a => {
                  const duration = a.clock_out
                    ? Math.round((new Date(a.clock_out).getTime() - new Date(a.clock_in).getTime()) / 3600000 * 10) / 10
                    : null;
                  const dayBreaks = breaks.filter(b => b.user_email === a.user_email);
                  const breakMins = dayBreaks.reduce((s, b) => s + (b.duration_minutes || 0), 0);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl text-sm">
                      <div>
                        {isHROrAdmin && <p className="font-bold text-xs">{a.user_email.split('@')[0]}</p>}
                        <p className="text-xs text-gray-500">
                          {new Date(a.clock_in).toLocaleDateString()} ·
                          In: {new Date(a.clock_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {a.clock_out && ` · Out: ${new Date(a.clock_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        {breakMins > 0 && <p className="text-xs text-orange-400">Break: {breakMins} mins</p>}
                      </div>
                      <div className="text-right">
                        {duration && <p className="font-bold text-blue-500">{duration}h</p>}
                        {!a.clock_out && <span className="text-xs text-green-500 font-bold">ACTIVE</span>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h2 className="font-bold mb-4">My Leave History</h2>
            <div className="space-y-2">
              {leaves.length === 0 ? <p className="text-gray-500 text-sm">No leave requests</p>
                : leaves.slice(0, 5).map(leave => (
                  <div key={leave.id} className="flex justify-between items-center p-3 bg-[var(--background)] rounded-xl">
                    <div>
                      <p className="font-bold text-sm capitalize">{leave.leave_type} Leave</p>
                      <p className="text-xs text-gray-500">{leave.start_date} → {leave.end_date}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                      leave.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                      leave.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>{leave.status}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}