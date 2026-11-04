'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, Plus, Play, Pause, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AutomationEngine() {
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('ticket_created');
  const [condition, setCondition] = useState('urgent');
  const [action, setAction] = useState('telegram_alert');

  const fetchData = async () => {
    setLoading(true);
    const [r, l] = await Promise.all([
      supabase.from('automation_rules').select('*').order('created_at', { ascending: false }),
      supabase.from('automation_logs').select('*').order('executed_at', { ascending: false }).limit(20)
    ]);
    if (r.data) setRules(r.data);
    if (l.data) setLogs(l.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('automation_rules').insert([{
      name, trigger_event: trigger, condition_value: condition, action_type: action, is_active: true
    }]);
    setName(''); fetchData();
  };

  const toggleRule = async (id: string, current: boolean) => {
    await supabase.from('automation_rules').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    await supabase.from('automation_rules').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-yellow-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Zap className="text-yellow-500" size={32}/> Automation Engine</h1>
        <p className="text-gray-500">IF-THEN rules that run automatically in the background.</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4">Create New Rule</h2>
        <form onSubmit={createRule} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Rule name"
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 col-span-2"/>
          <select value={trigger} onChange={e => setTrigger(e.target.value)}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="ticket_created">Ticket Created</option>
            <option value="ticket_urgent">Ticket Urgent</option>
            <option value="mentor_flagged">Mentor Flagged</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="sla_breach">SLA Breach</option>
          </select>
          <select value={action} onChange={e => setAction(e.target.value)}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="telegram_alert">Telegram Alert</option>
            <option value="assign_to_admin">Assign to Admin</option>
            <option value="freeze_account">Freeze Account</option>
            <option value="escalate">Escalate Ticket</option>
          </select>
          <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl px-4 py-2 flex items-center justify-center gap-2">
            <Plus size={18}/> Add
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Active Rules ({rules.filter(r => r.is_active).length})</h2>
          {rules.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center text-gray-500">No rules yet. Create one above.</div>
          ) : rules.map(rule => (
            <div key={rule.id} className={`bg-[var(--card-bg)] border rounded-2xl p-4 ${rule.is_active ? 'border-yellow-500/30' : 'border-[var(--card-border)] opacity-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{rule.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    IF <span className="text-blue-500 font-bold">{rule.trigger_event}</span> →
                    THEN <span className="text-green-500 font-bold">{rule.action_type}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleRule(rule.id, rule.is_active)}
                    className={`p-2 rounded-lg ${rule.is_active ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}>
                    {rule.is_active ? <Pause size={16}/> : <Play size={16}/>}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Execution Log</h2>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 max-h-96 overflow-y-auto space-y-2">
            {logs.length === 0
              ? <p className="text-gray-500 text-sm text-center py-8">No executions yet</p>
              : logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 text-sm border-b border-[var(--card-border)] pb-2">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0"/>
                  <div>
                    <p className="font-medium">{log.rule_name}</p>
                    <p className="text-xs text-gray-500">{log.action_taken}</p>
                    <p className="text-xs text-gray-400">{new Date(log.executed_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}