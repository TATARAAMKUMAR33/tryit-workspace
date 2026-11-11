'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GitBranch, RefreshCw, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PipelineLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [runSummary, setRunSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('today');
  const [stats, setStats] = useState({ totalRuns: 0, totalGenerated: 0, totalFailed: 0, avgQuality: 0, totalCost: 0 });

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('generation_pipeline_log').select('*').order('created_at', { ascending: false });
    if (filterDate === 'today') q = q.gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
    if (filterDate === 'week') q = q.gte('created_at', new Date(Date.now() - 7*86400000).toISOString());
    const { data } = await q.limit(200);
    if (data) {
      setLogs(data);
      const totalGenerated = data.reduce((s, l) => s + (l.questions_passed || 0), 0);
      const totalFailed = data.reduce((s, l) => s + (l.questions_failed || 0), 0);
      const totalCost = data.reduce((s, l) => s + Number(l.cost_usd || 0), 0);
      const runs = [...new Set(data.map(l => l.github_run_id))].length;
      setStats({ totalRuns: runs, totalGenerated, totalFailed, avgQuality: 0, totalCost });

      // Build run summary
      const runMap: Record<string, any> = {};
      data.forEach(l => {
        const key = l.github_run_id || 'manual';
        if (!runMap[key]) runMap[key] = { run_id: key, run_number: l.github_run_number, generated: 0, failed: 0, cost: 0, started: l.created_at };
        runMap[key].generated += l.questions_passed || 0;
        runMap[key].failed += l.questions_failed || 0;
        runMap[key].cost += Number(l.cost_usd || 0);
      });
      setRunSummary(Object.values(runMap).slice(0, 10));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterDate]);

  const failureGroups: Record<string, number> = {};
  logs.filter(l => l.failure_reason).forEach(l => {
    failureGroups[l.failure_reason] = (failureGroups[l.failure_reason] || 0) + 1;
  });

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-teal-500" size={40}/></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><GitBranch className="text-teal-500" size={32}/> Pipeline Log</h1>
          <p className="text-gray-500">Question generation pipeline — every run, every stage, every failure tracked.</p>
        </div>
        <div className="flex gap-3">
          {['today','week','all'].map(d => (
            <button key={d} onClick={() => setFilterDate(d)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${filterDate === d ? 'bg-teal-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
              {d}
            </button>
          ))}
          <button onClick={() => exportToCSV(logs, 'TryIT_Pipeline_Log')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Runs', value: stats.totalRuns, color: 'text-blue-500' },
          { label: 'Generated', value: stats.totalGenerated.toLocaleString(), color: 'text-green-500' },
          { label: 'Failed', value: stats.totalFailed, color: stats.totalFailed > 0 ? 'text-red-500' : 'text-gray-400' },
          { label: 'Success Rate', value: stats.totalGenerated + stats.totalFailed > 0 ? `${Math.round(stats.totalGenerated/(stats.totalGenerated+stats.totalFailed)*100)}%` : '—', color: 'text-purple-500' },
          { label: 'Total Cost', value: `$${stats.totalCost.toFixed(4)}`, color: 'text-amber-500' },
        ].map(card => (
          <div key={card.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {Object.keys(failureGroups).length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2 text-red-500"><AlertTriangle size={16}/> Failure Analysis</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(failureGroups).map(([reason, count]) => (
              <span key={reason} className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-xl font-bold">
                {reason}: {count}x
              </span>
            ))}
          </div>
        </div>
      )}

      {runSummary.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h2 className="font-bold mb-4">Questions Per Run</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={runSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
              <XAxis dataKey="run_number" stroke="#6b7280" fontSize={10} tickFormatter={n => `#${n}`}/>
              <YAxis stroke="#6b7280" fontSize={10}/>
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', fontSize: '12px' }}/>
              <Bar dataKey="generated" fill="#10b981" radius={[4,4,0,0]} name="Generated"/>
              <Bar dataKey="failed" fill="#ef4444" radius={[4,4,0,0]} name="Failed"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--card-border)]">
          <h2 className="font-bold">Detailed Log ({logs.length} entries)</h2>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--background)] sticky top-0">
                {['Stage', 'Topic', 'Exam', 'Lang', 'Attempted', 'Passed', 'Failed', 'Model', 'Provider', 'Run', 'Time', 'Cost'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className={`border-b border-[var(--card-border)] hover:bg-[var(--background)] ${l.questions_failed > 0 ? 'bg-red-500/5' : ''}`}>
                  <td className="px-3 py-2 text-xs font-bold">{l.pipeline_stage}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{l.topic_name || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{l.exam_target || '—'}</td>
                  <td className="px-3 py-2 text-xs uppercase text-gray-500">{l.language_code || 'en'}</td>
                  <td className="px-3 py-2 text-xs font-bold">{l.questions_attempted}</td>
                  <td className="px-3 py-2 text-xs text-green-500 font-bold">{l.questions_passed}</td>
                  <td className="px-3 py-2 text-xs">
                    {l.questions_failed > 0
                      ? <span className="text-red-500 font-bold">{l.questions_failed}</span>
                      : <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">{l.model_used?.substring(0,15) || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">{l.api_provider || '—'}</td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-400">#{l.github_run_number || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2 text-xs text-amber-500">{l.cost_usd ? `$${Number(l.cost_usd).toFixed(5)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}