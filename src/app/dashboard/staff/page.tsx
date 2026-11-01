'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserPlus, ShieldAlert, Mail, Shield, RefreshCw, 
  Trash2, X, CheckCircle2 
} from 'lucide-react';

type StaffType = {
  id: string;
  user_email: string;
  role: string;
  created_at: string;
};

export default function StaffDirectory() {
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('qa_agent');
  const [message, setMessage] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff_roles').select('*').order('created_at', { ascending: true });
    if (data) setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    // Check if the logged-in user is Super Admin
    const role = localStorage.getItem('tryit_role');
    if (role === 'super_admin') setIsAdmin(true);
    
    fetchStaff();
  }, []);

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert("Only Super Admins can add staff.");

    const { error } = await supabase.from('staff_roles').insert([{ user_email: newEmail, role: newRole }]);
    
    if (error) {
      setMessage(`? Error: ${error.message}`);
    } else {
      setMessage('? Staff member added successfully!');
      setNewEmail('');
      fetchStaff();
      setTimeout(() => { setIsModalOpen(false); setMessage(''); }, 1500);
    }
  };

  const removeStaff = async (id: string, email: string) => {
    if (!isAdmin) return alert("Only Super Admins can fire staff.");
    if (email === 'tatu.ind@hotmail.com') return alert("You cannot fire the Super Admin!");
    
    if (confirm(`Are you sure you want to revoke access for ${email}?`)) {
      await supabase.from('staff_roles').delete().eq('id', id);
      await supabase.from('audit_logs').insert([{ user_email: localStorage.getItem('tryit_user') || 'admin', action: 'REMOVE_STAFF', details: { removed_email: email } }]);
      fetchStaff();
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'qa_agent': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'crm_agent': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'mentor': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 opacity-0 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Users className="text-blue-500" size={32} /> Staff Directory
          </h1>
          <p className="text-gray-500">Manage employee access and roles across the platform.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            <UserPlus size={18} /> Add Staff
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)]/50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-5 font-semibold">Employee Email</th>
                <th className="p-5 font-semibold">Role / Access Level</th>
                <th className="p-5 font-semibold">Date Joined</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-[var(--background)]/30 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                        {member.user_email[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-[var(--foreground)]">{member.user_email}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getRoleBadge(member.role)}`}>
                      {member.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-5 text-right">
                    {isAdmin && member.user_email !== 'tatu.ind@hotmail.com' && (
                      <button 
                        onClick={() => removeStaff(member.id, member.user_email)}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        title="Revoke Access"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-[var(--background)] border border-[var(--card-border)] p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><UserPlus className="text-blue-500"/> Add New Staff</h2>
            <p className="text-sm text-gray-500 mb-6">Enter their email and assign their role. They can use this email to log in immediately.</p>
            
            <form onSubmit={addStaff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="employee@tryit.com" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-blue-500">
                  <option value="qa_agent">QA Agent (Questions)</option>
                  <option value="crm_agent">CRM Agent (Tickets)</option>
                  <option value="hr">HR Manager (Staff & Tasks)</option>
                  <option value="mentor">Mentor (Doubt Solving)</option>
                  <option value="marketing">Marketing (Bharat Pulse)</option>
                </select>
              </div>
              
              {message && (
                <div className={`p-3 rounded-xl text-sm text-center font-semibold ${message.includes('?') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {message}
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-2 transition-transform hover:scale-[1.02] shadow-lg shadow-blue-500/30">
                Grant Access
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

