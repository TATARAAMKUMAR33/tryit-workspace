'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserCheck, ShieldCheck, XCircle, CheckCircle2, 
  ExternalLink, RefreshCw, FileText, Clock
} from 'lucide-react';

type RequestType = {
  id: string;
  user_email: string;
  requested_role: 'mentor' | 'institution';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export default function VerificationQueue() {
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setRequests(data as RequestType[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    // Update the request status
    await supabase.from('verification_requests').update({ status: newStatus }).eq('id', id);
    
    // If approved, you would typically update the user's role here (e.g., in staff_roles or users table)
    
    // Log the action
    await supabase.from('audit_logs').insert([{
      user_email: localStorage.getItem('tryit_user') || 'admin',
      action: newStatus === 'approved' ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
      details: { request_id: id }
    }]);

    fetchRequests();
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <UserCheck className="text-blue-500" size={32} /> Verification Queue
          </h1>
          <p className="text-gray-500">Review and verify new Mentors and Institutions before they join the platform.</p>
        </div>
        <button onClick={fetchRequests} className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-gray-500/10 text-gray-500 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--card-bg)] p-1 rounded-2xl border border-[var(--card-border)] w-fit">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-[var(--foreground)]'}`}>
          <Clock size={16} /> Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button onClick={() => setActiveTab('approved')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'approved' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:text-[var(--foreground)]'}`}>
          <CheckCircle2 size={16} /> Approved
        </button>
        <button onClick={() => setActiveTab('rejected')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'rejected' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-[var(--foreground)]'}`}>
          <XCircle size={16} /> Rejected
        </button>
      </div>

      {/* Queue List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20"><RefreshCw className="animate-spin text-blue-500 mx-auto" size={40} /></div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 text-center">
            <ShieldCheck size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--foreground)]">Queue is empty</h3>
            <p className="text-gray-500">No requests in the {activeTab} folder.</p>
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-colors">
              
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${req.requested_role === 'institution' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {req.requested_role === 'institution' ? <ShieldCheck size={24} /> : <UserCheck size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--foreground)]">{req.user_email}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Role: {req.requested_role}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 md:border-l border-[var(--card-border)] md:pl-6">
                <a 
                  href={req.document_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 text-gray-600 dark:text-gray-300 hover:bg-gray-500/20 rounded-xl text-sm font-bold transition-colors"
                >
                  <FileText size={16} /> View Document <ExternalLink size={14} />
                </a>

                {req.status === 'pending' && (
                  <>
                    <button onClick={() => handleAction(req.id, 'rejected')} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors" title="Reject">
                      <XCircle size={20} />
                    </button>
                    <button onClick={() => handleAction(req.id, 'approved')} className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-500/20">
                      <CheckCircle2 size={18} /> Approve
                    </button>
                  </>
                )}
                
                {req.status === 'approved' && (
                  <span className="px-4 py-2 bg-green-500/10 text-green-500 font-bold rounded-xl text-sm border border-green-500/20 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Approved
                  </span>
                )}
                
                {req.status === 'rejected' && (
                  <span className="px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded-xl text-sm border border-red-500/20 flex items-center gap-2">
                    <XCircle size={16} /> Rejected
                  </span>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
