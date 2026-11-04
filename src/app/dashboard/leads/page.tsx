'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Plus, RefreshCw, Building2, Phone, Mail, ChevronRight } from 'lucide-react';

const STAGES = ['new', 'contacted', 'demo', 'proposal', 'closed_won', 'closed_lost'];
const STAGE_COLORS: Record<string, string> = {
  new: 'text-gray-500 bg-gray-500/10',
  contacted: 'text-blue-500 bg-blue-500/10',
  demo: 'text-yellow-500 bg-yellow-500/10',
  proposal: 'text-purple-500 bg-purple-500/10',
  closed_won: 'text-green-500 bg-green-500/10',
  closed_lost: 'text-red-500 bg-red-500/10',
};

export default function B2BLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ institution_name: '', contact_email: '', contact_phone: '', city: '', state: '', student_count: '', stage: 'new', notes: '' });

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('leads').insert([form]);
    setForm({ institution_name: '', contact_email: '', contact_phone: '', city: '', state: '', student_count: '', stage: 'new', notes: '' });
    setShowForm(false);
    fetchLeads();
  };

  const updateStage = async (id: string, stage: string) => {
    await supabase.from('leads').update({ stage }).eq('id', id);
    fetchLeads();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-rose-500" size={40}/></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Target className="text-rose-500" size={32}/> B2B Leads Pipeline</h1>
          <p className="text-gray-500">{leads.filter(l => l.stage === 'closed_won').length} won · {leads.filter(l => !['closed_won','closed_lost'].includes(l.stage)).length} active</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
          <Plus size={18}/> Add Lead
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">New B2B Lead</h2>
          <form onSubmit={createLead} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'institution_name', placeholder: 'Institution name *', required: true },
              { key: 'contact_email', placeholder: 'Contact email', type: 'email' },
              { key: 'contact_phone', placeholder: 'Phone number' },
              { key: 'city', placeholder: 'City' },
              { key: 'state', placeholder: 'State' },
              { key: 'student_count', placeholder: 'Number of students', type: 'number' },
            ].map(field => (
              <input key={field.key} required={field.required} type={field.type || 'text'}
                placeholder={field.placeholder} value={(form as any)[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"/>
            ))}
            <textarea placeholder="Notes" value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 md:col-span-2 resize-none h-20"/>
            <div className="flex gap-3 items-end">
              <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl">Save Lead</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-500/10 text-gray-500 rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-2">
        {STAGES.map(stage => (
          <div key={stage} className={`rounded-xl p-3 text-center ${STAGE_COLORS[stage]}`}>
            <div className="text-2xl font-black">{leads.filter(l => l.stage === stage).length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1">{stage.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <Building2 size={48} className="text-gray-300 mx-auto mb-4"/>
            <h3 className="text-xl font-bold">No leads yet</h3>
            <p className="text-gray-500">Add your first B2B lead to get started</p>
          </div>
        ) : leads.map(lead => (
          <div key={lead.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Building2 className="text-rose-500" size={24}/>
              </div>
              <div>
                <h3 className="font-bold">{lead.institution_name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  {lead.contact_email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12}/>{lead.contact_email}</span>}
                  {lead.contact_phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12}/>{lead.contact_phone}</span>}
                  {lead.city && <span className="text-xs text-gray-500">{lead.city}, {lead.state}</span>}
                  {lead.student_count && <span className="text-xs text-gray-500">{lead.student_count} students</span>}
                </div>
                {lead.notes && <p className="text-xs text-gray-400 mt-1">{lead.notes}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <select value={lead.stage} onChange={e => updateStage(lead.id, e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border-0 focus:outline-none cursor-pointer ${STAGE_COLORS[lead.stage]}`}>
                {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
              </select>
              <ChevronRight size={18} className="text-gray-400"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}