'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, User, Ticket, BookOpen, X } from 'lucide-react';

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;
      
      // Search across multiple tables in parallel
      const [usersRes, ticketsRes, staffRes] = await Promise.all([
        supabase.from('user_telemetry').select('user_email').ilike('user_email', searchTerm).limit(3),
        supabase.from('tickets').select('id, issue_type, student_email').ilike('issue_type', searchTerm).limit(3),
        supabase.from('staff_roles').select('user_email, role').ilike('user_email', searchTerm).limit(3)
      ]);

      const combined = [
        ...(usersRes.data || []).map(u => ({ type: 'Student', title: u.user_email, url: '/dashboard/students', icon: User })),
        ...(ticketsRes.data || []).map(t => ({ type: 'Ticket', title: `${t.issue_type} (${t.student_email})`, url: '/dashboard/tickets', icon: Ticket })),
        ...(staffRes.data || []).map(s => ({ type: 'Staff', title: `${s.user_email} (${s.role})`, url: '/dashboard/staff', icon: BookOpen }))
      ];

      setResults(combined);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh]" onClick={onClose}>
      <div className="bg-[var(--background)] border border-[var(--card-border)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-[var(--card-border)]">
          <Search className="text-gray-400 mr-3" size={20} />
          <input 
            autoFocus
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, tickets, staff..." 
            className="flex-1 bg-transparent text-lg text-[var(--foreground)] focus:outline-none"
          />
          <button onClick={onClose} className="p-1 hover:bg-gray-500/20 rounded-md text-gray-500"><X size={18}/></button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>}
          {!loading && results.length === 0 && query && (
            <div className="p-4 text-center text-gray-500 text-sm">No results found for "{query}"</div>
          )}
          {!loading && results.length === 0 && !query && (
            <div className="p-4 text-center text-gray-500 text-sm">Type to start searching...</div>
          )}
          {results.map((res, i) => (
            <div 
              key={i} 
              onClick={() => { router.push(res.url); onClose(); }}
              className="flex items-center gap-3 p-3 hover:bg-blue-500/10 rounded-xl cursor-pointer transition-colors group"
            >
              <div className="p-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-gray-500 group-hover:text-blue-500 transition-colors">
                <res.icon size={18} />
              </div>
              <div>
                <p className="font-bold text-[var(--foreground)] text-sm">{res.title}</p>
                <p className="text-xs text-gray-500">{res.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
