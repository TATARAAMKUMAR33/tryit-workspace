'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, ShieldAlert, CheckCircle2, UserX, UserPlus, RefreshCw, Clock } from 'lucide-react';

type LogType = {
  id: string;
  user_email: string;
  action: string;
  details: any;
  created_at: string;
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  const getActionStyle = (action: string) => {
    if (action.includes('APPROVE')) return { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2 };
    if (action.includes('REJECT')) return { color: 'text-red-500', bg: 'bg-red-500/10', icon: ShieldAlert };
    if (action.includes('ADD_STAFF')) return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: UserPlus };
    if (action.includes('REMOVE_STAFF')) return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: UserX };
    return { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: Activity };
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 opacity-0 animate-fade-up">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Activity className="text-red-500" size={32} /> Audit Logs
        </h1>
        <p className="text-gray-500">Immutable record of every action taken by staff members.</p>
      </div>

      <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl p-8 shadow-xl">
        <div className="relative border-l border-gray-500/20 ml-4 space-y-8">
          {logs.length === 0 ? (
            <p className="text-gray-500 italic pl-6">No activity recorded yet. Perform an action in QA or Staff to see it here.</p>
          ) : (
            logs.map((log) => {
              const style = getActionStyle(log.action);
              return (
                <div key={log.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[17px] top-1 p-1.5 rounded-full border-4 border-[var(--background)] ${style.bg}`}>
                    <style.icon size={14} className={style.color} />
                  </div>
                  
                  {/* Log Content */}
                  <div className="bg-[var(--background)] border border-[var(--card-border)] p-4 rounded-2xl hover:border-gray-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-[var(--foreground)]">
                        {log.user_email.split('@')[0]} <span className="text-gray-500 font-normal">did</span> {log.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 bg-[var(--card-bg)] px-2 py-1 rounded-lg">
                        <Clock size={12} /> {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Details JSON */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="text-xs text-gray-500 font-mono bg-[var(--card-bg)] p-3 rounded-xl mt-2 overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
