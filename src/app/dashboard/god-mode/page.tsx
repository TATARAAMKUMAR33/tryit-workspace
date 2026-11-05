'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert, RefreshCw, Send, Users, Globe,
  Smartphone, Monitor, TrendingUp, Zap, Bell,
  CheckCircle2, AlertTriangle, MapPin
} from 'lucide-react';

export default function GodMode() {
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState({
    totalOnline: 0, mobileUsers: 0, desktopUsers: 0,
    topState: '', topExam: '', newToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [cityBreakdown, setCityBreakdown] = useState<any[]>([]);
  const [examBreakdown, setExamBreakdown] = useState<any[]>([]);
  const user = localStorage.getItem('tryit_user') || '';

  const fetchData = async () => {
    setLoading(true);
    const [telemetry, ann, profiles, exams] = await Promise.all([
      supabase.from('user_telemetry').select('*').order('last_active', { ascending: false }).limit(100),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('city, state, plan, created_at').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('exam_submissions').select('exam_name').gte('submitted_at', new Date(Date.now() - 86400000).toISOString()),
    ]);

    if (telemetry.data) {
      setUsers(telemetry.data);
      const mobile = telemetry.data.filter(u => u.device_type === 'mobile').length;
      const online = telemetry.data.filter(u => u.last_active && new Date(u.last_active) > new Date(Date.now() - 300000)).length;

      const stateCounts: Record<string, number> = {};
      telemetry.data.forEach(u => { if (u.state) stateCounts[u.state] = (stateCounts[u.state] || 0) + 1; });
      const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      const cityData = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
      setCityBreakdown(cityData);

      setLiveStats({
        totalOnline: online,
        mobileUsers: mobile,
        desktopUsers: telemetry.data.length - mobile,
        topState,
        topExam: '',
        newToday: profiles.data?.length || 0
      });
    }

    if (ann.data) setAnnouncements(ann.data);

    if (exams.data) {
      const examCounts: Record<string, number> = {};
      exams.data.forEach((e: any) => { if (e.exam_name) examCounts[e.exam_name] = (examCounts[e.exam_name] || 0) + 1; });
      const examData = Object.entries(examCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
      setExamBreakdown(examData);
      if (examData[0]) setLiveStats(prev => ({ ...prev, topExam: examData[0].name }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await supabase.from('announcements').insert([{
      title, message, type, is_active: true
    }]);
    await supabase.from('audit_logs').insert([{
      user_email: user,
      action: 'BROADCAST_SENT',
      details: { title, type, message: message.substring(0, 100) }
    }]);
    setTitle(''); setMessage('');
    setSending(false);
    fetchData();
  };

  const deactivateAnnouncement = async (id: string) => {
    await supabase.from('announcements').update({ is_active: false }).eq('id', id);
    fetchData();
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-red-500" size={40}/>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShieldAlert className="text-red-600" size={32}/> God Mode
          </h1>
          <p className="text-gray-500">Live platform view, broadcast announcements, real-time user intelligence.</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Online Now', value: liveStats.totalOnline, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Mobile Users', value: liveStats.mobileUsers, icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Desktop Users', value: liveStats.desktopUsers, icon: Monitor, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'New Today', value: liveStats.newToday, icon: TrendingUp, color: 'text-teal-500', bg: 'bg-teal-500/10' },
          { label: 'Top State', value: liveStats.topState || '—', icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Top Exam', value: liveStats.topExam ? liveStats.topExam.split(' ')[0] : '—', icon: Globe, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
            <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center mx-auto mb-2`}>
              <card.icon size={16} className={card.color}/>
            </div>
            <div className={`text-xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Bell size={18} className="text-red-500"/> Broadcast to All Students
          </h2>
          <form onSubmit={handleBroadcast} className="space-y-3">
            <input required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Announcement title *"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"/>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="info">ℹ️ Information</option>
              <option value="warning">⚠️ Warning</option>
              <option value="success">✅ Success / Celebration</option>
              <option value="urgent">🚨 Urgent</option>
              <option value="offer">🎁 Offer / Promotion</option>
            </select>
            <textarea required value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Announcement message *" rows={4}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 resize-none"/>
            <button type="submit" disabled={sending}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <Send size={18}/> {sending ? 'Broadcasting...' : 'Broadcast Now'}
            </button>
          </form>
        </div>

        {/* City Breakdown */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-blue-500"/> Users by State
          </h2>
          {cityBreakdown.length === 0 ? (
            <p className="text-gray-500 text-sm">No telemetry data yet. Data populates as students use the app.</p>
          ) : cityBreakdown.map((city, idx) => {
            const max = cityBreakdown[0].count;
            const pct = Math.round((city.count / max) * 100);
            return (
              <div key={city.name} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{city.name}</span>
                  <span className="text-gray-500 font-bold">{city.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                </div>
              </div>
            );
          })}

          {examBreakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Exams Taken Today</h3>
              {examBreakdown.map(exam => (
                <div key={exam.name} className="flex justify-between items-center py-1.5 border-b border-[var(--card-border)] last:border-0">
                  <span className="text-sm truncate">{exam.name}</span>
                  <span className="text-xs font-black text-blue-500 ml-2">{exam.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live User Feed */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Users size={18} className="text-green-500"/> Recent Active Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                {['User', 'Device', 'OS', 'State', 'Connection', 'Last Active'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 15).map(u => (
                <tr key={u.id} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                  <td className="px-3 py-2 text-xs font-medium">{u.user_email?.split('@')[0] || 'Anonymous'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 capitalize">{u.device_type || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{u.os || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{u.state || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{u.connection_type || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {u.last_active ? new Date(u.last_active).toLocaleTimeString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Announcements */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Bell size={18} className="text-purple-500"/> Active Announcements
        </h2>
        {announcements.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2"/>
            <p className="text-gray-500 text-sm">No announcements sent yet</p>
          </div>
        ) : announcements.map(ann => (
          <div key={ann.id} className={`border rounded-2xl p-4 mb-3 ${
            !ann.is_active ? 'opacity-40 border-[var(--card-border)]' :
            ann.type === 'urgent' ? 'border-red-500/40 bg-red-500/5' :
            ann.type === 'warning' ? 'border-yellow-500/40 bg-yellow-500/5' :
            'border-[var(--card-border)]'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ann.type === 'urgent' ? 'bg-red-500 text-white' :
                    ann.type === 'warning' ? 'bg-yellow-500/20 text-yellow-600' :
                    ann.type === 'success' ? 'bg-green-500/20 text-green-600' :
                    ann.type === 'offer' ? 'bg-purple-500/20 text-purple-600' :
                    'bg-blue-500/20 text-blue-600'
                  }`}>{ann.type?.toUpperCase()}</span>
                  {ann.is_active && <span className="text-[10px] text-green-500 font-bold">● LIVE</span>}
                </div>
                <p className="font-bold">{ann.title}</p>
                <p className="text-sm text-gray-500 mt-1">{ann.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(ann.created_at).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {ann.is_active && (
                  <button onClick={() => deactivateAnnouncement(ann.id)}
                    className="px-3 py-1.5 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white rounded-lg text-xs font-bold">
                    Deactivate
                  </button>
                )}
                <button onClick={() => deleteAnnouncement(ann.id)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}