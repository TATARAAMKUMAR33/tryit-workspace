'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, Plus, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function Automation() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    const { data } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
    if (data) setRules(data);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const toggleRule = async (id: string, current: boolean) => {
    await supabase.from('automation_rules').update({ is_active: !current }).eq('id', id);
    fetchRules();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-yellow-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3"><Zap className="text-yellow-500" size={32} /> Automation Engine</h1>
          <p className="text-gray-500">Create IF-THEN rules to automate platform operations.</p>
        </div>
      </div>

      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)]">No rules created yet.</div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[var(--foreground)] mb-1">{rule.name}</h3>
                <p className="text-sm text-gray-500">IF <span className="text-blue-500 font-bold">{rule.trigger_event}</span> = {rule.condition_value} THEN <span className="text-purple-500 font-bold">{rule.action_type}</span></p>
              </div>
              <button onClick={() => toggleRule(rule.id, rule.is_active)} className={`p-2 rounded-xl transition-colors ${rule.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {rule.is_active ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
