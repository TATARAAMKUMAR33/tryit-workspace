'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCheck, RefreshCw, CheckCircle2, XCircle, Search, Eye } from 'lucide-react';

export default function Verification() {
  const [queue, setQueue] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [viewing, setViewing] = useState<any>(null);
  const user = localStorage.getItem('tryit_user') || '';

  const fetchData = async () => {
    setLoading(true);
    const [q, r] = await Promise.all([
      supabase.from('verification_queue').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('verification_requests').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (q.data) setQueue(q.data);
    if (r.data) setRequests(r.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const reviewItem = async (id: string, table: string, status: 'approved' | 'rejected', notes?: string) => {
    await supabase.from(table).update({ status, reviewed_by: user, reviewed_at: new Date().toISOString(), review_notes: notes || '' }).eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user, action: `VERIFICATION_${status.toUpperCase()}`, details: { item_id: id, table } }]);
    setViewing(null);
    fetchData();
  };

  const getTypeColor = (type: string) => {
    if (type?.includes('disability') || type?.includes('disabled')) return 'text-purple-500 bg-purple-500/10';
    if (type?.includes('institution') || type?.includes('school')) return 'text-blue-500 bg-blue-500/10';
    if (type?.includes('identity') || type?.includes('id')) return 'text-green-500 bg-green-500/10';
    return 'text-gray-500 bg-gray-500/10';
  };

  const allItems = activeTab === 'queue' ? queue : requests;
  const filtered = allItems.filter(i => !search || i.user_email?.includes(search) || i.verification_type?.includes(search));
  const pending = filtered.filter(i => i.status === 'pending' || !i.status);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-lime-500" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><UserCheck className="text-lime-600" size={32}/> Verification Center</h1>
        <p className="text-gray-500">{pending.length} pending verifications</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: (queue.filter(q => q.status === 'pending').length + requests.filter(r => r.status === 'pending').length), color: 'text-yellow-500' },
          { label: 'Approved', value: (queue.filter(q => q.status === 'approved').length + requests.filter(r => r.status === 'approved').length), color: 'text-green-500' },
          { label: 'Rejected', value: (queue.filter(q => q.status === 'rejected').length + requests.filter(r => r.status === 'rejected').length), color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-center">
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {[{ id: 'queue', label: `Queue (${queue.length})` }, { id: 'requests', label: `Requests (${requests.length})` }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? 'bg-lime-600 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email..."
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none"/>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-8 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Review Verification</h2>
              <button onClick={() => setViewing(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 mb-6">
              {Object.entries(viewing).filter(([k]) => !['id','created_at','updated_at'].includes(k)).map(([key, val]) => (
                <div key={key} className="flex gap-3">
                  <span className="text-xs font-bold text-gray-500 w-32 shrink-0">{key.replace(/_/g, ' ')}:</span>
                  <span className="text-sm">{String(val)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => reviewItem(viewing.id, activeTab === 'queue' ? 'verification_queue' : 'verification_requests', 'approved')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 size={18}/> Approve
              </button>
              <button onClick={() => reviewItem(viewing.id, activeTab === 'queue' ? 'verification_queue' : 'verification_requests', 'rejected')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                <XCircle size={18}/> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
            <p className="font-bold">No verification items</p>
          </div>
        ) : filtered.map(item => (
          <div key={item.id} className={`bg-[var(--card-bg)] border rounded-2xl p-5 flex items-center justify-between ${item.status === 'pending' || !item.status ? 'border-yellow-500/30' : 'border-[var(--card-border)]'}`}>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-bold px-2 py-1 rounded ${getTypeColor(item.verification_type)}`}>
                {(item.verification_type || 'unknown').replace(/_/g, ' ').toUpperCase()}
              </span>
              <div>
                <p className="font-bold text-sm">{item.user_email}</p>
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                item.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                item.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                'bg-yellow-500/10 text-yellow-500'
              }`}>{item.status || 'pending'}</span>
              {(!item.status || item.status === 'pending') && (
                <button onClick={() => setViewing(item)}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1">
                  <Eye size={14}/> Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}