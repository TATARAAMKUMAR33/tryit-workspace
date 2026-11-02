'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert,
  Clock,
  Briefcase,
  IndianRupee,
  Calendar,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  Wallet,
  Download,
  Plane,
  XCircle,
  FileText
} from 'lucide-react';;
import { exportToCSV } from '@/lib/exportCsv';

export default function HRPayroll() {
  const [user, setUser] = useState({ email: 'tatu.ind@hotmail.com', role: 'super_admin' });
  const [activeAttendance, setActiveAttendance] = useState<any>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeStr, setTimeStr] = useState('');
  
  // Leave Form
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('tryit_user') || 'tatu.ind@hotmail.com';
    const role = localStorage.getItem('tryit_role') || 'super_admin';
    setUser({ email, role });

    const timer = setInterval(() => setTimeStr(new Date().toLocaleTimeString()), 1000);
    fetchData(email);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async (email: string) => {
    setLoading(true);
    const [activeRes, logsRes, walletsRes, leavesRes] = await Promise.all([
      supabase.from('staff_attendance').select('*').eq('user_email', email).eq('status', 'active').maybeSingle(),
      supabase.from('staff_attendance').select('*').order('clock_in', { ascending: false }).limit(5),
      supabase.from('mentor_wallets').select('*').order('pending_balance', { ascending: false }),
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false })
    ]);

    setActiveAttendance(activeRes.data);
    if (logsRes.data) setAttendanceLogs(logsRes.data);
    if (walletsRes.data) setWallets(walletsRes.data);
    if (leavesRes.data) setLeaves(leavesRes.data);
    setLoading(false);
  };

  const handleClockIn = async () => {
    await supabase.from('staff_attendance').insert([{ user_email: user.email }]);
    fetchData(user.email);
  };

  const handleClockOut = async () => {
    if (!activeAttendance) return;
    await supabase.from('staff_attendance').update({ clock_out: new Date().toISOString(), status: 'completed' }).eq('id', activeAttendance.id);
    fetchData(user.email);
  };

  const applyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('leave_requests').insert([{ user_email: user.email, leave_type: leaveType, start_date: startDate, end_date: endDate, reason }]);
    alert('Leave request submitted!');
    setStartDate(''); setEndDate(''); setReason('');
    fetchData(user.email);
  };

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('leave_requests').update({ status }).eq('id', id);
    fetchData(user.email);
  };

  const handlePayout = async (walletId: string, amount: number, email: string) => {
    if (!confirm(`Pay ₹${amount} to ${email}?`)) return;
    await supabase.from('mentor_wallets').update({ pending_balance: 0, total_paid: amount, last_payout_at: new Date().toISOString() }).eq('id', walletId);
    fetchData(user.email);
  };

  if (loading) return <div className="flex justify-center py-20 text-blue-500 animate-pulse">Loading HR Data...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3"><Briefcase className="text-blue-500" size={32} /> HR & Payroll</h1>
          <p className="text-gray-500">Manage staff attendance, leaves, and mentor payouts.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => exportToCSV(wallets, 'TryIT_Payroll')} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/30"><Download size={18} /> Export Payroll</button>
          <div className="text-2xl font-mono font-bold text-[var(--foreground)] bg-[var(--card-bg)] px-6 py-2 rounded-2xl border border-[var(--card-border)]">{timeStr}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Time & Leave */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-xl text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6"><Clock className="text-blue-500" size={40} /></div>
            <h2 className="text-xl font-bold mb-2">Time Tracker</h2>
            {activeAttendance ? (
              <>
                <p className="text-sm text-gray-500 mb-6">Clocked in at {new Date(activeAttendance.clock_in).toLocaleTimeString()}</p>
                <button onClick={handleClockOut} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/30">Clock Out Now</button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-6">You are currently clocked out.</p>
                <button onClick={handleClockIn} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-500/30">Clock In Now</button>
              </>
            )}
          </div>

          {/* Leave Request Form */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500"><Plane size={16} /> Request Leave</h3>
            <form onSubmit={applyLeave} className="space-y-3">
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-2 text-sm focus:outline-none">
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="emergency">Emergency</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-2 text-sm focus:outline-none" />
                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-2 text-sm focus:outline-none" />
              </div>
              <input type="text" placeholder="Reason..." required value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-2 text-sm focus:outline-none" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-sm transition-colors">Submit Request</button>
            </form>
          </div>
        </div>

        {/* Right Column: Payouts & Leave Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Approvals (Only for Super Admin / HR) */}
          {(user.role === 'super_admin' || user.role === 'hr') && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--card-border)] pb-2"><FileText className="text-orange-500"/> Pending Leave Approvals</h2>
              <div className="space-y-3">
                {leaves.filter(l => l.status === 'pending').length === 0 ? <p className="text-sm text-gray-500 italic">No pending leave requests.</p> : null}
                {leaves.filter(l => l.status === 'pending').map(leave => (
                  <div key={leave.id} className="bg-[var(--background)] border border-[var(--card-border)] p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{leave.user_email.split('@')[0]} <span className="text-xs font-normal text-gray-500">requested {leave.leave_type} leave</span></p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()} - "{leave.reason}"</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLeaveAction(leave.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><XCircle size={18}/></button>
                      <button onClick={() => handleLeaveAction(leave.id, 'approved')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors"><CheckCircle2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-4"><Wallet className="text-purple-500" /> Mentor Wallets & Payouts</h2>
            <div className="space-y-4">
              {wallets.map(wallet => (
                <div key={wallet.id} className="bg-[var(--background)] border border-[var(--card-border)] p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold text-lg">{wallet.mentor_email[0].toUpperCase()}</div>
                    <div><p className="font-bold text-[var(--foreground)]">{wallet.mentor_email}</p><p className="text-xs text-gray-500">Total Paid: ₹{wallet.total_paid}</p></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pending Payout</p><p className="text-2xl font-black text-green-500 flex items-center justify-end"><IndianRupee size={18} /> {wallet.pending_balance}</p></div>
                    <button onClick={() => handlePayout(wallet.id, wallet.pending_balance, wallet.mentor_email)} disabled={wallet.pending_balance <= 0} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><CheckCircle2 size={16} /> Approve Payout</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

