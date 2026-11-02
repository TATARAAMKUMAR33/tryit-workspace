'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Users, Ticket, Target, MessageSquare, 
  X, RefreshCw, LayoutDashboard, UserPlus 
} from 'lucide-react';

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // The Search Logic (Connects to all parts of the workspace)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;
      
      // Search across EVERY major table in parallel
      const [staffRes, teamsRes, ticketsRes, leadsRes, doubtsRes] = await Promise.all([
        supabase.from('staff_roles').select('user_email, role').ilike('user_email', searchTerm).limit(3),
        supabase.from('teams').select('name, description').ilike('name', searchTerm).limit(3),
        supabase.from('tickets').select('id, issue_type, student_email').ilike('issue_type', searchTerm).limit(3),
        supabase.from('leads').select('id, institution_name, contact_name').ilike('institution_name', searchTerm).limit(3),
        supabase.from('doubts').select('id, question, user_id').ilike('question', searchTerm).limit(3)
      ]);

      // Combine all results into one unified list
      const combined = [
        ...(staffRes.data || []).map(s => ({ type: 'Employee', title: s.user_email, subtitle: s.role, icon: Users, url: '/dashboard/staff' })),
        ...(teamsRes.data || []).map(t => ({ type: 'Team', title: t.name, subtitle: t.description, icon: UserPlus, url: '/dashboard/team' })),
        ...(ticketsRes.data || []).map(t => ({ type: 'Ticket', title: t.issue_type, subtitle: t.student_email, icon: Ticket, url: '/dashboard/tickets' })),
        ...(leadsRes.data || []).map(l => ({ type: 'B2B Lead', title: l.institution_name, subtitle: l.contact_name, icon: Target, url: '/dashboard/leads' })),
        ...(doubtsRes.data || []).map(d => ({ type: 'Doubt', title: d.question.substring(0, 40) + '...', subtitle: d.user_id, icon: MessageSquare, url: '/dashboard/qa' }))
      ];

      setResults(combined);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4 animate-fade-up" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200" onClick={e => e.stopPropagation()}>
        
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-gray-50/50">
          <Search className="text-blue-500 mr-3" size={22} />
          <input 
            autoFocus
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, teams, tickets, leads..." 
            className="flex-1 bg-transparent text-lg text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {loading && <RefreshCw className="animate-spin text-gray-400 mr-3" size={18} />}
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        
        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center">
              <LayoutDashboard size={40} className="mb-3 text-gray-300" />
              <p>Type to search the entire workspace...</p>
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-medium">
              No results found for "{query}"
            </div>
          )}

          {results.map((res, i) => (
            <div 
              key={i} 
              onClick={() => { router.push(res.url); onClose(); }}
              className="flex items-center gap-4 p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors">
                <res.icon size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800 group-hover:text-blue-700 text-sm">{res.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{res.type}</span>
                  <span className="text-xs text-gray-500">{res.subtitle}</span>
                </div>
              </div>
              <div className="ml-auto text-xs text-gray-400 group-hover:text-blue-500 font-medium">
                Jump to →
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
