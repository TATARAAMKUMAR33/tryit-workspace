'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bug, RefreshCw, AlertOctagon } from 'lucide-react';

export default function ErrorLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false });
      if (data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3"><Bug className="text-red-500" size={32} /> Error Tracking</h1>
          <p className="text-gray-500">Monitor crashes and stack traces across the platform.</p>
        </div>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 text-center">
            <AlertOctagon size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No Errors Detected</h3>
            <p className="text-gray-500">The platform is running smoothly.</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="bg-[var(--card-bg)] border border-red-500/20 rounded-3xl p-6 shadow-sm hover:border-red-500/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-red-500 text-lg flex items-center gap-2"><AlertOctagon size={18}/> {log.error_message}</h3>
                <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <pre className="text-xs bg-black/20 p-4 rounded-xl text-gray-400 overflow-x-auto font-mono">
                {log.stack_trace || 'No stack trace available.'}
              </pre>
              <p className="text-xs text-gray-500 mt-3 font-medium">Triggered by: {log.user_email || 'Unknown'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
