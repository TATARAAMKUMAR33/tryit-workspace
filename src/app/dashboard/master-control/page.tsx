'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, UserCheck, RefreshCw, Mail, Eye, Shield, Clock, Activity, ChevronDown, ChevronUp, Users } from 'lucide-react';

const ALL_SECTIONS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/dashboard/feed', label: 'Live Ops Feed' },
  { path: '/dashboard/tickets', label: 'CRM Tickets' },
  { path: '/dashboard/qa', label: 'QA Inspector' },
  { path: '/dashboard/disputes', label: 'Disputes' },
  { path: '/dashboard/moderation', label: 'Moderation' },
  { path: '/dashboard/staff', label: 'Staff Directory' },
  { path: '/dashboard/team', label: 'Team Hub' },
  { path: '/dashboard/hr', label: 'HR & Attendance' },
  { path: '/dashboard/performance', label: 'Staff KPI' },
  { path: '/dashboard/sprints', label: 'Sprints' },
  { path: '/dashboard/chat', label: 'Staff Chat' },
  { path: '/dashboard/billing', label: 'Billing' },
  { path: '/dashboard/expenses', label: 'Expenses' },
  { path: '/dashboard/students', label: 'Student 360' },
  { path: '/dashboard/leads', label: 'B2B Leads' },
  { path: '/dashboard/analytics', label: 'Analytics' },
  { path: '/dashboard/risk', label: 'Risk Radar' },
  { path: '/dashboard/security', label: 'Security' },
  { path: '/dashboard/audit', label: 'Audit Logs' },
  { path: '/dashboard/errors', label: 'Error Logs' },
  { path: '/dashboard/system', label: 'System Health' },
  { path: '/dashboard/pulse', label: 'Bharat Pulse' },
  { path: '/dashboard/content-ops', label: 'Content Ops' },
  { path: '/dashboard/knowledge', label: 'Knowledge Base' },
  { path: '/dashboard/verification', label: 'Verification' },
  { path: '/dashboard/god-mode', label: 'God Mode' },
  { path: '/dashboard/command-center', label: 'Command Center' },
  { path: '/dashboard/red-flag', label: 'Red Flag' },
  { path: '/dashboard/automation', label: 'Automation' },
  { path: '/dashboard/calendar', label: 'Calendar' },
];

const ROLES = ['super_admin','qa_agent','crm_agent','hr','discipline_officer','finance','content_lead'];

export default function MasterControl() {
  const [staff, setStaff] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sectionAccess, setSectionAccess] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accounts'|'sections'|'teams'|'activity'>('accounts');
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('crm_agent');
  const [newTeam, setNewTeam] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTeamForBulk, setSelectedTeamForBulk] = useState('');
  const user = localStorage.getItem('tryit_user') || '';

  const fetchAll = async () => {
    setLoading(true);
    const [s, t, sess, sa] = await Promise.all([
      supabase.from('staff_roles').select('*').order('created_at', { ascending: false }),
      supabase.from('erp_teams').select('*').order('name'),
      supabase.from('staff_sessions').select('*').order('timestamp', { ascending: false }).limit(100),
      supabase.from('staff_section_access').select('*'),
    ]);
    if (s.data) setStaff(s.data);
    if (t.data) setTeams(t.data);
    if (sess.data) setSessions(sess.data);
    if (sa.data) setSectionAccess(sa.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const sendLoginEmail = async (email: string) => {
    setSendingEmail(email);
    const { error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });
    if (!error) {
      await supabase.from('staff_email_notifications').insert([{
        to_email: email, subject: 'Your TryIT Hub Login Link',
        type: 'login_link', status: 'sent', sent_at: new Date().toISOString()
      }]);
      await supabase.from('audit_logs').insert([{ user_email: user, action: 'LOGIN_LINK_SENT', details: { target: email } }]);
      setMessage(`✅ Login link sent to ${email}`);
    } else {
      setMessage(`⚠️ Could not send magic link. Share manual credentials instead.`);
    }
    setSendingEmail(null);
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    await supabase.from('staff_roles').upsert([{
      user_email: newEmail, role: newRole, is_active: true, team_slug: newTeam || null
    }], { onConflict: 'user_email' });

    if (newTeam) {
      const teamChannel = `${newTeam}-team`;
      const { data: channel } = await supabase.from('chat_channels').select('id').eq('name', teamChannel).single();
      const { data: general } = await supabase.from('chat_channels').select('id').eq('name', 'general').single();

      if (channel) await supabase.from('chat_channel_members').upsert([{ channel_id: channel.id, user_email: newEmail }], { onConflict: 'channel_id,user_email' });
      if (general) await supabase.from('chat_channel_members').upsert([{ channel_id: general.id, user_email: newEmail }], { onConflict: 'channel_id,user_email' });
    }

    await supabase.from('leave_balances').insert([{ user_email: newEmail }]).onConflict('user_email', { ignoreDuplicates: true });
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'STAFF_CREATED', details: { target: newEmail, role: newRole, team: newTeam } }]);

    setMessage(`✅ ${newEmail} added as ${newRole}. Send them a login link.`);
    setNewEmail(''); setNewRole('crm_agent'); setNewTeam('');
    setCreating(false);
    fetchAll();
  };

  const toggleSection = async (staffEmail: string, path: string, currentEnabled: boolean) => {
    await supabase.from('staff_section_access').upsert([{
      user_email: staffEmail, section_path: path, is_enabled: !currentEnabled, enabled_by: user
    }], { onConflict: 'user_email,section_path' });
    fetchAll();
  };

  const bulkEnableTeam = async (teamSlug: string, paths: string[], enabled: boolean) => {
    const inserts = paths.map(path => ({ team_slug: teamSlug, section_path: path, is_enabled: enabled }));
    await supabase.from('team_section_access').upsert(inserts, { onConflict: 'team_slug,section_path' });
    fetchAll();
  };

  const changeRole = async (email: string, role: string) => {
    await supabase.from('staff_roles').update({ role }).eq('user_email', email);
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'ROLE_CHANGED', details: { target: email, role } }]);
    fetchAll();
  };

  const toggleActive = async (email: string, current: boolean) => {
    await supabase.from('staff_roles').update({ is_active: !current }).eq('user_email', email);
    fetchAll();
  };

  const getStaffSections = (email: string) => {
    const overrides = sectionAccess.filter(sa => sa.user_email === email);
    return ALL_SECTIONS.map(s => {
      const override = overrides.find(o => o.section_path === s.path);
      return { ...s, is_enabled: override ? override.is_enabled : true };
    });
  };

  const getLastActivity = (email: string) => {
    const staffSessions = sessions.filter(s => s.user_email === email);
    if (staffSessions.length === 0) return null;
    return staffSessions[0];
  };

  const getLastLogin = (email: string) => sessions.find(s => s.user_email === email && s.event_type === 'clock_in' || s.event_type === 'login');

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
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Settings className="text-gray-700" size={32}/> Master Control</h1>
          <p className="text-gray-500">Create accounts, manage access, inspect activity. Super Admin only.</p>
        </div>
        <button onClick={fetchAll} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-medium ${message.includes('✅') ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'}`}>
          {message}
        </div>
      )}

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><UserCheck size={18} className="text-green-500"/> Add New Staff Member</h2>
        <form onSubmit={createAccount} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input required type="email" placeholder="Staff email *" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"/>
          <select value={newRole} onChange={e => setNewRole(e.target.value)}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
            {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
          </select>
          <select value={newTeam} onChange={e => setNewTeam(e.target.value)}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
            <option value="">No Team</option>
            {teams.map(t => <option key={t.slug} value={t.slug}>{t.icon} {t.name}</option>)}
          </select>
          <button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            <UserCheck size={16}/> {creating ? 'Adding...' : 'Add Staff'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">After adding, click "Send Login Link" so staff can set their password and access the ERP immediately.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'accounts', label: `All Staff (${staff.length})`, icon: Users },
          { id: 'sections', label: 'Section Access', icon: Shield },
          { id: 'teams', label: `Teams (${teams.length})`, icon: Users },
          { id: 'activity', label: 'Activity Log', icon: Activity },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            <tab.icon size={16}/>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' && (
        <div className="space-y-3">
          {staff.map(s => {
            const lastActivity = getLastActivity(s.user_email);
            const isExpanded = expandedStaff === s.user_email;
            const sections = getStaffSections(s.user_email);
            return (
              <div key={s.id} className={`bg-[var(--card-bg)] border rounded-2xl overflow-hidden ${!s.is_active ? 'opacity-60' : 'border-[var(--card-border)]'}`}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${s.is_active ? 'bg-gradient-to-tr from-blue-500 to-purple-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {s.user_email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">{s.user_email}</p>
                        {s.is_online && <span className="w-2 h-2 bg-green-500 rounded-full" title="Online"/>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${roleColors[s.role] || 'bg-gray-500/10 text-gray-500'}`}>
                          {s.role.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {s.team_slug && <span className="text-[10px] text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded">{s.team_slug}</span>}
                      </div>
                      {lastActivity && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last: {lastActivity.event_type} · {new Date(lastActivity.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => sendLoginEmail(s.user_email)} disabled={sendingEmail === s.user_email}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold disabled:opacity-50">
                      <Mail size={12}/> {sendingEmail === s.user_email ? 'Sending...' : 'Send Login Link'}
                    </button>
                    <select value={s.role} onChange={e => changeRole(s.user_email, e.target.value)}
                      className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-2 py-1.5 focus:outline-none">
                      {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                    <button onClick={() => toggleActive(s.user_email, s.is_active)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${s.is_active ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}>
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => setExpandedStaff(isExpanded ? null : s.user_email)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                      {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--card-border)] p-4 bg-[var(--background)]">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Shield size={14} className="text-blue-500"/> Section Access for {s.user_email.split('@')[0]}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sections.map(section => (
                        <div key={section.path} onClick={() => toggleSection(s.user_email, section.path, section.is_enabled)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors text-xs ${section.is_enabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-500/5 border border-gray-500/10 opacity-50'}`}>
                          <span className={section.is_enabled ? 'text-green-700' : 'text-gray-400'}>{section.label}</span>
                          <span>{section.is_enabled ? '✅' : '❌'}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Clock size={14}/> Recent Activity</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {sessions.filter(sess => sess.user_email === s.user_email).slice(0, 10).map(sess => (
                          <div key={sess.id} className="flex justify-between text-xs p-2 bg-[var(--card-bg)] rounded-lg">
                            <span className={`font-bold ${sess.event_type === 'clock_in' || sess.event_type === 'login' ? 'text-green-500' : sess.event_type === 'clock_out' || sess.event_type === 'logout' ? 'text-red-500' : 'text-orange-500'}`}>
                              {sess.event_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-gray-400">{new Date(sess.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500"/> Bulk Team Section Access</h2>
            <div className="flex gap-3 mb-4">
              <select value={selectedTeamForBulk} onChange={e => setSelectedTeamForBulk(e.target.value)}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none flex-1">
                <option value="">Select team...</option>
                {teams.map(t => <option key={t.slug} value={t.slug}>{t.icon} {t.name}</option>)}
              </select>
            </div>
            {selectedTeamForBulk && (
              <div>
                <p className="text-xs text-gray-500 mb-3">Click sections to toggle for entire <strong>{selectedTeamForBulk}</strong> team:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ALL_SECTIONS.map(section => {
                    const teamAccess = sectionAccess.filter(sa => sa.team_slug === selectedTeamForBulk && sa.section_path === section.path)[0];
                    const enabled = teamAccess ? teamAccess.is_enabled : true;
                    return (
                      <div key={section.path} onClick={() => bulkEnableTeam(selectedTeamForBulk, [section.path], !enabled)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs ${enabled ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-gray-500/5 border border-gray-500/10 opacity-50'}`}>
                        <span>{section.label}</span>
                        <span>{enabled ? '✅' : '❌'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => {
            const teamStaff = staff.filter(s => s.team_slug === team.slug);
            return (
              <div key={team.slug} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{team.icon}</span>
                  <div>
                    <h3 className="font-bold">{team.name}</h3>
                    <p className="text-xs text-gray-500">{team.description}</p>
                  </div>
                  <span className="ml-auto text-sm font-bold bg-blue-500/10 text-blue-500 px-2 py-1 rounded-xl">{teamStaff.length} staff</span>
                </div>
                <div className="space-y-1">
                  {teamStaff.length === 0
                    ? <p className="text-xs text-gray-400">No staff assigned to this team yet</p>
                    : teamStaff.map(s => (
                      <div key={s.user_email} className="flex items-center justify-between text-xs p-2 bg-[var(--background)] rounded-lg">
                        <span>{s.user_email.split('@')[0]}</span>
                        <span className={`font-bold ${s.is_online ? 'text-green-500' : 'text-gray-400'}`}>
                          {s.is_online ? '🟢 Online' : '⚪ Offline'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--card-border)]">
            <h2 className="font-bold flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Complete Staff Activity Log</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {sessions.length === 0
              ? <div className="text-center py-12 text-gray-500">No activity recorded yet</div>
              : sessions.map(sess => (
                <div key={sess.id} className="flex items-center justify-between p-4 border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      sess.event_type === 'clock_in' || sess.event_type === 'login' ? 'bg-green-500' :
                      sess.event_type === 'clock_out' || sess.event_type === 'logout' ? 'bg-red-500' :
                      'bg-orange-500'
                    }`}/>
                    <div>
                      <p className="font-bold text-sm">{sess.user_email}</p>
                      <p className="text-xs text-gray-500">{sess.event_type.replace(/_/g, ' ')} {sess.notes ? `· ${sess.notes}` : ''}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(sess.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}