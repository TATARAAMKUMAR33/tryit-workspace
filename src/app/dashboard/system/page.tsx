'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ToggleLeft, ToggleRight, AlertOctagon, Terminal, 
  Activity, ShieldAlert, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function SystemDashboard() {
  const [flags, setFlags] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: f } = await supabase.from('feature_flags').select('*').order('flag_name');
    const { data: l } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false });
    
    if (f) setFlags(f);
    if (l) setLogs(l);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleFlag = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setFlags(prev => prev.map(f => f.id === id ? { ...f, is_enabled: !currentStatus } : f));
    // Update DB
    await supabase.from('feature_flags').update({ is_enabled: !currentStatus }).eq('id', id);
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Terminal className="text-blue-500" size={32} /> System & Feature Flags
        </h1>
        <p className="text-gray-500">Control platform features and monitor error logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Feature Flags */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
              <Activity className="text-purple-500" /> Feature Toggles
            </h2>
            
            <div className="space-y-4">
              {flags.map(flag => (
                <div key={flag.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                  <div>
                    <p className="font-bold text-sm text-[var(--foreground)] capitalize">{flag.flag_name.replace(/_/g, ' ')}</p>
                    <p className={`text-xs font-bold mt-1 ${flag.is_enabled ? 'text-green-500' : 'text-red-500'}`}>
                      {flag.is_enabled ? 'ONLINE' : 'OFFLINE'}
                    </p>
                  </div>
                  <button onClick={() => toggleFlag(flag.id, flag.is_enabled)} className="text-gray-400 hover:text-blue-500 transition-colors">
                    {flag.is_enabled ? <ToggleRight size={36} className="text-green-500" /> : <ToggleLeft size={36} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Error Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl h-full">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
              <AlertOctagon className="text-red-500" /> Recent Error Logs (Jira Style)
            </h2>
            
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No system errors detected.</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="bg-[var(--background)] border border-red-500/20 rounded-2xl p-5 hover:border-red-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-red-500 font-bold">
                        <ShieldAlert size={16} /> {log.error_message}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <pre className="text-xs text-gray-500 bg-black/20 p-3 rounded-lg overflow-x-auto mt-2 font-mono">
                      {log.stack_trace || 'No stack trace available'}
                    </pre>
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                      Triggered by: <span className="font-semibold text-[var(--foreground)]">{log.user_email || 'Unknown User'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
