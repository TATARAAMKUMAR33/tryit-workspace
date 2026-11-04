'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Gavel, RefreshCw, CheckCircle2, XCircle, Clock, Search, IndianRupee } from 'lucide-react';

export default function Disputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [payoutDisputes, setPayoutDisputes] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('disputes');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const user = localStorage.getItem('tryit_user') || '';

  const fetchData = async () => {
    setLoading(true);
    const [d, p, r] = await Promise.all([
      supabase.from('disputes').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('payout_disputes').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('refund_requests').select('*').order('created_at', { ascending: false }).limit(30),
    ]);
    if (d.data) setDisputes(d.data);
    if (p.data) setPayoutDisputes(p.data);
    if (r.data) setRefunds(r.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resolveItem = async (id: string, table: string, resolution: string, status: string) => {
    await supabase.from(table).update({ status, resolved_by: user, resolution_note: resolution, resolved_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user, action: `DISPUTE_${status.toUpperCase()}`, details: { item_id: id, table, resolution } }]);
    setSelected(null);
    fetchData();
  };

  const updateRefundStatus = async (id: string, status: string) => {
    await supabase.from('refund_requests').update({ status, reviewed_by: user, reviewed_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user, action: `REFUND_${status.toUpperCase()}`, details: { refund_id: id } }]);
    fetchData();
  };

  const getStatusColor = (status: string) => {
    if (status === 'resolved' || status === 'approved') return 'text-green-500 bg-green-500/10';
    if (status === 'rejected' || status === 'dismissed') return 'text-red-500 bg-red-500/10';
    return 'text-yellow-500 bg-yellow-500/10';
  };

  const allItems = activeTab === 'disputes' ? disputes : activeTab === 'payouts' ? payoutDisputes : refunds;
  const filtered = allItems.filter(i => {
    const str = JSON.stringify(i).toLowerCase();
    return !search || str.includes(search.toLowerCase());
  });

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Gavel className="text-red-500" size={32}/> Dispute Resolution</h1>
        <p className="text-gray-500">
          {disputes.filter(d => d.status === 'open').length} open disputes ·
          {payoutDisputes.filter(d => d.status === 'pending').length} payout disputes ·
          {refunds.filter(r => r.status === 'pending').length} refund requests
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'disputes', label: `Disputes (${disputes.length})` },
          { id: 'payouts', label: `Payout Disputes (${payoutDisputes.length})` },
          { id: 'refunds', label: `Refund Requests (${refunds.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? 'bg-red-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none"/>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-6 max-w-lg w-full">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">Resolve Dispute</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="bg-[var(--card-bg)] rounded-xl p-4 mb-4 text-sm space-y-1">
              {Object.entries(selected).filter(([k]) => !['id'].includes(k)).slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-gray-500 w-32 shrink-0 text-xs">{k.replace(/_/g, ' ')}:</span>
                  <span className="text-xs">{String(v).substring(0, 80)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => resolveItem(selected.id, 'disputes', 'Resolved in favor of student', 'resolved')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={16}/> Resolve
              </button>
              <button onClick={() => resolveItem(selected.id, 'disputes', 'Dismissed after review', 'dismissed')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <XCircle size={16}/> Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
            <p className="font-bold">No {activeTab} found</p>
          </div>
        ) : activeTab === 'refunds' ? (
          filtered.map(r => (
            <div key={r.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <IndianRupee size={20} className="text-green-500"/>
                <div>
                  <p className="font-bold">{r.user_email || r.student_email}</p>
                  <p className="text-xs text-gray-500">{r.reason} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {r.amount && <span className="font-black text-green-500 text-lg">₹{r.amount}</span>}
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${getStatusColor(r.status || 'pending')}`}>{r.status || 'pending'}</span>
                {(!r.status || r.status === 'pending' || r.status === 'initiated') && (
                  <div className="flex gap-2">
                    <button onClick={() => updateRefundStatus(r.id, 'approved')} className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg"><CheckCircle2 size={16}/></button>
                    <button onClick={() => updateRefundStatus(r.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg"><XCircle size={16}/></button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Clock size={18} className={item.status === 'open' || item.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}/>
                <div>
                  <p className="font-bold text-sm">{item.mentor_email || item.user_email || item.student_email || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{item.reason || item.dispute_reason || 'No reason provided'}</p>
                  <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.amount && <span className="font-black text-lg">₹{item.amount}</span>}
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${getStatusColor(item.status || 'pending')}`}>{item.status || 'pending'}</span>
                {(item.status === 'open' || item.status === 'pending') && (
                  <button onClick={() => setSelected(item)} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold">
                    Review
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}