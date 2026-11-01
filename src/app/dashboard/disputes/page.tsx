'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Gavel, AlertTriangle, ShieldCheck, IndianRupee, 
  MessageSquare, ExternalLink, RefreshCw, XCircle, CheckCircle2
} from 'lucide-react';

type DisputeType = {
  id: string;
  raised_by: string;
  against_user: string;
  reason: string;
  evidence_url: string | null;
  amount_involved: number;
  status: 'open' | 'investigating' | 'refunded' | 'dismissed';
  resolution_notes: string | null;
  created_at: string;
};

export default function DisputeCenter() {
  const [disputes, setDisputes] = useState<DisputeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DisputeType | null>(null);
  
  // Resolution State
  const [notes, setNotes] = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });
    if (data) setDisputes(data as DisputeType[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (status: 'refunded' | 'dismissed') => {
    if (!selectedDispute) return;
    if (!notes.trim()) {
      alert('Please add resolution notes before closing the case.');
      return;
    }

    // 1. Update the dispute
    await supabase.from('disputes').update({
      status: status,
      resolution_notes: notes
    }).eq('id', selectedDispute.id);

    // 2. Log the action
    await supabase.from('audit_logs').insert([{
      user_email: localStorage.getItem('tryit_user') || 'admin',
      action: status === 'refunded' ? 'ISSUE_DISPUTE_REFUND' : 'DISMISS_DISPUTE',
      details: { dispute_id: selectedDispute.id, amount: selectedDispute.amount_involved }
    }]);

    // Reset & refresh
    setSelectedDispute(null);
    setNotes('');
    fetchDisputes();
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'investigating': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'refunded': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'dismissed': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Gavel className="text-red-500" size={32} /> Dispute Resolution
          </h1>
          <p className="text-gray-500">Mediate conflicts, review evidence, and issue escrow refunds.</p>
        </div>
        <button onClick={fetchDisputes} className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-gray-500/10 text-gray-500 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Dispute List */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="font-bold text-lg text-[var(--foreground)] mb-2 flex items-center gap-2"><AlertTriangle className="text-yellow-500" size={20}/> Active Cases</h2>
          {disputes.length === 0 ? (
            <p className="text-gray-500 italic">No disputes found.</p>
          ) : (
            disputes.map(d => (
              <div 
                key={d.id} 
                onClick={() => { setSelectedDispute(d); setNotes(d.resolution_notes || ''); }}
                className={`bg-[var(--card-bg)] border cursor-pointer p-5 rounded-2xl transition-all ${selectedDispute?.id === d.id ? 'border-red-500/50 shadow-lg' : 'border-[var(--card-border)] hover:border-gray-500/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{new Date(d.created_at).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusBadge(d.status)}`}>{d.status}</span>
                </div>
                <p className="font-bold text-[var(--foreground)] line-clamp-1">{d.reason}</p>
                <div className="flex justify-between items-center mt-3 text-sm">
                  <span className="text-gray-500 truncate">{d.raised_by.split('@')[0]}</span>
                  {d.amount_involved > 0 && <span className="font-bold text-red-500 flex items-center"><IndianRupee size={12}/>{d.amount_involved}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Case Details & Resolution */}
        <div className="md:col-span-2">
          {selectedDispute ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-xl sticky top-24">
              
              <div className="flex justify-between items-start mb-6 border-b border-[var(--card-border)] pb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedDispute.reason}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="font-bold text-[var(--foreground)]">{selectedDispute.raised_by}</span> 
                    vs 
                    <span className="font-bold text-red-500">{selectedDispute.against_user}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount in Escrow</p>
                  <p className="text-2xl font-black text-[var(--foreground)] flex items-center justify-end"><IndianRupee size={20}/>{selectedDispute.amount_involved}</p>
                </div>
              </div>

              {/* Evidence */}
              <div className="mb-8">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Evidence Provided</p>
                {selectedDispute.evidence_url ? (
                  <a href={selectedDispute.evidence_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-3 bg-[var(--background)] border border-[var(--card-border)] rounded-xl w-fit text-blue-500 hover:bg-blue-500/10 transition-colors font-medium">
                    <MessageSquare size={18} /> View Attached Chat/Image <ExternalLink size={14} />
                  </a>
                ) : (
                  <p className="text-sm text-gray-500 italic">No evidence attached. Rely on system logs.</p>
                )}
              </div>

              {/* Resolution Form */}
              {selectedDispute.status === 'open' || selectedDispute.status === 'investigating' ? (
                <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--card-border)]">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck className="text-blue-500"/> Mediation & Resolution</h3>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document the investigation details and final decision..."
                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 h-32 focus:outline-none focus:border-blue-500 resize-none mb-4"
                  />
                  <div className="flex gap-4">
                    <button onClick={() => handleResolve('dismissed')} className="flex-1 bg-gray-500/10 text-gray-600 dark:text-gray-300 hover:bg-gray-500/20 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <XCircle size={18} /> Dismiss Claim
                    </button>
                    <button onClick={() => handleResolve('refunded')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/30">
                      <CheckCircle2 size={18} /> Issue Refund
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--card-border)]">
                  <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">Resolution Notes</h3>
                  <p className="text-[var(--foreground)]">{selectedDispute.resolution_notes || 'No notes provided.'}</p>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 text-center h-full flex flex-col justify-center items-center">
              <Gavel size={64} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)]">Select a Case</h3>
              <p className="text-gray-500">Choose a dispute from the left to review evidence and mediate.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
