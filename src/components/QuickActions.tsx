'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Zap, X, Plus, CheckCircle2, AlertTriangle, Shield, Bell, Users } from 'lucide-react';

const ROLE_ACTIONS: Record<string, any[]> = {
  super_admin: [
    { label: 'Battle Mode', icon: '⚡', action: 'battle', color: 'bg-red-500 text-white' },
    { label: 'Announce', icon: '📢', action: 'announce', color: 'bg-purple-500 text-white' },
    { label: 'Red Flag', icon: '🚨', href: '/dashboard/red-flag', color: 'bg-red-500/10 text-red-500' },
    { label: 'New Staff', icon: '👤', href: '/dashboard/master-control', color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Command', icon: '🎯', href: '/dashboard/command-center', color: 'bg-gray-500/10 text-gray-600' },
  ],
  crm_agent: [
    { label: 'New Ticket', icon: '🎫', href: '/dashboard/tickets', color: 'bg-orange-500/10 text-orange-500' },
    { label: 'KB Search', icon: '📖', href: '/dashboard/knowledge', color: 'bg-yellow-500/10 text-yellow-600' },
    { label: 'Students', icon: '👥', href: '/dashboard/students', color: 'bg-teal-500/10 text-teal-500' },
  ],
  qa_agent: [
    { label: 'QA Queue', icon: '✅', href: '/dashboard/qa', color: 'bg-purple-500/10 text-purple-500' },
    { label: 'Content', icon: '📚', href: '/dashboard/content-ops', color: 'bg-teal-500/10 text-teal-500' },
  ],
  hr: [
    { label: 'Leave Queue', icon: '📅', href: '/dashboard/hr', color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Staff', icon: '👤', href: '/dashboard/staff', color: 'bg-sky-500/10 text-sky-500' },
    { label: 'Performance', icon: '📊', href: '/dashboard/performance', color: 'bg-cyan-500/10 text-cyan-500' },
  ],
  finance: [
    { label: 'Billing', icon: '💳', href: '/dashboard/billing', color: 'bg-green-500/10 text-green-500' },
    { label: 'Expenses', icon: '💰', href: '/dashboard/expenses', color: 'bg-amber-500/10 text-amber-500' },
  ],
  discipline_officer: [
    { label: 'Risk Radar', icon: '🛡️', href: '/dashboard/risk', color: 'bg-red-500/10 text-red-500' },
    { label: 'Moderation', icon: '🚩', href: '/dashboard/moderation', color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Security', icon: '🔐', href: '/dashboard/security', color: 'bg-emerald-500/10 text-emerald-500' },
  ],
  content_lead: [
    { label: 'QA Queue', icon: '✅', href: '/dashboard/qa', color: 'bg-purple-500/10 text-purple-500' },
    { label: 'Content Ops', icon: '📚', href: '/dashboard/content-ops', color: 'bg-teal-500/10 text-teal-500' },
    { label: 'Knowledge', icon: '📖', href: '/dashboard/knowledge', color: 'bg-yellow-500/10 text-yellow-600' },
  ],
};

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const router = useRouter();
  const role = typeof window !== 'undefined' ? localStorage.getItem('tryit_role') || 'crm_agent' : 'crm_agent';
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const actions = ROLE_ACTIONS[role] || ROLE_ACTIONS.crm_agent;

  const handleAction = async (action: any) => {
    if (action.href) { router.push(action.href); setOpen(false); return; }
    if (action.action === 'battle') {
      const { data } = await supabase.from('platform_controls').select('is_active').eq('id', 'battle_mode').single();
      const newState = !(data?.is_active);
      await supabase.from('platform_controls').upsert([{ id: 'battle_mode', is_active: newState, updated_by: user }]);
      alert(`Battle Mode ${newState ? 'ACTIVATED 🔴' : 'Deactivated ⚪'}`);
      setOpen(false);
    }
    if (action.action === 'announce') { setShowAnnounce(true); setOpen(false); }
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    const allStaff = await supabase.from('staff_roles').select('user_email').eq('is_active', true);
    if (allStaff.data) {
      const inserts = allStaff.data.map(s => ({
        to_email: s.user_email,
        title: '📢 Announcement from Super Admin',
        body: announcement,
        type: 'announcement',
        link: '/dashboard'
      }));
      await supabase.from('staff_notifications').insert(inserts);
    }
    setAnnouncement('');
    setShowAnnounce(false);
    alert('Announcement sent to all staff ✅');
  };

  return (
    <>
      {showAnnounce && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-6 max-w-md w-full">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Bell size={18} className="text-purple-500"/> Announce to All Staff</h2>
            <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)}
              placeholder="Type your announcement..." rows={4}
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 resize-none mb-4"/>
            <div className="flex gap-3">
              <button onClick={sendAnnouncement} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl">Send to All Staff</button>
              <button onClick={() => setShowAnnounce(false)} className="px-4 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40">
        {open && (
          <div className="absolute bottom-14 right-0 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl shadow-2xl p-3 w-48 space-y-1 animate-fade-up mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pb-1">Quick Actions</p>
            {actions.map((action, idx) => (
              <button key={idx} onClick={() => handleAction(action)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors hover:scale-105 ${action.color}`}>
                <span className="text-base">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setOpen(!open)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${open ? 'bg-red-500 rotate-45' : 'bg-gradient-to-tr from-blue-600 to-purple-600'}`}>
          {open ? <X size={22} className="text-white"/> : <Zap size={22} className="text-white"/>}
        </button>
      </div>
    </>
  );
}