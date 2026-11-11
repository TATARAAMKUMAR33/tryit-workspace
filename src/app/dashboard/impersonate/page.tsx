'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, RefreshCw, Shield, ArrowRight, StopCircle, AlertTriangle } from 'lucide-react';

export default function ImpersonateView() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff_roles').select('*').eq('is_active', true).order('role');
    if (data) setStaff(data.filter(s => s.user_email !== user));
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const startImpersonation = async (targetEmail: string, targetRole: string) => {
    if (!reason.trim()) return alert('Reason is required for audit trail');

    // Log the impersonation
    await supabase.from('impersonation_log').insert([{
      admin_email: user,
      impersonated_email: targetEmail,
      impersonated_role: targetRole,
      reason
    }]);

    await supabase.from('audit_logs').insert([{
      user_email: user,
      action: 'IMPERSONATION_STARTED',
      details: { target: targetEmail, reason }
    }]);

    // Store original session
    localStorage.setItem('tryit_original_role', localStorage.getItem('tryit_role') || '');
    localStorage.setItem('tryit_original_user', localStorage.getItem('tryit_user') || '');
    // Set impersonation
    localStorage.setItem('tryit_role', targetRole);
    localStorage.setItem('tryit_impersonating', targetEmail);
    setImpersonating(targetEmail);
    setReason('');
    setSelected(null);
    // Redirect to dashboard as that role
    window.location.href = '/dashboard';
  };

  const stopImpersonation = async () => {
    const original_user = localStorage.getItem('tryit_original_user') || user;
    const original_role = localStorage.getItem('tryit_original_role') || 'super_admin';

    await supabase.from('impersonation_log').update({
      ended_at: new Date().toISOString()
    }).eq('admin_email', user).is('ended_at', null);

    await supabase.from('audit_logs').insert([{
      user_email: original_user,
      action: 'IMPERSONATION_ENDED',
      details: { was_impersonating: impersonating }
    }]);

    localStorage.setItem('tryit_user', original_user);
    localStorage.setItem('tryit_role', original_role);
    localStorage.removeItem('tryit_impersonating');
    localStorage.removeItem('tryit_original_role');
    localStorage.removeItem('tryit_original_user');
    window.location.href = '/dashboard';
  };

  const currentlyImpersonating = typeof window !== 'undefined'
    ? localStorage.getItem('tryit_impersonating')
    : null;

  const roleColors: Record<string, string> = {
    super_admin: 'text-red-500', qa_agent: 'text-purple-500',
    crm_agent: 'text-orange-500', hr: 'text-blue-500',
    discipline_officer: 'text-amber-500', finance: 'text-green-500',
    content_lead: 'text-teal-500', mentor: 'text-pink-500',
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-purple-500" size={40}/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Eye className="text-purple-500" size={32}/> View As Staff</h1>
        <p className="text-gray-500">See the ERP exactly as any team member sees it. All actions are logged.</p>
      </div>

      {currentlyImpersonating && (
        <div className="bg-orange-500/10 border-2 border-orange-500 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500 animate-pulse" size={20}/>
            <div>
              <p className="font-black text-orange-500">Currently viewing as: {currentlyImpersonating}</p>
              <p className="text-xs text-gray-500">Every action you take is recorded against your admin account</p>
            </div>
          </div>
          <button onClick={stopImpersonation}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600">
            <StopCircle size={16}/> Stop & Return to Admin
          </button>
        </div>
      )}

      <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 text-sm">
        <p className="font-bold text-orange-600 mb-1">⚠️ Super Admin Only — Strictly Audited</p>
        <p className="text-gray-500">Every impersonation session is logged with timestamp, reason, and all actions taken. Use only for support and debugging, not surveillance.</p>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-6 max-w-md w-full">
            <h2 className="font-bold text-lg mb-2 flex items-center gap-2"><Eye size={18} className="text-purple-500"/> View as {selected.split('@')[0]}</h2>
            <p className="text-xs text-gray-500 mb-4">This action will be permanently logged in the audit trail.</p>
            <input value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Reason for viewing (required for audit) *"
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 mb-4"/>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const s = staff.find(s => s.user_email === selected);
                  if (s) startImpersonation(s.user_email, s.role);
                }}
                disabled={!reason.trim()}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                <Eye size={16}/> View as this staff member
              </button>
              <button onClick={() => { setSelected(null); setReason(''); }}
                className="px-4 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staff.map(s => (
          <div key={s.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {s.user_email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{s.user_email.split('@')[0]}</p>
                <p className={`text-xs font-bold capitalize ${roleColors[s.role] || 'text-gray-500'}`}>
                  {s.role.replace(/_/g,' ')}
                </p>
                {s.is_online && <p className="text-[10px] text-green-500">🟢 Online now</p>}
              </div>
            </div>
            <button onClick={() => setSelected(s.user_email)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded-xl text-sm font-bold transition-colors">
              <Eye size={14}/> View As
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}