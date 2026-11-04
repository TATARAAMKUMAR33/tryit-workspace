'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, Plus, CheckCircle2, XCircle, RefreshCw, Download, Upload } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [user] = useState({ email: localStorage.getItem('tryit_user') || '', role: localStorage.getItem('tryit_role') || '' });
  const [form, setForm] = useState({ description: '', amount: '', category: 'software', receipt_url: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    const query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
    const { data } = user.role === 'super_admin' || user.role === 'hr' ? await query : await query.eq('user_email', user.email);
    if (data) setExpenses(data);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('expenses').insert([{
      user_email: user.email,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      receipt_url: form.receipt_url,
      status: parseFloat(form.amount) <= 500 ? 'approved' : 'pending'
    }]);
    setForm({ description: '', amount: '', category: 'software', receipt_url: '' });
    setShowForm(false);
    setSubmitting(false);
    fetchExpenses();
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('expenses').update({ status, approved_by: user.email, approved_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('audit_logs').insert([{
      user_email: user.email,
      action: `EXPENSE_${status.toUpperCase()}`,
      details: { expense_id: id }
    }]);
    fetchExpenses();
  };

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0);

  const categoryColors: Record<string, string> = {
    software: 'text-blue-500 bg-blue-500/10',
    travel: 'text-green-500 bg-green-500/10',
    marketing: 'text-purple-500 bg-purple-500/10',
    office: 'text-yellow-500 bg-yellow-500/10',
    other: 'text-gray-500 bg-gray-500/10',
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-amber-500" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Wallet className="text-amber-500" size={32}/> Expense Management</h1>
          <p className="text-gray-500">Claims under ₹500 auto-approved. Above ₹500 requires HR approval.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(expenses, 'TryIT_Expenses')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-xl flex items-center gap-2">
            <Plus size={18}/> New Claim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-5 text-center">
          <div className="text-3xl font-black text-yellow-500">₹{totalPending.toLocaleString()}</div>
          <div className="text-xs text-gray-500 font-bold uppercase mt-1">Pending Approval</div>
        </div>
        <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-5 text-center">
          <div className="text-3xl font-black text-green-500">₹{totalApproved.toLocaleString()}</div>
          <div className="text-xs text-gray-500 font-bold uppercase mt-1">Approved This Month</div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-5 text-center">
          <div className="text-3xl font-black text-blue-500">{expenses.length}</div>
          <div className="text-xs text-gray-500 font-bold uppercase mt-1">Total Claims</div>
        </div>
      </div>

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">Submit Expense Claim</h2>
          <form onSubmit={submitExpense} className="grid grid-cols-2 gap-4">
            <input required placeholder="Description *" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
            <input required type="number" placeholder="Amount (₹) *" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="software">Software/Tools</option>
              <option value="travel">Travel</option>
              <option value="marketing">Marketing</option>
              <option value="office">Office Supplies</option>
              <option value="other">Other</option>
            </select>
            <input placeholder="Receipt URL (optional)" value={form.receipt_url}
              onChange={e => setForm(p => ({ ...p, receipt_url: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"/>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <Upload size={40} className="text-gray-300 mx-auto mb-3"/>
            <p className="font-bold">No expense claims yet</p>
          </div>
        ) : expenses.map(exp => (
          <div key={exp.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${categoryColors[exp.category] || categoryColors.other}`}>
                {exp.category}
              </span>
              <div>
                <p className="font-bold">{exp.description}</p>
                <p className="text-xs text-gray-500">{exp.user_email} · {new Date(exp.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xl font-black text-[var(--foreground)]">₹{Number(exp.amount).toLocaleString()}</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                exp.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                exp.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                'bg-yellow-500/10 text-yellow-500'
              }`}>{exp.status.toUpperCase()}</span>
              {exp.status === 'pending' && (user.role === 'super_admin' || user.role === 'hr') && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(exp.id, 'approved')}
                    className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors">
                    <CheckCircle2 size={16}/>
                  </button>
                  <button onClick={() => updateStatus(exp.id, 'rejected')}
                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                    <XCircle size={16}/>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}