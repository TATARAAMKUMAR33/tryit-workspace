'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldX, RefreshCw, Ban, CheckCircle2, Search, Smartphone, Globe, AlertTriangle } from 'lucide-react';

export default function SecurityCenter() {
  const [bans, setBans] = useState<any[]>([]);
  const [ipBans, setIpBans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('bans');
  const [banForm, setBanForm] = useState({ user_email: '', reason: '', ban_type: 'permanent' });
  const [ipForm, setIpForm] = useState({ ip_address: '', reason: '' });
  const user = localStorage.getItem('tryit_user') || '';

  const fetchData = async () => {
    setLoading(true);
    const [b, ip, s] = await Promise.all([
      supabase.from('user_bans').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('ip_bans').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('active_sessions').select('*').order('last_heartbeat', { ascending: false }).limit(30),
    ]);
    if (b.data) setBans(b.data);
    if (ip.data) setIpBans(ip.data);
    if (s.data) setSessions(s.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addBan = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('user_bans').upsert([{ ...banForm, banned_by: user }], { onConflict: 'user_email' });
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'USER_BANNED', details: banForm }]);
    setBanForm({ user_email: '', reason: '', ban_type: 'permanent' });
    fetchData();
  };

  const addIpBan = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('ip_bans').insert([{ ...ipForm, banned_by: user }]);
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'IP_BANNED', details: ipForm }]);
    setIpForm({ ip_address: '', reason: '' });
    fetchData();
  };

  const removeBan = async (id: string, email: string) => {
    await supabase.from('user_bans').delete().eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'USER_UNBANNED', details: { target: email } }]);
    fetchData();
  };

  const killSession = async (id: string, email: string) => {
    await supabase.from('active_sessions').delete().eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'SESSION_KILLED', details: { target_email: email } }]);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-emerald-500" size={40}/></div>;

  const filteredBans = bans.filter(b => !search || b.user_email?.includes(search));
  const filteredIpBans = ipBans.filter(b => !search || b.ip_address?.includes(search));
  const filteredSessions = sessions.filter(s => !search || s.user_email?.includes(search));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><ShieldX className="text-emerald-600" size={32}/> Security Center</h1>
        <p className="text-gray-500">{bans.length} banned accounts · {ipBans.length} banned IPs · {sessions.length} active sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
          <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><Ban size={16} className="text-red-500"/> Ban Account</h3>
          <form onSubmit={addBan} className="space-y-2">
            <input required placeholder="User email" value={banForm.user_email} onChange={e => setBanForm(p => ({ ...p, user_email: e.target.value }))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"/>
            <input required placeholder="Reason" value={banForm.reason} onChange={e => setBanForm(p => ({ ...p, reason: e.target.value }))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"/>
            <div className="flex gap-2">
              <select value={banForm.ban_type} onChange={e => setBanForm(p => ({ ...p, ban_type: e.target.value }))}
                className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary (7 days)</option>
                <option value="warning">Warning Only</option>
              </select>
              <button type="submit" className="px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm">Ban</button>
            </div>
          </form>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
          <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><Globe size={16} className="text-orange-500"/> Ban IP Address</h3>
          <form onSubmit={addIpBan} className="space-y-2">
            <input required placeholder="IP Address (e.g. 192.168.1.1)" value={ipForm.ip_address} onChange={e => setIpForm(p => ({ ...p, ip_address: e.target.value }))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"/>
            <div className="flex gap-2">
              <input required placeholder="Reason" value={ipForm.reason} onChange={e => setIpForm(p => ({ ...p, reason: e.target.value }))}
                className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"/>
              <button type="submit" className="px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm">Ban IP</button>
            </div>
          </form>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or IP..."
          className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500"/>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'bans', label: `Banned Accounts (${bans.length})` },
          { id: 'ip', label: `Banned IPs (${ipBans.length})` },
          { id: 'sessions', label: `Active Sessions (${sessions.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeTab === 'bans' && (
          filteredBans.length === 0
            ? <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center"><CheckCircle2 size={32} className="text-green-500 mx-auto mb-2"/><p className="text-gray-500">No banned accounts</p></div>
            : filteredBans.map(ban => (
              <div key={ban.id} className="bg-[var(--card-bg)] border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ban size={18} className="text-red-500"/>
                  <div>
                    <p className="font-bold text-sm">{ban.user_email}</p>
                    <p className="text-xs text-gray-500">{ban.reason} · {ban.ban_type} · {new Date(ban.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => removeBan(ban.id, ban.user_email)} className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold">
                  Unban
                </button>
              </div>
            ))
        )}

        {activeTab === 'ip' && (
          filteredIpBans.length === 0
            ? <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center"><CheckCircle2 size={32} className="text-green-500 mx-auto mb-2"/><p className="text-gray-500">No banned IPs</p></div>
            : filteredIpBans.map(ban => (
              <div key={ban.id} className="bg-[var(--card-bg)] border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-orange-500"/>
                  <div>
                    <p className="font-bold font-mono text-sm">{ban.ip_address}</p>
                    <p className="text-xs text-gray-500">{ban.reason} · {new Date(ban.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={async () => { await supabase.from('ip_bans').delete().eq('id', ban.id); fetchData(); }}
                  className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold">
                  Remove
                </button>
              </div>
            ))
        )}

        {activeTab === 'sessions' && (
          filteredSessions.length === 0
            ? <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center"><AlertTriangle size={32} className="text-gray-300 mx-auto mb-2"/><p className="text-gray-500">No active sessions</p></div>
            : filteredSessions.map(s => (
              <div key={s.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-blue-500"/>
                  <div>
                    <p className="font-bold text-sm">{s.user_email}</p>
                    <p className="text-xs text-gray-500 font-mono">{s.ip_address} · {s.device_hash?.substring(0, 16)}...</p>
                    <p className="text-xs text-gray-400">Last active: {new Date(s.last_heartbeat || s.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => killSession(s.id, s.user_email)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold">
                  Kill Session
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}