'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Map, RefreshCw, AlertTriangle, CheckCircle2, Zap, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function ContentGapRadar() {
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('CRITICAL');
  const [filterLang, setFilterLang] = useState('all');
  const [triggering, setTriggering] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [summary, setSummary] = useState({ critical: 0, low: 0, medium: 0, good: 0 });
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('content_gap_radar').select('*').limit(500);
    if (data) {
      setGaps(data);
      const langs = [...new Set(data.map((g: any) => g.language_code).filter(Boolean))];
      setLanguages(langs as string[]);
      setSummary({
        critical: data.filter(g => g.coverage_status === 'CRITICAL').length,
        low: data.filter(g => g.coverage_status === 'LOW').length,
        medium: data.filter(g => g.coverage_status === 'MEDIUM').length,
        good: data.filter(g => g.coverage_status === 'GOOD').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const triggerGeneration = async (gap: any) => {
    setTriggering(`${gap.topic_name}-${gap.language_code}`);
    await supabase.from('audit_logs').insert([{
      user_email: user,
      action: 'CONTENT_GAP_GENERATION_TRIGGERED',
      details: {
        topic: gap.topic_name,
        subject: gap.subject_name,
        language: gap.language_code,
        current_count: gap.total_questions,
        status: gap.coverage_status
      }
    }]);
    await supabase.from('staff_notifications').insert([{
      to_email: user,
      title: `Generation triggered: ${gap.topic_name}`,
      body: `Added to queue. Worker will generate questions for this topic.`,
      type: 'info',
      link: '/dashboard/pipeline'
    }]);
    setTimeout(() => setTriggering(null), 2000);
  };

  const filtered = gaps.filter(g => {
    if (filterStatus !== 'all' && g.coverage_status !== filterStatus) return false;
    if (filterLang !== 'all' && g.language_code !== filterLang) return false;
    return true;
  });

  const statusColor = (s: string) => ({
    CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/30',
    LOW: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    MEDIUM: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    GOOD: 'text-green-500 bg-green-500/10 border-green-500/30',
  }[s] || 'text-gray-500 bg-gray-500/10');

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Map className="text-blue-500" size={32}/> Content Gap Radar</h1>
          <p className="text-gray-500">Topics with insufficient questions. Critical = under 10 questions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(filtered, 'TryIT_Content_Gaps')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
            <RefreshCw size={18}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Critical (<10)', value: summary.critical, color: 'text-red-500', bg: 'bg-red-500/10', id: 'CRITICAL' },
          { label: 'Low (<50)', value: summary.low, color: 'text-orange-500', bg: 'bg-orange-500/10', id: 'LOW' },
          { label: 'Medium (<100)', value: summary.medium, color: 'text-yellow-500', bg: 'bg-yellow-500/10', id: 'MEDIUM' },
          { label: 'Good (100+)', value: summary.good, color: 'text-green-500', bg: 'bg-green-500/10', id: 'GOOD' },
        ].map(card => (
          <div key={card.id} onClick={() => setFilterStatus(card.id)}
            className={`${card.bg} rounded-2xl p-5 text-center cursor-pointer transition-all ${filterStatus === card.id ? 'ring-2 ring-offset-2 ring-current' : ''}`}>
            <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 font-bold mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        {['all','CRITICAL','LOW','MEDIUM','GOOD'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${filterStatus === s ? 'bg-blue-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="all">All Languages</option>
          {languages.map(l => <option key={l} value={l}>{l?.toUpperCase()}</option>)}
        </select>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--card-border)] flex justify-between">
          <span className="font-bold">{filtered.length} topics</span>
          {summary.critical > 0 && (
            <span className="text-xs text-red-500 font-bold flex items-center gap-1">
              <AlertTriangle size={12}/> {summary.critical} critical gaps need immediate generation
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                {['Status', 'Topic', 'Subject', 'Language', 'Total', 'Verified', 'Last Generated', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((g, idx) => (
                <tr key={idx} className={`border-b border-[var(--card-border)] hover:bg-[var(--background)] ${g.coverage_status === 'CRITICAL' ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusColor(g.coverage_status)}`}>
                      {g.coverage_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{g.topic_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{g.subject_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded uppercase font-bold">{g.language_code || 'en'}</span>
                  </td>
                  <td className={`px-4 py-3 font-black text-lg ${g.coverage_status === 'CRITICAL' ? 'text-red-500' : g.coverage_status === 'LOW' ? 'text-orange-500' : 'text-blue-500'}`}>
                    {g.total_questions}
                  </td>
                  <td className="px-4 py-3 text-green-500 font-bold">{g.verified_questions}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {g.last_generated ? new Date(g.last_generated).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {(g.coverage_status === 'CRITICAL' || g.coverage_status === 'LOW') && (
                      <button onClick={() => triggerGeneration(g)}
                        disabled={triggering === `${g.topic_name}-${g.language_code}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors">
                        <Zap size={12}/>
                        {triggering === `${g.topic_name}-${g.language_code}` ? 'Queued!' : 'Trigger'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}