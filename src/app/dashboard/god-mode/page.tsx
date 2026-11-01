'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Globe, Smartphone, Monitor, MapPin, Megaphone, 
  ShieldAlert, Send, Zap, RefreshCw, MessageSquare
} from 'lucide-react';

export default function GodMode() {
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const fetchData = async () => {
    setLoading(true);
    const { data: usersData } = await supabase.from('user_telemetry').select('*').order('last_active', { ascending: false });
    const { data: annData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);
    if (annData) setAnnouncements(annData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds to get live user data
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('announcements').insert([{ title, message, type }]);
    setTitle(''); setMessage('');
    fetchData();
  };

  const forceReloadUser = async (email: string) => {
    // In a real app, this would update a 'force_reload' flag in the DB. 
    // The user's browser would listen for this change and auto-refresh.
    alert(`Sent Force Reload signal to ${email}'s device!`);
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-up">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} /> God Mode Command Center
          </h1>
          <p className="text-gray-500">Monitor live devices, broadcast announcements, and intervene.</p>
        </div>
        <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 flex items-center gap-2">
          <Zap size={16} /> SUPER ADMIN ACCESS
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe className="text-blue-500" /> Live User Devices ({users.length})
            </h2>
            
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-gray-500 italic">No users currently online. (Telemetry script not yet installed on student app).</p>
              ) : (
                users.map(user => (
                  <div key={user.id} className="bg-[var(--background)] border border-[var(--card-border)] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        {user.device_info?.includes('Mobile') ? <Smartphone size={20} /> : <Monitor size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[var(--foreground)]">{user.user_email}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <MapPin size={12} /> IP: {user.ip_address} | {user.device_info} | Page: {user.current_page}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => forceReloadUser(user.user_email)}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      Intervene
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Announcements */}
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Megaphone className="text-purple-500" /> Broadcast Announcement
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <input 
                type="text" 
                placeholder="Announcement Title" 
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                required
              />
              <textarea 
                placeholder="Message to all users..." 
                value={message} onChange={e => setMessage(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm h-24 focus:outline-none focus:border-purple-500 resize-none"
                required
              />
              <select 
                value={type} onChange={e => setType(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="success">Success (Green)</option>
              </select>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform shadow-lg shadow-purple-500/30">
                <Send size={16} /> Broadcast Now
              </button>
            </form>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Recent Broadcasts</h3>
            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className={`p-3 rounded-xl border ${ann.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' : ann.type === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                  <p className="font-bold text-sm text-[var(--foreground)]">{ann.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{ann.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
