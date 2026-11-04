'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, RefreshCw, Search, Download, Filter } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actions, setActions] = useState<string[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (data) {
      setLogs(data);
      const uniqueActions = [...new Set(data.map((l: any) => l.action))];
      setActions(uniqueActions);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.user_email?.includes(search) || l.action?.includes(search) || JSON.stringify(l.details).includes(search);
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('BAN') || action.includes('BLOCK')) return 'text-red-500 bg-red-500/10';
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('LOGIN')) return 'text-green-500 bg-green-500/10';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-blue-500 bg-blue-500/10';
    if (action.includes('RISK') || action.includes('FLAG')) return 'text-orange-500 bg-orange-500/10';
    return 'text-gray-500 bg-gray-500/10';
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Activity className="text-slate-500" size={32}/> Audit Logs</h1>
          <p className="text-gray-500">Complete trail of all staff and system actions. {logs.length} records loaded.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(filtered, 'TryIT_AuditLogs')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2 hover:border-slate-400">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchLogs} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email, action, or details..."
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-slate-400"/>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none appearance-none">
            <option value="all">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
              <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Time</th>
              <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">User</th>
              <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Action</th>
              <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-500">No audit logs match your filter</td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} className="border-b border-[var(--card-border)] hover:bg-[var(--background)] transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-xs">{log.user_email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${getActionColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details).substring(0, 80) + '...' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}