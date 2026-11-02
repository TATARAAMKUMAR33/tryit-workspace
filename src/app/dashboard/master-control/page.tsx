'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings, Users, ShieldAlert, Plus, Trash2, 
  ToggleLeft, ToggleRight, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function MasterControl() {
  const [activeTab, setActiveTab] = useState<'global' | 'teams' | 'staff'>('global');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [features, setFeatures] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [teamAccess, setTeamAccess] = useState<any[]>([]);
  const [specialAccess, setSpecialAccess] = useState<any[]>([]);

  // Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('qa_agent');
  const [newStaffTeam, setNewStaffTeam] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [f, t, s, ta, sa] = await Promise.all([
      supabase.from('system_features').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('staff_roles').select('*'),
      supabase.from('team_module_access').select('*'),
      supabase.from('employee_special_access').select('*')
    ]);
    if (f.data) setFeatures(f.data);
    if (t.data) setTeams(t.data);
    if (s.data) setStaff(s.data);
    if (ta.data) setTeamAccess(ta.data);
    if (sa.data) setSpecialAccess(sa.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---
  const toggleGlobalFeature = async (key: string, current: boolean) => {
    await supabase.rpc('admin_toggle_global_feature', { p_feature: key, p_enabled: !current });
    fetchData();
  };

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.rpc('admin_create_team', { p_name: newTeamName, p_desc: newTeamDesc });
    setNewTeamName(''); setNewTeamDesc('');
    fetchData();
  };

  const toggleTeamFeature = async (teamId: string, featureKey: string, current: boolean) => {
    await supabase.rpc('admin_toggle_team_feature', { p_team_id: teamId, p_feature: featureKey, p_enabled: !current });
    fetchData();
  };

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.rpc('onboard_employee', { p_email: newStaffEmail, p_role: newStaffRole, p_team_name: newStaffTeam });
    setNewStaffEmail('');
    fetchData();
  };

  const fireStaff = async (email: string) => {
    if(!confirm(`Are you sure you want to FIRE ${email}? They will instantly lose access to all chats and dashboards.`)) return;
    await supabase.rpc('admin_remove_staff', { p_email: email });
    fetchData();
  };

  const toggleStaffSpecialAccess = async (email: string, featureKey: string, current: boolean) => {
    await supabase.rpc('admin_toggle_employee_feature', { p_email: email, p_feature: featureKey, p_enabled: !current });
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[var(--card-bg)] p-4 rounded-3xl border border-[var(--card-border)] shadow-xl gap-4">
        <div className="flex items-center gap-3">
          <Settings className="text-blue-500" size={28} />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Master Controller</h1>
        </div>
        <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--card-border)]">
          <button onClick={() => setActiveTab('global')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'global' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}>Global Switches</button>
          <button onClick={() => setActiveTab('teams')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'teams' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}>Team Management</button>
          <button onClick={() => setActiveTab('staff')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'staff' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}>Staff Directory</button>
        </div>
      </div>

      {/* GLOBAL TAB */}
      {activeTab === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.feature_key} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="font-bold text-[var(--foreground)]">{f.feature_name}</p>
                <p className={`text-xs font-bold uppercase mt-1 ${f.is_globally_enabled ? 'text-green-500' : 'text-red-500'}`}>
                  {f.is_globally_enabled ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
              <button onClick={() => toggleGlobalFeature(f.feature_key, f.is_globally_enabled)}>
                {f.is_globally_enabled ? <ToggleRight size={36} className="text-green-500" /> : <ToggleLeft size={36} className="text-gray-400" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TEAMS TAB */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <form onSubmit={createTeam} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex gap-4 shadow-sm">
            <input required value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Team Name (e.g., Legal)" className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none" />
            <input value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} placeholder="Description" className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none" />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2"><Plus size={18}/> Create Team</button>
          </form>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map(team => (
              <div key={team.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
                <h3 className="font-bold text-lg text-[var(--foreground)] mb-4 border-b border-[var(--card-border)] pb-2">{team.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{team.description}</p>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Enable Features for this Team:</p>
                  <div className="flex flex-wrap gap-2">
                    {features.map(f => {
                      const access = teamAccess.find(a => a.team_id === team.id && a.module_name === f.feature_key);
                      const isEnabled = access ? access.is_allowed : false;
                      return (
                        <button key={f.feature_key} onClick={() => toggleTeamFeature(team.id, f.feature_key, isEnabled)} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${isEnabled ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
                          {f.feature_key} {isEnabled ? '✓' : '✕'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <form onSubmit={addStaff} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-wrap gap-4 shadow-sm">
            <input required type="email" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} placeholder="Email (e.g., rahul@tryit.com)" className="flex-1 min-w-[200px] bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none" />
            <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none">
              <option value="qa_agent">QA Agent</option>
              <option value="crm_agent">CRM Agent</option>
              <option value="hr">HR Manager</option>
              <option value="discipline_officer">Discipline Officer</option>
            </select>
            <select value={newStaffTeam} onChange={e => setNewStaffTeam(e.target.value)} className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none">
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2"><Plus size={18}/> Hire Employee</button>
          </form>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-[var(--background)] text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Special Overrides</th>
                  <th className="p-4 font-bold text-right">Fire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-[var(--background)]/50">
                    <td className="p-4 font-medium">{s.user_email}</td>
                    <td className="p-4"><span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-bold uppercase">{s.role}</span></td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {features.slice(0, 5).map(f => {
                          const access = specialAccess.find(a => a.user_email === s.user_email && a.module_name === f.feature_key);
                          const isEnabled = access ? access.is_allowed : false;
                          return (
                            <button key={f.feature_key} onClick={() => toggleStaffSpecialAccess(s.user_email, f.feature_key, isEnabled)} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isEnabled ? 'bg-purple-500 text-white' : 'bg-gray-500/10 text-gray-500'}`}>
                              {f.feature_key}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => fireStaff(s.user_email)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
