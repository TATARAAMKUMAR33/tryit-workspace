'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, Flag, Trash2, EyeOff, UserX, 
  CheckCircle, RefreshCw, AlertOctagon, CheckSquare
} from 'lucide-react';

export default function ModerationHub() {
  const [activeTab, setActiveTab] = useState<'reports' | 'bans'>('reports');
  const [reportedPosts, setReportedPosts] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bulk Selection State
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: reports } = await supabase.from('bharat_pulse').select('*').gt('report_count', 0).order('report_count', { ascending: false });
    const { data: bans } = await supabase.from('user_bans').select('*').order('created_at', { ascending: false });
    if (reports) setReportedPosts(reports);
    if (bans) setBannedUsers(bans);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePostSelection = (id: string) => {
    setSelectedPosts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleBulkHide = async () => {
    if (selectedPosts.length === 0) return;
    await supabase.from('bharat_pulse').update({ is_hidden: true }).in('id', selectedPosts);
    setSelectedPosts([]);
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`Permanently delete ${selectedPosts.length} posts?`)) return;
    await supabase.from('bharat_pulse').delete().in('id', selectedPosts);
    setSelectedPosts([]);
    fetchData();
  };

  const handleBanUser = async (email: string, type: string) => {
    const reason = prompt(`Enter reason for banning ${email}:`);
    if (!reason) return;
    await supabase.from('user_bans').upsert([{ user_email: email, reason: reason, ban_type: type }], { onConflict: 'user_email' });
    alert(`${email} has been banned (${type}).`);
    fetchData();
  };

  const handleUnban = async (email: string) => {
    await supabase.from('user_bans').delete().eq('user_email', email);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-24 relative">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} /> Moderation Hub
          </h1>
          <p className="text-gray-500">Review reported content and enforce platform discipline.</p>
        </div>
        <div className="flex bg-[var(--card-bg)] p-1 rounded-xl border border-[var(--card-border)]">
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'reports' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}>
            <Flag size={16} /> Reports
          </button>
          <button onClick={() => setActiveTab('bans')} className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${activeTab === 'bans' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}>
            <UserX size={16} /> Bans
          </button>
        </div>
      </div>

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reportedPosts.length === 0 ? (
            <div className="text-center py-20 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)]">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold">All Clear!</h3>
              <p className="text-gray-500">No reported posts to review.</p>
            </div>
          ) : (
            reportedPosts.map(post => (
              <div key={post.id} className={`bg-[var(--card-bg)] border rounded-3xl p-6 shadow-lg flex gap-6 transition-all ${selectedPosts.includes(post.id) ? 'border-blue-500' : 'border-red-500/30'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="checkbox" 
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                      {post.author_email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--foreground)]">{post.author_email.split('@')[0]}</p>
                      <p className="text-xs text-gray-500">{post.author_role.replace('_', ' ')}</p>
                    </div>
                    <div className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Flag size={12} /> {post.report_count} Reports
                    </div>
                  </div>
                  <p className="text-[var(--foreground)] bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)]">{post.content}</p>
                </div>
                <div className="w-48 flex flex-col justify-center gap-2 border-l border-[var(--card-border)] pl-6">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Quick Actions</p>
                  <button onClick={() => handleBanUser(post.author_email, '24h')} className="w-full bg-gray-500/10 text-gray-600 hover:bg-gray-800 hover:text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <UserX size={16} /> Ban 24h
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'bans' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)]/50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-5 font-semibold">User Email</th>
                <th className="p-5 font-semibold">Ban Type</th>
                <th className="p-5 font-semibold">Reason</th>
                <th className="p-5 font-semibold">Date</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {bannedUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No users are currently banned.</td></tr>
              ) : (
                bannedUsers.map(ban => (
                  <tr key={ban.id} className="hover:bg-[var(--background)]/30 transition-colors">
                    <td className="p-5 font-semibold text-red-500 flex items-center gap-2"><AlertOctagon size={16} /> {ban.user_email}</td>
                    <td className="p-5"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ban.ban_type === 'permanent' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>{ban.ban_type}</span></td>
                    <td className="p-5 text-sm text-gray-600 dark:text-gray-300">{ban.reason}</td>
                    <td className="p-5 text-sm text-gray-500">{new Date(ban.created_at).toLocaleDateString()}</td>
                    <td className="p-5 text-right">
                      <button onClick={() => handleUnban(ban.user_email)} className="px-4 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold transition-colors">Unban User</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedPosts.length > 0 && activeTab === 'reports' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-fade-up border border-slate-700">
          <div className="flex items-center gap-2 font-bold">
            <CheckSquare size={20} className="text-blue-400" />
            {selectedPosts.length} Posts Selected
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex gap-2">
            <button onClick={handleBulkHide} className="px-4 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
              <EyeOff size={16}/> Hide All
            </button>
            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
              <Trash2 size={16}/> Delete All
            </button>
          </div>
          <button onClick={() => setSelectedPosts([])} className="text-gray-400 hover:text-white ml-2">✕</button>
        </div>
      )}

    </div>
  );
}
