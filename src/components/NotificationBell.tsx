'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X, CheckCheck, MessageSquare, AlertTriangle, Info } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('staff_notifications')
      .select('*')
      .eq('to_email', user)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const sub = supabase
      .channel('notifications-' + user)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'staff_notifications',
        filter: `to_email=eq.${user}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    await supabase.from('staff_notifications').update({ read: true }).eq('to_email', user).eq('read', false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('staff_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getIcon = (type: string) => {
    if (type === 'dm') return <MessageSquare size={14} className="text-pink-500"/>;
    if (type === 'alert') return <AlertTriangle size={14} className="text-red-500"/>;
    if (type === 'ticket') return <AlertTriangle size={14} className="text-orange-500"/>;
    return <Info size={14} className="text-blue-500"/>;
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-gray-500/10 transition-colors">
        <Bell size={18} className="text-gray-500"/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
            <h3 className="font-bold text-sm">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  <CheckCheck size={12}/> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16}/>
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                className={`flex items-start gap-3 p-4 border-b border-[var(--card-border)] cursor-pointer hover:bg-[var(--card-bg)] transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleTimeString('en-IN')}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0"/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}