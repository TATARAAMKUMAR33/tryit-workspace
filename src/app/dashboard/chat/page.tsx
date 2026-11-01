'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Hash, Send, Users, ShieldAlert, Zap, MessageSquare } from 'lucide-react';

type MessageType = {
  id: string;
  channel: string;
  sender_email: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export default function StaffChat() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  const [user, setUser] = useState({ email: 'tatu.ind@hotmail.com', role: 'super_admin' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channels = [
    { id: 'general', name: 'general', icon: Hash },
    { id: 'qa-team', name: 'qa-team', icon: Hash },
    { id: 'web-dev', name: 'web-dev', icon: Hash },
    { id: 'urgent-alerts', name: 'urgent-alerts', icon: ShieldAlert },
  ];

  useEffect(() => {
    // Load user from localStorage
    const email = localStorage.getItem('tryit_user') || 'tatu.ind@hotmail.com';
    const role = localStorage.getItem('tryit_role') || 'super_admin';
    setUser({ email, role });
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel', activeChannel)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (data) setMessages(data);
    scrollToBottom();
  };

  useEffect(() => {
    fetchMessages();

    // Simple polling for real-time effect every 3 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      channel: activeChannel,
      sender_email: user.email,
      sender_role: user.role,
      message: newMessage
    };

    setNewMessage('');
    await supabase.from('chat_messages').insert([msgData]);
    fetchMessages();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-2xl animate-fade-up">
      
      {/* Sidebar (Channels) */}
      <div className="w-64 bg-[var(--background)] border-r border-[var(--card-border)] flex flex-col">
        <div className="p-4 border-b border-[var(--card-border)]">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[var(--foreground)]">
            <MessageSquare className="text-blue-500" size={20} /> TryIT Chat
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-4">Channels</p>
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                activeChannel === channel.id 
                  ? 'bg-blue-500/10 text-blue-500 font-medium' 
                  : 'text-gray-500 hover:bg-[var(--card-bg)] hover:text-[var(--foreground)]'
              }`}
            >
              <channel.icon size={18} />
              {channel.name}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)] leading-tight">{user.email.split('@')[0]}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--card-bg)]">
        {/* Channel Header */}
        <div className="h-14 border-b border-[var(--card-border)] flex items-center px-6">
          <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
            <Hash className="text-gray-500" size={20} /> {activeChannel}
          </h3>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => {
            const isMe = msg.sender_email === user.email;
            const showHeader = index === 0 || messages[index - 1].sender_email !== msg.sender_email;

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                {showHeader ? (
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${
                    msg.sender_role === 'super_admin' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {msg.sender_email[0].toUpperCase()}
                  </div>
                ) : (
                  <div className="w-10 flex-shrink-0"></div>
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {showHeader && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-bold text-[var(--foreground)]">{msg.sender_email.split('@')[0]}</span>
                      <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] rounded-tl-sm'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-[var(--card-border)]">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${activeChannel}...`}
              className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50"
              disabled={!newMessage.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
