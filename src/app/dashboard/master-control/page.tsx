'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, UserCheck, RefreshCw, Plus, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

const ROLES = ['super_admin','qa_agent','crm_agent','hr','discipline_officer','finance','content_lead'];

export default function MasterControl() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('crm_agent');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const user = localStorage.getItem('tryit_user') || '';

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff_roles').select('*, staff_badges(badge_icon, badge_name)').order('created_at', { ascending: false });
    if (data) setStaff(data);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const createStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    const { data, error } = await supabase.auth.admin.createUser({
      email: newEmail,
      password: newPassword,
      email_confirm: true
    });

    if (error) {
      setMessage(`Auth error: ${error.message}`);
      setCreating(false);
      return;
    }

    await supabase.from('staff_roles').upsert([{ user_email: newEmail, role: newRole, is_active: true }], { onConflict: 'user_email' });
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'STAFF_ACCOUNT_CREATED', details: { target: newEmail, role: newRole } }]);
    await supabase.from('leave_balances').insert([{ user_email: newEmail }]).onConflict('user_email', { ignoreDuplicates: true });

    setMessage(`✅ Account created for ${newEmail}`);
    setNewEmail(''); setNewPassword(''); setNewRole('crm_agent');
    setShowAddForm(false); setCreating(false);
    fetchStaff();
  };

  const changeRole = async (email: string, newRoleValue: string) => {
    await supabase.from('staff_roles').update({ role: newRoleValue }).eq('user_email', email);
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'ROLE_CHANGED', details: { target: email, new_role: newRoleValue } }]);
    fetchStaff();
  };

  const toggleActive = async (email: string, current: boolean) => {
    await supabase.from('staff_roles').update({ is_active: !current }).eq('user_email', email);
    await supabase.from('audit_logs').insert([{ user_email: user, action: current ? 'STAFF_DEACTIVATED' : 'STAFF_ACTIVATED', details: { target: email } }]);
    fetchStaff();
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-red-500 text-white',
    qa_agent: 'bg-purple-500/20 text-purple-500',
    crm_agent: 'bg-orange-500/20 text-orange-500',
    hr: 'bg-blue-500/20 text-blue-500',
    discipline_officer: 'bg-amber-500/20 text-amber-500',
    finance: 'bg-green-500/20 text-green-500',
    content_lead: 'bg-teal-500/20 text-teal-500',
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-gray-500" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Settings className="text-gray-700" size={32}/> Master Control</h1>
          <p className="text-gray-500">Create staff accounts, assign roles, and manage all access. Super Admin only.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-80">
          <Plus size={18}/> Create Staff Account
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-medium ${message.includes('✅') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><UserCheck size={18} className="text-green-500"/> Create New Staff Account</h2>
          <p className="text-xs text-gray-500 mb-4 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
            This creates a Supabase Auth account AND staff role simultaneously. Staff can log in immediately with these credentials.
          </p>
          <form onSubmit={createStaffAccount} className="grid grid-cols-2 gap-4">
            <input required type="email" placeholder="Staff email *" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"/>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
            </select>
            <div className="col-span-2 relative">
              <input required type={showPassword ? 'text' : 'password'} placeholder="Temporary password *" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:border-green-500"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-gray-400">
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={creating} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
                {creating ? 'Creating Account...' : 'Create Staff Account'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Shield size={16} className="text-blue-500"/> All Staff Accounts ({staff.length})</h2>
          <button onClick={fetchStaff} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><RefreshCw size={16}/></button>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {staff.map(s => (
            <div key={s.id} className={`flex items-center justify-between p-4 ${!s.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${s.is_active ? 'bg-gradient-to-tr from-blue-500 to-purple-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {s.user_email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{s.user_email}</p>
                    {s.is_online && <span className="w-2 h-2 bg-green-500 rounded-full" title="Online"/>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {s.staff_badges?.slice(0, 3).map((b: any) => (
                      <span key={b.badge_name} title={b.badge_name} className="text-sm">{b.badge_icon}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={s.role} onChange={e => changeRole(s.user_email, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border-0 focus:outline-none cursor-pointer appearance-none ${roleColors[s.role] || 'bg-gray-500/10 text-gray-500'}`}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
                <button onClick={() => toggleActive(s.user_email, s.is_active)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${s.is_active ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}>
                  {s.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}