'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, ShieldX, Trash2, Search, 
  RefreshCw, AlertOctagon, Globe, CheckCircle2
} from 'lucide-react';

export default function SecurityCenter() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'ip'>('privacy');
  const [loading, setLoading] = useState(false);
  
  // Privacy State
  const [searchEmail, setSearchEmail] = useState('');
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wipeStatus, setWipeStatus] = useState('');

  // IP Ban State
  const [bans, setBans] = useState<any[]>([]);
  const [newIp, setNewIp] = useState('');
  const [ipReason, setIpReason] = useState('');

  const fetchBans = async () => {
    const { data } = await supabase.from('ip_bans').select('*').order('created_at', { ascending: false });
    if (data) setBans(data);
  };

  useEffect(() => {
    if (activeTab === 'ip') fetchBans();
  }, [activeTab]);

  // --- ACTIONS ---
  const handleWipeData = async () => {
    if (!searchEmail.trim()) return;
    if (!wipeConfirm) {
      setWipeConfirm(true);
      return;
    }

    setLoading(true);
    setWipeStatus('Wiping all data...');
    
    // Call the PostgreSQL function
    const { error } = await supabase.rpc('wipe_user_data', { target_email: searchEmail });
    
    if (error) {
      setWipeStatus(`❌ Error: ${error.message}`);
    } else {
      setWipeStatus(`✅ Successfully erased all data for ${searchEmail}`);
      setSearchEmail('');
    }
    setWipeConfirm(false);
    setLoading(false);
  };

  const handleAddIpBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    
    await supabase.from('ip_bans').insert([{ ip_address: newIp, reason: ipReason }]);
    setNewIp(''); setIpReason('');
    fetchBans();
  };

  const removeIpBan = async (id: string) => {
    await supabase.from('ip_bans').delete().eq('id', id);
    fetchBans();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} /> Security & Privacy Center
          </h1>
          <p className="text-gray-500">Zero-trust data management and network firewall.</p>
        </div>
        <div className="flex bg-[var(--card-bg)] p-1 rounded-xl border border-[var(--card-border)]">
          <button onClick={() => setActiveTab('privacy')} className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'privacy' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}>
            <Trash2 size={16} /> Data Erasure
          </button>
          <button onClick={() => setActiveTab('ip')} className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'ip' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}>
            <Globe size={16} /> IP Blacklist
          </button>
        </div>
      </div>

      {/* PRIVACY TAB */}
      {activeTab === 'privacy' && (
        <div className="bg-[var(--card-bg)] border border-red-500/30 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6 border-b border-[var(--card-border)] pb-6">
            <div className="p-4 bg-red-500/10 rounded-2xl">
              <ShieldX className="text-red-500" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">The "Right to be Forgotten"</h2>
              <p className="text-sm text-gray-500">Instantly wipe a user from every table. This action is irreversible.</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Enter User Email</label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="email" 
                  value={searchEmail}
                  onChange={(e) => { setSearchEmail(e.target.value); setWipeConfirm(false); setWipeStatus(''); }}
                  placeholder="user@gmail.com"
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-[var(--foreground)] focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {wipeConfirm && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fade-up">
                <AlertOctagon className="text-red-500 mt-0.5" size={20} />
                <div>
                  <p className="font-bold text-red-500">Are you absolutely sure?</p>
                  <p className="text-sm text-red-400/80 mb-3">This will permanently delete all doubts, tickets, exam scores, and chat messages for <strong>{searchEmail}</strong>.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setWipeConfirm(false)} className="px-4 py-1.5 bg-gray-500/20 text-gray-500 font-bold rounded-lg text-sm">Cancel</button>
                    <button onClick={handleWipeData} disabled={loading} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm flex items-center gap-2">
                      {loading ? <RefreshCw className="animate-spin" size={16}/> : 'Yes, Erase Everything'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!wipeConfirm && (
              <button onClick={handleWipeData} disabled={!searchEmail || loading} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-50 transition-colors">
                Execute Data Erasure
              </button>
            )}

            {wipeStatus && (
              <div className={`p-4 rounded-xl text-sm font-bold border ${wipeStatus.includes('✅') ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                {wipeStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* IP BLACKLIST TAB */}
      {activeTab === 'ip' && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Globe className="text-red-500"/> Block an IP Address</h2>
            <form onSubmit={handleAddIpBan} className="flex gap-4">
              <input type="text" required value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.1" className="w-48 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-red-500" />
              <input type="text" required value={ipReason} onChange={e => setIpReason(e.target.value)} placeholder="Reason (e.g., API Scraper / DDoS)" className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-red-500" />
              <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 rounded-xl shadow-lg shadow-red-500/20 transition-colors">Block IP</button>
            </form>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--background)]/50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-5 font-semibold">IP Address</th>
                  <th className="p-5 font-semibold">Reason</th>
                  <th className="p-5 font-semibold">Date Blocked</th>
                  <th className="p-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {bans.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">No IPs are currently blacklisted.</td></tr>
                ) : (
                  bans.map(ban => (
                    <tr key={ban.id} className="hover:bg-[var(--background)]/30 transition-colors">
                      <td className="p-5 font-mono font-bold text-red-500">{ban.ip_address}</td>
                      <td className="p-5 text-sm text-gray-600 dark:text-gray-300">{ban.reason}</td>
                      <td className="p-5 text-sm text-gray-500">{new Date(ban.created_at).toLocaleString()}</td>
                      <td className="p-5 text-right">
                        <button onClick={() => removeIpBan(ban.id)} className="px-4 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold transition-colors">Unblock</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
