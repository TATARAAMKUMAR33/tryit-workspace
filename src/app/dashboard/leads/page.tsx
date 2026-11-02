'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Plus, RefreshCw, User } from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const columns = [
    { id: 'lead', title: 'New Leads' },
    { id: 'contacted', title: 'Contacted' },
    { id: 'demo', title: 'Demo Scheduled' },
    { id: 'closed', title: 'Closed (Won)' },
  ];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-purple-500" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up h-[80vh] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3"><Target className="text-purple-500" size={32} /> B2B Sales Pipeline</h1>
          <p className="text-gray-500">Track coaching centers and institutions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {columns.map(col => {
          const colLeads = leads.filter(l => l.status === col.id);
          return (
            <div key={col.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-4 flex flex-col h-full">
              <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4 px-2">{col.title} ({colLeads.length})</h3>
              <div className="flex-1 overflow-y-auto space-y-3">
                {colLeads.map(lead => (
                  <div key={lead.id} className="bg-[var(--background)] border border-[var(--card-border)] p-4 rounded-xl shadow-sm">
                    <h4 className="font-bold text-[var(--foreground)] text-sm">{lead.institution_name}</h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><User size={12}/> {lead.contact_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{lead.email}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
