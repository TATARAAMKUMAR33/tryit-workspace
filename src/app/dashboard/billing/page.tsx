'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CreditCard,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  X,
  Download,
  Search
} from 'lucide-react';;
import { exportToCSV } from '@/lib/exportCsv';

type InvoiceType = {
  id: string;
  client_email: string;
  client_type: 'student' | 'institution' | 'mentor';
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  created_at: string;
};

export default function BillingHub() {
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [clientEmail, setClientEmail] = useState('');
  const [clientType, setClientType] = useState<'student' | 'institution' | 'mentor'>('student');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDays, setDueDays] = useState('7');

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (data) setInvoices(data as InvoiceType[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueDays));

    const { error } = await supabase.from('invoices').insert([{
      client_email: clientEmail,
      client_type: clientType,
      description,
      amount: parseFloat(amount),
      due_date: dueDate.toISOString(),
      status: 'pending'
    }]);

    if (!error) {
      setIsModalOpen(false);
      setClientEmail(''); setDescription(''); setAmount('');
      fetchInvoices();
    } else {
      alert("Error: " + error.message);
    }
  };

  const markAsPaid = async (id: string) => {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', id);
    fetchInvoices();
  };

  // Calculate metrics
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
  const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueRevenue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0);

  const getStatusColor = (status: string) => {
    if (status === 'paid') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (status === 'overdue') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  };

  if (loading) return <div className="flex justify-center py-20 text-blue-500 animate-pulse">Loading Billing Data...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <CreditCard className="text-blue-500" size={32} /> Billing & Invoices
          </h1>
          <p className="text-gray-500">Manage platform revenue, subscriptions, and institution fees.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(invoices, 'TryIT_Invoices')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-green-500/30">
            <Download size={18} /> Export CSV
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-blue-500/30">
            <Plus size={18} /> Generate Invoice
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Collected Revenue</p>
          </div>
          <h3 className="text-3xl font-black text-[var(--foreground)] flex items-center"><IndianRupee size={24}/> {totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-yellow-500" size={20} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Payments</p>
          </div>
          <h3 className="text-3xl font-black text-[var(--foreground)] flex items-center"><IndianRupee size={24}/> {pendingRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Overdue</p>
          </div>
          <h3 className="text-3xl font-black text-red-500 flex items-center"><IndianRupee size={24}/> {overdueRevenue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)]/50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-5 font-semibold">Client / ID</th>
                <th className="p-5 font-semibold">Description</th>
                <th className="p-5 font-semibold">Amount</th>
                <th className="p-5 font-semibold">Due Date</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[var(--background)]/30 transition-colors">
                  <td className="p-5">
                    <p className="font-bold text-[var(--foreground)]">{inv.client_email}</p>
                    <span className="text-xs text-blue-500 uppercase font-bold tracking-wider">{inv.client_type}</span>
                  </td>
                  <td className="p-5 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{inv.description}</td>
                  <td className="p-5 font-bold text-lg">₹{Number(inv.amount).toLocaleString()}</td>
                  <td className="p-5 text-sm text-gray-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status !== 'paid' && (
                        <button onClick={() => markAsPaid(inv.id)} className="px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                          Mark Paid
                        </button>
                      )}
                      <button className="p-2 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white rounded-lg transition-colors" title="Download Invoice">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-[var(--background)] border border-[var(--card-border)] p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="text-blue-500"/> New Invoice</h2>
            
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Client Email</label>
                <input required type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="student@gmail.com" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Client Type</label>
                <select value={clientType} onChange={e => setClientType(e.target.value as any)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-blue-500">
                  <option value="student">Student</option>
                  <option value="institution">Institution</option>
                  <option value="mentor">Mentor (Commission)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                <input required type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="UPSC Test Series - 1 Year" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Amount (₹)</label>
                  <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Due In (Days)</label>
                  <input required type="number" value={dueDays} onChange={e => setDueDays(e.target.value)} placeholder="7" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4 transition-transform hover:scale-[1.02] shadow-lg shadow-blue-500/30">
                Generate & Send Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


