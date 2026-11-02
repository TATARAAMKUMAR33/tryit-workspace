'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Receipt, Plus, CheckCircle2, XCircle, IndianRupee, 
  Clock, Upload, RefreshCw, Wallet
} from 'lucide-react';

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Form State
  const [category, setCategory] = useState('software');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    setUserEmail(localStorage.getItem('tryit_user') || 'admin@tryit.com');
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('expenses').insert([{
      submitted_by: userEmail,
      category,
      description,
      amount: parseFloat(amount)
    }]);
    setIsModalOpen(false);
    setDescription(''); setAmount('');
    fetchExpenses();
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected' | 'paid') => {
    await supabase.from('expenses').update({ status }).eq('id', id);
    fetchExpenses();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold uppercase">Paid</span>;
    if (status === 'approved') return <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-bold uppercase">Approved</span>;
    if (status === 'rejected') return <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold uppercase">Rejected</span>;
    return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold uppercase">Pending</span>;
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Wallet className="text-purple-500" size={32} /> Expense Management
          </h1>
          <p className="text-gray-500">Submit, approve, and track company reimbursements.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-purple-500/30"
        >
          <Plus size={18} /> Submit Expense
        </button>
      </div>

      {/* Expense Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--background)]/50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold">Employee</th>
              <th className="p-5 font-semibold">Description</th>
              <th className="p-5 font-semibold">Amount</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-[var(--background)]/30 transition-colors">
                <td className="p-5">
                  <p className="font-bold text-[var(--foreground)]">{expense.submitted_by.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{new Date(expense.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-5">
                  <p className="text-sm font-medium">{expense.description}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded mt-1 inline-block">{expense.category}</span>
                </td>
                <td className="p-5 font-bold text-lg flex items-center"><IndianRupee size={16}/>{expense.amount}</td>
                <td className="p-5">{getStatusBadge(expense.status)}</td>
                <td className="p-5 text-right">
                  {expense.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAction(expense.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><XCircle size={18}/></button>
                      <button onClick={() => handleAction(expense.id, 'approved')} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition-colors">Approve</button>
                    </div>
                  )}
                  {expense.status === 'approved' && (
                    <button onClick={() => handleAction(expense.id, 'paid')} className="px-3 py-1.5 bg-green-500 text-white hover:bg-green-600 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-green-500/20">Mark as Paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-[var(--background)] border border-[var(--card-border)] p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Receipt className="text-purple-500"/> New Expense</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-purple-500">
                  <option value="software">Software / Subscriptions</option>
                  <option value="marketing">Marketing / Ads</option>
                  <option value="travel">Travel</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                <input required type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Canva Pro Subscription" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount (₹)</label>
                <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-purple-500" />
              </div>
              
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl mt-4 transition-transform hover:scale-[1.02] shadow-lg shadow-purple-500/30">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
