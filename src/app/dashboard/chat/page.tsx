'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Plus, Hash, User, Search, RefreshCw } from 'lucide-react';

export default function StaffChat() {
  const [channels, setChannels] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [dms, setDms] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [searchStaff, setSearchStaff] = useState('');
  const [view, setView] = useState<'channels' | 'dms'>('channels');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = localStorage.getItem('tryit_user') || '';
  const role = localStorage.getItem('tryit_role') || '';

  const fetchChannels = async () => {
    const [ch, st, unread] = await Promise.all([
      supabase.from('chat_channels').select('*').order('name'),
      supabase.from('staff_roles').select('user_email, role, is_active, is_online').eq('is_active', true),
      supabase.from('staff_dms').select('from_email', { count: 'exact' }).eq('to_email', user).eq('read', false),
    ]);
    if (ch.data) { setChannels(ch.data); if (!activeChannel && ch.data.length > 0) setActiveChannel(ch.data[0]); }
    if (st.data) setStaff(st.data.filter(s => s.user_email !== user));
    setLoading(false);
  };

  const fetchMessages = async (channelId: string) => {
    const { data } = await supabase.from('chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at')
      .limit(100);
    if (data) setMessages(data);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const fetchDMs = async (otherEmail: string) => {
    const { data } = await supabase.from('staff_dms')
      .select('*')
      .or(`and(from_email.eq.${user},to_email.eq.${otherEmail}),and(from_email.eq.${otherEmail},to_email.eq.${user})`)
      .order('created_at');
    if (data) setDms(data);
    await supabase.from('staff_dms').update({ read: true }).eq('from_email', otherEmail).eq('to_email', user);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { fetchChannels(); }, []);

  useEffect(() => {
    if (!activeChannel || view !== 'channels') return;
    fetchMessages(activeChannel.id);
    const sub = supabase.channel(`ch-${activeChannel.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `channel_id=eq.${activeChannel.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeChannel, view]);

  useEffect(() => {
    if (!activeDM || view !== 'dms') return;
    fetchDMs(activeDM);
    const sub = supabase.channel(`dm-${user}-${activeDM}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'staff_dms'
      }, (payload) => {
        const msg = payload.new as any;
        if ((msg.from_email === user && msg.to_email === activeDM) ||
            (msg.from_email === activeDM && msg.to_email === user)) {
          setDms(prev => [...prev, msg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeDM, view]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);

    if (view === 'channels' && activeChannel) {
      await supabase.from('chat_messages').insert([{
        channel_id: activeChannel.id,
        channel: activeChannel.name,
        sender_email: user,
        sender_role: role,
        message: text.trim()
      }]);
    } else if (view === 'dms' && activeDM) {
      await supabase.from('staff_dms').insert([{
        from_email: user,
        to_email: activeDM,
        content: text.trim()
      }]);
      await supabase.from('staff_notifications').insert([{
        to_email: activeDM,
        title: `DM from ${user.split('@')[0]}`,
        body: text.trim().substring(0, 80),
        type: 'dm',
        link: '/dashboard/chat'
      }]);
    }

    setText('');
    setSending(false);
  };

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.trim()) return;
    const name = newChannel.toLowerCase().replace(/\s+/g, '-');
    const { data } = await supabase.from('chat_channels').insert([{ name, is_active: true }]).select().single();
    setNewChannel(''); setShowNewChannel(false);
    fetchChannels();
    if (data) { setActiveChannel(data); setView('channels'); }
  };

  const getInitials = (email: string) => email?.[0]?.toUpperCase() || '?';
  const isOwn = (msg: any) => (msg.sender_email || msg.from_email) === user;
  const currentMessages = view === 'channels' ? messages : dms;
  const activeName = view === 'channels' ? activeChannel?.name : activeDM?.split('@')[0];
  const filteredStaff = staff.filter(s => !searchStaff || s.user_email.includes(searchStaff));

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-pink-500" size={40}/></div>;

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden animate-fade-up">
      {/* Sidebar */}
      <div className="w-60 border-r border-[var(--card-border)] flex flex-col shrink-0">
        <div className="p-3 border-b border-[var(--card-border)]">
          <div className="flex gap-1 mb-2">
            <button onClick={() => setView('channels')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold ${view === 'channels' ? 'bg-pink-500 text-white' : 'text-gray-500 hover:bg-[var(--background)]'}`}>
              <Hash size={12}/> Channels
            </button>
            <button onClick={() => setView('dms')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold ${view === 'dms' ? 'bg-pink-500 text-white' : 'text-gray-500 hover:bg-[var(--background)]'}`}>
              <User size={12}/> DMs
            </button>
          </div>
        </div>

        {view === 'channels' ? (
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Channels</span>
              <button onClick={() => setShowNewChannel(!showNewChannel)} className="text-gray-400 hover:text-pink-500">
                <Plus size={14}/>
              </button>
            </div>
            {showNewChannel && (
              <form onSubmit={createChannel} className="p-2 mb-1">
                <input value={newChannel} onChange={e => setNewChannel(e.target.value)} placeholder="channel-name"
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-pink-500 mb-1"/>
                <button type="submit" className="w-full bg-pink-500 text-white text-xs font-bold py-1 rounded-lg">Create</button>
              </form>
            )}
            {channels.map(ch => (
              <button key={ch.id} onClick={() => setActiveChannel(ch)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left ${activeChannel?.id === ch.id ? 'bg-pink-500/10 text-pink-500 font-bold' : 'text-gray-600 hover:bg-[var(--background)]'}`}>
                <Hash size={14} className="shrink-0"/>
                <span className="truncate text-xs">{ch.name}</span>
              </button>
            ))}
          </nav>
        ) : (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1.5 text-gray-400" size={12}/>
              <input value={searchStaff} onChange={e => setSearchStaff(e.target.value)} placeholder="Search staff..."
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-1.5 pl-7 pr-2 text-xs focus:outline-none"/>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">Staff</div>
            {filteredStaff.map(s => (
              <button key={s.user_email} onClick={() => setActiveDM(s.user_email)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${activeDM === s.user_email ? 'bg-pink-500/10 text-pink-500 font-bold' : 'text-gray-600 hover:bg-[var(--background)]'}`}>
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(s.user_email)}
                  </div>
                  {s.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--card-bg)]"/>}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{s.user_email.split('@')[0]}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{s.role?.replace('_', ' ')}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-[var(--card-border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{user.split('@')[0]}</p>
              <p className="text-[10px] text-green-500">🟢 Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {(activeChannel && view === 'channels') || (activeDM && view === 'dms') ? (
          <>
            <div className="h-12 border-b border-[var(--card-border)] flex items-center px-4 shrink-0 gap-2">
              {view === 'channels' ? <Hash size={16} className="text-gray-400"/> : <User size={16} className="text-gray-400"/>}
              <span className="font-bold text-sm">{activeName}</span>
              {view === 'dms' && activeDM && (
                <span className="text-xs text-gray-400">
                  · {staff.find(s => s.user_email === activeDM)?.role?.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : currentMessages.map((msg, idx) => {
                const msgEmail = msg.sender_email || msg.from_email;
                const msgContent = msg.message || msg.content;
                const own = msgEmail === user;
                const prevEmail = idx > 0 ? (currentMessages[idx-1].sender_email || currentMessages[idx-1].from_email) : null;
                const showAvatar = msgEmail !== prevEmail;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                    {showAvatar ? (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${own ? 'bg-pink-500' : 'bg-blue-500'}`}>
                        {getInitials(msgEmail)}
                      </div>
                    ) : <div className="w-7 shrink-0"/>}
                    <div className={`flex flex-col max-w-xs lg:max-w-md ${own ? 'items-end' : 'items-start'}`}>
                      {showAvatar && (
                        <span className="text-[10px] text-gray-400 mb-1">{msgEmail?.split('@')[0]}</span>
                      )}
                      <div className={`px-4 py-2 rounded-2xl text-sm ${own ? 'bg-pink-500 text-white rounded-br-sm' : 'bg-[var(--background)] border border-[var(--card-border)] rounded-bl-sm'}`}>
                        {msgContent}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef}/>
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-[var(--card-border)] flex gap-3">
              <input value={text} onChange={e => setText(e.target.value)}
                placeholder={view === 'dms' ? `Message ${activeDM?.split('@')[0]}...` : `Message #${activeChannel?.name}`}
                className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500"/>
              <button type="submit" disabled={sending || !text.trim()}
                className="bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white p-2.5 rounded-xl">
                <Send size={18}/>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30"/>
              <p className="font-bold">Select a channel or staff member</p>
              <p className="text-sm">Start a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}