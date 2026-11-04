'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bug, RefreshCw, AlertTriangle, CheckCircle2, Search, Trash2 } from 'lucide-react';

export default function ErrorLogs() {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchErrors = async () => {
    setLoading(true);
    const { data } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setErrors(data);
    setLoading(false);
  };

  useEffect(() => { fetchErrors(); }, []);

  const resolveError = async (id: string) => {
    await supabase.from('error_logs').update({ resolved: true }).eq('id', id);
    fetchErrors();
  };

  const clearResolved = async () => {
    if (!confirm('Delete all resolved errors?')) return;
    await supabase.from('error_logs').delete().eq('resolved', true);
    fetchErrors();
  };

  const filtered = errors.filter(e => {
    const matchSearch = !search || JSON.stringify(e).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'unresolved' && !e.resolved) || (filter === 'resolved' && e.resolved);
    return matchSearch && matchFilter;
  });

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (severity === 'error') return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Bug className="text-red-500" size={32}/> Error Logs</h1>
          <p className="text-gray-500">{errors.filter(e => !e.resolved).length} unresolved errors</p>
        </div>
        <div className="flex gap-3">
          <button onClick={clearResolved} className="px-4 py-2 bg-gray-500/10 text-gray-500 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-sm font-bold flex items-center gap-2">
            <Trash2 size={16}/> Clear Resolved
          </button>
          <button onClick={fetchErrors} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-gray-500/10 text-gray-500">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search errors..."
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500"/>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none">
          <option value="all">All</option>
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4"/>
            <h3 className="text-xl font-bold">No errors found</h3>
            <p className="text-gray-500">System is running cleanly</p>
          </div>
        ) : filtered.map(error => (
          <div key={error.id} className={`bg-[var(--card-bg)] border rounded-2xl p-4 ${error.resolved ? 'opacity-50' : 'border-[var(--card-border)]'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle size={20} className={error.severity === 'critical' ? 'text-red-500' : 'text-orange-500'}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityColor(error.severity || 'error')}`}>
                      {(error.severity || 'error').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(error.created_at).toLocaleString()}</span>
                  </div>
                  <p className="font-bold text-sm">{error.error_type || error.message || 'Unknown Error'}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                    {error.stack_trace || error.details || 'No stack trace available'}
                  </p>
                  {error.user_email && <p className="text-xs text-blue-500 mt-1">User: {error.user_email}</p>}
                </div>
              </div>
              {!error.resolved && (
                <button onClick={() => resolveError(error.id)}
                  className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-xs font-bold shrink-0">
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}