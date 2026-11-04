'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Plus, Hash, RefreshCw } from 'lucide-react';

export default function StaffChat() {
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = localStorage.getItem('tryit_user') || '';

  const fetchChannels = async () => {
    const { data } = await supabase.from('chat_channels').select('*').order('created_at');
    if (data) {
      setChannels(data);
      if (data.length > 0 && !activeChannel) setActiveChannel(data[0]);
    }
    setLoading(false);
  };

  const fetchMessages = async (channelId: string) => {
    const { data } = await supabase.from('chat_messages').select('*').eq('channel_id', channelId).order('created_at').limit(100);
    if (data) setMessages(data);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { fetchChannels(); }, []);

  useEffect(() => {
    if (!activeChannel) return;
    fetchMessages(activeChannel.id);

    const sub = supabase.channel(`chat-${activeChannel.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${activeChannel.id}` },
        (payload) => { setMessages(prev => [...prev, payload.new]); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeChannel]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChannel) return;
    setSending(true);
    await supabase.from('chat_messages').insert([{ channel_id: activeChannel.id, sender_email: user, content: text.trim() }]);
    setText('');
    setSending(false);
  };

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.trim()) return;
    const { data } = await supabase.from('chat_channels').insert([{ name: newChannel.toLowerCase().replace(/\s+/g, '-'), created_by: user }]).select().single();
    setNewChannel(''); setShowNewChannel(false);
    fetchChannels();
    if (data) setActiveChannel(data);
  };

  const getInitials = (email: string) => email?.[0]?.toUpperCase() || '?';
  const isOwn = (msg: any) => msg.sender_email === user;

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-pink-500" size={40}/></div>;

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden animate-fade-up">
      <div className="w-56 border-r border-[var(--card-border)] flex flex-col shrink-0">
        <div className="p-4 border-b border-[var(--card-border)]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-sm flex items-center gap-2"><MessageSquare size={16} className="text-pink-500"/> Channels</h2>
            <button onClick={() => setShowNewChannel(!showNewChannel)} className="p-1 text-gray-400 hover:text-pink-500 rounded">
              <Plus size={16}/>
            </button>
          </div>
          {showNewChannel && (
            <form onSubmit={createChannel} className="mt-2">
              <input value={newChannel} onChange={e => setNewChannel(e.target.value)} placeholder="channel-name"
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-pink-500"/>
              <button type="submit" className="w-full mt-1 bg-pink-500 text-white text-xs font-bold py-1 rounded-lg">Create</button>
            </form>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left ${activeChannel?.id === ch.id ? 'bg-pink-500/10 text-pink-500 font-bold' : 'text-gray-600 hover:bg-[var(--background)]'}`}>
              <Hash size={14}/>
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--card-border)]">
          <p className="text-xs text-gray-400 truncate">Logged in as</p>
          <p className="text-xs font-bold truncate">{user.split('@')[0]}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            <div className="h-12 border-b border-[var(--card-border)] flex items-center px-4 shrink-0">
              <Hash size={16} className="text-gray-400 mr-2"/>
              <span className="font-bold">{activeChannel.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : messages.map((msg, idx) => {
                const own = isOwn(msg);
                const prevMsg = messages[idx - 1];
                const showAvatar = !prevMsg || prevMsg.sender_email !== msg.sender_email;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                    {showAvatar ? (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${own ? 'bg-pink-500' : 'bg-blue-500'}`}>
                        {getInitials(msg.sender_email)}
                      </div>
                    ) : <div className="w-7 shrink-0"/>}
                    <div className={`max-w-xs lg:max-w-md ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && (
                        <span className={`text-[10px] text-gray-400 mb-1 ${own ? 'text-right' : 'text-left'}`}>
                          {msg.sender_email.split('@')[0]}
                        </span>
                      )}
                      <div className={`px-4 py-2 rounded-2xl text-sm ${own ? 'bg-pink-500 text-white rounded-br-sm' : 'bg-[var(--background)] border border-[var(--card-border)] rounded-bl-sm'}`}>
                        {msg.content}
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
              <input value={text} onChange={e => setText(e.target.value)} placeholder={`Message #${activeChannel.name}`}
                className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500"/>
              <button type="submit" disabled={sending || !text.trim()}
                className="bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                <Send size={18}/>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30"/>
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}