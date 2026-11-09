'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, RefreshCw, Download, MessageSquare, Clock, Award, TrendingUp } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function MentorPerformance() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'performance' | 'wallets' | 'papers'>('performance');

  const fetchData = async () => {
    setLoading(true);
    const [perf, w, p] = await Promise.all([
      supabase.from('mentor_performance_view').select('*').limit(50),
      supabase.from('mentor_wallets').select('*').order('total_earned', { ascending: false }).limit(50),
      supabase.from('submitted_question_papers').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (perf.data) setMentors(perf.data);
    if (w.data) setWallets(w.data);
    if (p.data) setPapers(p.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const approvePaper = async (id: string) => {
    await supabase.from('submitted_question_papers').update({ status: 'approved' }).eq('id', id);
    fetchData();
  };

  const rejectPaper = async (id: string) => {
    await supabase.from('submitted_question_papers').update({ status: 'rejected' }).eq('id', id);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Star className="text-yellow-500" size={32}/> Mentor Hub</h1>
          <p className="text-gray-500">{mentors.length} active mentors · {papers.filter(p => p.status === 'pending').length} papers pending review</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(mentors, 'TryIT_Mentor_Performance')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
            <RefreshCw size={18}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Mentors', value: mentors.length, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Star },
          { label: 'Avg Quality Score', value: `${Math.round(mentors.reduce((s, m) => s + (m.quality_score || 0), 0) / Math.max(mentors.length, 1))}%`, color: 'text-green-500', bg: 'bg-green-500/10', icon: Award },
          { label: 'Papers Pending', value: papers.filter(p => p.status === 'pending').length, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Clock },
          { label: 'Total Answers', value: mentors.reduce((s, m) => s + (m.total_answers || 0), 0), color: 'text-purple-500', bg: 'bg-purple-500/10', icon: MessageSquare },
        ].map(card => (
          <div key={card.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-center">
            <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {[
          { id: 'performance', label: 'Performance Scores' },
          { id: 'wallets', label: 'Mentor Wallets' },
          { id: 'papers', label: `Question Papers (${papers.filter(p => p.status === 'pending').length} pending)` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? 'bg-yellow-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'performance' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                {['Rank', 'Mentor', 'Answers', 'Avg Response', 'Helpful', 'Quality Score', 'Last Active'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mentors.map((m, idx) => (
                <tr key={m.mentor_email} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                  <td className="px-4 py-3 font-bold text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold">{m.mentor_email?.split('@')[0]}</p>
                    <p className="text-xs text-gray-500">{m.mentor_email}</p>
                  </td>
                  <td className="px-4 py-3 font-black text-blue-500">{m.total_answers || 0}</td>
                  <td className="px-4 py-3 text-gray-500">{m.avg_response_hours ? `${m.avg_response_hours}h` : '—'}</td>
                  <td className="px-4 py-3 text-green-500 font-bold">{m.helpful_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${m.quality_score || 0}%` }}/>
                      </div>
                      <span className={`font-black text-sm ${(m.quality_score || 0) >= 80 ? 'text-green-500' : (m.quality_score || 0) >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                        {m.quality_score || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {m.last_active ? new Date(m.last_active).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
              {mentors.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No mentor activity yet. Data populates as mentors answer doubts.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="space-y-3">
          {wallets.length === 0 ? <p className="text-gray-500 text-sm">No wallet data</p>
            : wallets.map(w => (
              <div key={w.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold">{w.mentor_email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{w.mentor_email}</p>
                  <p className="text-xs text-gray-400 mt-1">Tier: {w.mentor_tier || 'Standard'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-500">₹{(w.balance || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className="text-xs text-gray-400">Total earned: ₹{(w.total_earned || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'papers' && (
        <div className="space-y-3">
          {papers.length === 0 ? <p className="text-gray-500 text-sm">No submitted papers</p>
            : papers.map(p => (
              <div key={p.id} className={`bg-[var(--card-bg)] border rounded-2xl p-5 flex items-center justify-between ${p.status === 'pending' ? 'border-orange-500/30' : 'border-[var(--card-border)]'}`}>
                <div>
                  <p className="font-bold">{p.title || `Paper ${p.id.substring(0, 8)}`}</p>
                  <p className="text-xs text-gray-500">{p.mentor_email} · {p.exam_name}</p>
                  <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN')} · {p.question_count || 0} questions</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                    p.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                    p.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                    'bg-orange-500/10 text-orange-500'
                  }`}>{p.status || 'pending'}</span>
                  {(!p.status || p.status === 'pending') && (
                    <div className="flex gap-2">
                      <button onClick={() => approvePaper(p.id)}
                        className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold">
                        Approve
                      </button>
                      <button onClick={() => rejectPaper(p.id)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}