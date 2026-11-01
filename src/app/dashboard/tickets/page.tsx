'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Ticket, Clock, CheckCircle2, AlertCircle, MessageSquare, 
  User, RefreshCw, CheckSquare, Send, Star, Lock, 
  IndianRupee, Code, Lightbulb, BookOpen
} from 'lucide-react';

type TicketType = {
  id: string;
  student_email: string;
  issue_type: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  assigned_to: string | null;
  staff_reply: string | null;
  internal_notes: string | null;
  csat_rating: number | null;
  intent: string;
  sla_deadline: string | null;
  kb_used_id: string | null;
};

type MacroType = { id: string; title: string; content: string; };
type KBType = { id: string; title: string; content: string; };

export default function CRMHub() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [macros, setMacros] = useState<MacroType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  
  // Reply State
  const [replyText, setReplyText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'reply' | 'internal'>('reply');
  
  // Deflection Engine State
  const [suggestedArticles, setSuggestedArticles] = useState<KBType[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [isSearchingKb, setIsSearchingKb] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().getTime()), 60000);
    fetchData();
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [ticketsRes, macrosRes] = await Promise.all([
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('canned_responses').select('*')
    ]);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    if (macrosRes.data) setMacros(macrosRes.data);
    setLoading(false);
  };

  // --- DEFLECTION ENGINE LOGIC ---
  const handleFindKbArticle = async () => {
    if (!selectedTicket) return;
    setIsSearchingKb(true);
    setSuggestedArticles([]);
    
    // Search KB using the ticket's issue type and description keywords
    const searchTerms = `${selectedTicket.issue_type} ${selectedTicket.description}`.split(' ').filter(w => w.length > 3).join(' | ');
    
    const { data } = await supabase
      .from('knowledge_base')
      .select('id, title, content')
      .textSearch('title', searchTerms, { type: 'websearch' }) // Using Postgres full-text search
      .limit(3);

    if (data && data.length > 0) {
      setSuggestedArticles(data);
    } else {
      // Fallback to simple ilike search if full-text fails
      const { data: fallback } = await supabase
        .from('knowledge_base')
        .select('id, title, content')
        .ilike('title', `%${selectedTicket.issue_type.split(' ')[0]}%`)
        .limit(3);
      if (fallback) setSuggestedArticles(fallback);
    }
    setIsSearchingKb(false);
  };

  const applyKbArticle = (article: KBType) => {
    setReplyText(article.content);
    setSelectedKbId(article.id);
    setSuggestedArticles([]); // Hide suggestions after applying
  };

  // --- ACTIONS ---
  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (newStatus: 'open' | 'in_progress' | 'resolved') => {
    if (selectedIds.length === 0) return;
    setTickets(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, status: newStatus } : t));
    await supabase.from('tickets').update({ status: newStatus }).in('id', selectedIds);
    setSelectedIds([]);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSending(true);
    
    const { error } = await supabase.from('tickets').update({ 
      staff_reply: replyText, 
      status: 'resolved', 
      assigned_to: localStorage.getItem('tryit_user') || 'admin',
      kb_used_id: selectedKbId // Track if this was a deflection!
    }).eq('id', selectedTicket.id);
    
    if (!error) { 
      // Log deflection if KB was used
      if (selectedKbId) {
        await supabase.from('audit_logs').insert([{
          user_email: localStorage.getItem('tryit_user') || 'admin',
          action: 'KB_DEFLECTION_SUCCESS',
          details: { ticket_id: selectedTicket.id, kb_id: selectedKbId }
        }]);
      }
      setReplyText(''); 
      setSelectedTicket(null); 
      setSelectedKbId(null);
      fetchData(); 
    }
    setIsSending(false);
  };

  const handleSaveNote = async () => {
    if (!selectedTicket) return;
    await supabase.from('tickets').update({ internal_notes: internalNote }).eq('id', selectedTicket.id);
    alert('Internal note saved.');
    fetchData();
  };

  const applyMacro = (macroId: string) => {
    const macro = macros.find(m => m.id === macroId);
    if (macro) setReplyText(macro.content);
  };

  const getSlaStatus = (deadline: string | null) => {
    if (!deadline) return { label: 'No SLA', color: 'text-gray-400', bg: 'bg-gray-500/10' };
    const diff = new Date(deadline).getTime() - currentTime;
    const minsLeft = Math.floor(diff / 60000);
    const hoursLeft = Math.floor(minsLeft / 60);

    if (minsLeft < 0) return { label: 'BREACHED', color: 'text-white', bg: 'bg-red-600 animate-pulse' };
    if (minsLeft < 30) return { label: `${minsLeft}m left`, color: 'text-red-500', bg: 'bg-red-500/10' };
    if (hoursLeft < 2) return { label: `${hoursLeft}h ${minsLeft % 60}m`, color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { label: `${hoursLeft}h left`, color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const getIntentBadge = (intent: string) => {
    if (intent === 'finance') return <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20"><IndianRupee size={10}/> FINANCE</span>;
    if (intent === 'tech') return <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-500/10 text-purple-500 px-2 py-1 rounded border border-purple-500/20"><Code size={10}/> TECH</span>;
    return <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-1 rounded border border-blue-500/20"><MessageSquare size={10}/> GENERAL</span>;
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  const columns = [
    { id: 'open', title: 'Open', icon: AlertCircle, color: 'text-yellow-500' },
    { id: 'in_progress', title: 'In Progress', icon: Clock, color: 'text-blue-500' },
    { id: 'resolved', title: 'Resolved', icon: CheckCircle2, color: 'text-green-500' },
  ];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 opacity-0 animate-fade-up pb-24 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3"><Ticket className="text-blue-500" size={32} /> Smart CRM Hub</h1>
          <p className="text-gray-500">AI intent routing, live SLA tracking, and KB deflection.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTickets = tickets.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl p-4 flex flex-col h-[75vh]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--foreground)]"><col.icon size={20} className={col.color} /> {col.title}</h3>
                <span className="bg-[var(--background)] text-gray-500 text-xs font-bold px-2.5 py-1 rounded-lg border border-[var(--card-border)]">{colTickets.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {colTickets.map(ticket => {
                  const sla = getSlaStatus(ticket.sla_deadline);
                  return (
                    <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); setReplyText(ticket.staff_reply || ''); setInternalNote(ticket.internal_notes || ''); setActiveTab('reply'); setSuggestedArticles([]); setSelectedKbId(ticket.kb_used_id); }} className={`bg-[var(--background)] p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${selectedIds.includes(ticket.id) ? 'border-blue-500' : 'border-[var(--card-border)] hover:border-blue-500/50'}`}>
                      
                      <div className="flex justify-between items-center mb-3">
                        {getIntentBadge(ticket.intent)}
                        <div className={`text-[10px] font-bold px-2 py-1 rounded ${sla.bg} ${sla.color}`}>SLA: {sla.label}</div>
                      </div>

                      <h4 className="font-bold text-sm text-[var(--foreground)] mb-1">{ticket.issue_type}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{ticket.description}</p>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-[var(--card-border)]">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={selectedIds.includes(ticket.id)} onChange={(e) => toggleSelection(e as any, ticket.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ticket.kb_used_id && <span title="Solved via KB Deflection"><BookOpen size={12} className="text-green-500"/></span>}
                          <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{ticket.assigned_to ? ticket.assigned_to.split('@')[0] : 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-fade-up border border-slate-700">
          <div className="flex items-center gap-2 font-bold"><CheckSquare size={20} className="text-blue-400" /> {selectedIds.length} Selected</div>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('in_progress')} className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-sm font-bold">In Progress</button>
            <button onClick={() => handleBulkAction('resolved')} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl text-sm font-bold">Resolved</button>
          </div>
          <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-[var(--background)] border border-[var(--card-border)] p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${getPriorityColor(selectedTicket.priority)}`}><AlertCircle size={24} /></div>
              <div><h2 className="text-xl font-bold">{selectedTicket.issue_type}</h2><p className="text-sm text-gray-500">{selectedTicket.student_email}</p></div>
            </div>
            <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)] mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedTicket.description}</p>
            </div>

            <div className="flex border-b border-[var(--card-border)] mb-4">
              <button onClick={() => setActiveTab('reply')} className={`px-4 py-2 font-bold text-sm border-b-2 ${activeTab === 'reply' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'}`}><MessageSquare size={14} className="inline mr-1"/> Reply</button>
              <button onClick={() => setActiveTab('internal')} className={`px-4 py-2 font-bold text-sm border-b-2 ${activeTab === 'internal' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500'}`}><Lock size={14} className="inline mr-1"/> Internal Notes</button>
            </div>

            {activeTab === 'reply' ? (
              <div className="space-y-4 relative">
                
                {/* Deflection Actions */}
                <div className="flex justify-between items-center bg-[var(--card-bg)] p-2 rounded-xl border border-[var(--card-border)]">
                  <button onClick={handleFindKbArticle} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                    <Lightbulb size={14}/> {isSearchingKb ? 'Searching...' : 'Suggest KB Article'}
                  </button>
                  
                  <select onChange={(e) => { applyMacro(e.target.value); e.target.value = ''; }} className="bg-transparent border border-gray-500/30 text-xs rounded-lg px-2 py-1.5 focus:outline-none">
                    <option value="">Insert Macro...</option>
                    {macros.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>

                {/* Suggested Articles Dropdown */}
                {suggestedArticles.length > 0 && (
                  <div className="absolute top-12 left-0 w-full bg-[var(--background)] border border-yellow-500/30 rounded-xl shadow-2xl z-20 overflow-hidden animate-fade-up">
                    <div className="p-2 bg-yellow-500/10 text-xs font-bold text-yellow-600 border-b border-yellow-500/20">Click to instantly insert:</div>
                    {suggestedArticles.map(art => (
                      <div key={art.id} onClick={() => applyKbArticle(art)} className="p-3 border-b border-[var(--card-border)] hover:bg-yellow-500/10 cursor-pointer group">
                        <p className="font-bold text-sm text-[var(--foreground)] group-hover:text-yellow-600 flex items-center gap-2"><BookOpen size={14}/> {art.title}</p>
                      </div>
                    ))}
                  </div>
                )}

                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 h-40 focus:outline-none focus:border-blue-500 resize-none text-sm leading-relaxed" />
                
                <div className="flex justify-between items-center">
                  {selectedKbId && <span className="text-xs font-bold text-green-500 flex items-center gap-1"><BookOpen size={14}/> KB Deflection Active</span>}
                  <div className="flex gap-3 ml-auto">
                    <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 text-gray-500">Cancel</button>
                    <button onClick={handleSendReply} disabled={isSending || !replyText.trim()} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2"><Send size={16}/> Send & Resolve</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Internal notes..." className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 h-32 focus:outline-none focus:border-orange-500 resize-none text-sm" />
                <div className="flex justify-end"><button onClick={handleSaveNote} className="px-6 py-2 bg-orange-500 text-white font-bold rounded-xl flex items-center gap-2"><CheckCircle2 size={16}/> Save Note</button></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
