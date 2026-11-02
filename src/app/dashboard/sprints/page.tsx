'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Columns, Plus, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Sprints() {
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const fetchSprints = async () => {
    const { data } = await supabase.from('sprints').select('*').order('created_at', { ascending: false });
    if (data) setSprints(data);
    setLoading(false);
  };

  useEffect(() => { fetchSprints(); }, []);

  const createSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('sprints').insert([{ name }]);
    setName('');
    fetchSprints();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3"><Columns className="text-blue-500" size={32} /> Sprint Planning</h1>
          <p className="text-gray-500">Group tasks into sprints for focused execution.</p>
        </div>
      </div>

      <form onSubmit={createSprint} className="flex gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="New Sprint Name (e.g., Sprint 1 - UI Fixes)" className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-xl flex items-center gap-2"><Plus size={18}/> Create</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sprints.map(sprint => (
          <div key={sprint.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-[var(--card-border)] pb-4">
              <h3 className="font-bold text-lg text-[var(--foreground)]">{sprint.name}</h3>
              <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold uppercase">{sprint.status}</span>
            </div>
            <p className="text-sm text-gray-500">No tasks assigned to this sprint yet.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
