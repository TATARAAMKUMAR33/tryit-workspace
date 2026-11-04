'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, RefreshCw, Search, Edit2, UserX, UserCheck, Shield, Mail } from 'lucide-react';

const ROLES = ['super_admin','qa_agent','crm_agent','hr','discipline_officer','finance','content_lead'];

export default function StaffDirectory() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ user_email: '', role: 'crm_agent', department: '', reporting_to: '' });
  const user = localStorage.getItem('tryit_user') || '';

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff_roles').select('*').order('created_at', { ascending: false });
    if (data) setStaff(data);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('staff_roles').update({ role: form.role, department: form.department, reporting_to: form.reporting_to }).eq('id', editingId);
      await supabase.from('audit_logs').insert([{ user_email: user, action: 'STAFF_ROLE_UPDATED', details: { target: form.user_email, role: form.role } }]);
    } else {
      await supabase.from('staff_roles').insert([{ ...form, is_active: true }]);
      await supabase.from('audit_logs').insert([{ user_email: user, action: 'STAFF_CREATED', details: { target: form.user_email, role: form.role } }]);
    }
    setForm({ user_email: '', role: 'crm_agent', department: '', reporting_to: '' });
    setShowForm(false); setEditingId(null);
    fetchStaff();
  };

  const toggleActive = async (id: string, email: string, current: boolean) => {
    await supabase.from('staff_roles').update({ is_active: !current }).eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user, action: current ? 'STAFF_DEACTIVATED' : 'STAFF_ACTIVATED', details: { target: email } }]);
    fetchStaff();
  };

  const startEdit = (s: any) => {
    setForm({ user_email: s.user_email, role: s.role, department: s.department || '', reporting_to: s.reporting_to || '' });
    setEditingId(s.id); setShowForm(true);
  };

  const roleColors: Record<string, string> = {
    super_admin: 'text-red-500 bg-red-500/10',
    qa_agent: 'text-purple-500 bg-purple-500/10',
    crm_agent: 'text-orange-500 bg-orange-500/10',
    hr: 'text-blue-500 bg-blue-500/10',
    discipline_officer: 'text-amber-500 bg-amber-500/10',
    finance: 'text-green-500 bg-green-500/10',
    content_lead: 'text-teal-500 bg-teal-500/10',
  };

  const filtered = staff.filter(s => !search || s.user_email.includes(search) || s.role.includes(search) || s.department?.includes(search));

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-sky-500" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><UserPlus className="text-sky-500" size={32}/> Staff Directory</h1>
          <p className="text-gray-500">{staff.filter(s => s.is_active).length} active · {staff.filter(s => !s.is_active).length} inactive</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ user_email: '', role: 'crm_agent', department: '', reporting_to: '' }); }}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
          <UserPlus size={18}/> Add Staff
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">{editingId ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
          <form onSubmit={saveStaff} className="grid grid-cols-2 gap-4">
            <input required placeholder="Staff email *" value={form.user_email} disabled={!!editingId}
              onChange={e => setForm(p => ({ ...p, user_email: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 disabled:opacity-60"/>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
            </select>
            <input placeholder="Department" value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"/>
            <input placeholder="Reporting to (email)" value={form.reporting_to}
              onChange={e => setForm(p => ({ ...p, reporting_to: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"/>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl">
                {editingId ? 'Update Staff' : 'Add Staff Member'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email, role, or department..."
          className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-sky-500"/>
      </div>

      <div className="space-y-3">
        {filtered.map(s => (
          <div key={s.id} className={`bg-[var(--card-bg)] border rounded-2xl p-5 flex items-center justify-between gap-4 ${!s.is_active ? 'opacity-50' : 'border-[var(--card-border)]'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${s.is_active ? 'bg-gradient-to-tr from-sky-500 to-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {s.user_email?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{s.user_email.split('@')[0]}</p>
                  {s.is_online && <span className="w-2 h-2 bg-green-500 rounded-full"/>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${roleColors[s.role] || 'text-gray-500 bg-gray-500/10'}`}>
                    {s.role.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {s.department && <span className="text-xs text-gray-500">{s.department}</span>}
                  {s.reporting_to && <span className="text-xs text-gray-400">→ {s.reporting_to.split('@')[0]}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Mail size={10}/>{s.user_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {s.is_on_leave && <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded font-bold">ON LEAVE</span>}
              <button onClick={() => startEdit(s)} className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors">
                <Edit2 size={16}/>
              </button>
              <button onClick={() => toggleActive(s.id, s.user_email, s.is_active)}
                className={`p-2 rounded-lg transition-colors ${s.is_active ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}>
                {s.is_active ? <UserX size={16}/> : <UserCheck size={16}/>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}