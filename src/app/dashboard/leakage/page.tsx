'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingDown, RefreshCw, AlertTriangle, Download, IndianRupee } from 'lucide-react';
import { exportToCSV } from '@/lib/exportCsv';

export default function RevenueLeakage() {
  const [leakage, setLeakage] = useState<any[]>([]);
  const [churnRisk, setChurnRisk] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leakage'|'churn'|'prediction'>('leakage');
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    const [l, c, p] = await Promise.all([
      supabase.from('revenue_leakage_alerts').select('*').limit(50),
      supabase.from('churn_risk_score').select('*').eq('churn_risk', 'HIGH').limit(50),
      supabase.from('exam_prediction').select('*').order('avg_score', { ascending: false }).limit(50),
    ]);
    if (l.data) setLeakage(l.data);
    if (c.data) setChurnRisk(c.data);
    if (p.data) setPrediction(p.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const queueOutreach = async (email: string) => {
    await supabase.from('outbound_message_queue').insert([{
      to_email: email,
      channel: 'email',
      message_type: 'retention',
      content: 'We noticed you haven\'t been active. Your exam preparation matters — come back and practice!',
      status: 'pending'
    }]);
    await supabase.from('audit_logs').insert([{
      user_email: user, action: 'RETENTION_OUTREACH_QUEUED', details: { target: email }
    }]);
    alert(`Outreach queued for ${email}`);
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><TrendingDown className="text-red-500" size={32}/> Revenue Intelligence</h1>
          <p className="text-gray-500">{leakage.length} leakage alerts · {churnRisk.length} high churn risk students</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCSV(activeTab === 'leakage' ? leakage : activeTab === 'churn' ? churnRisk : prediction, 'TryIT_Revenue_Intelligence')}
            className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm font-bold flex items-center gap-2">
            <Download size={16}/> Export
          </button>
          <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
            <RefreshCw size={18}/>
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'leakage', label: `Revenue Leakage (${leakage.length})` },
          { id: 'churn', label: `Churn Risk (${churnRisk.length})` },
          { id: 'prediction', label: `Exam Prediction (${prediction.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === tab.id ? 'bg-red-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leakage' && (
        <div className="space-y-3">
          {leakage.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
              <IndianRupee size={40} className="text-green-500 mx-auto mb-3"/>
              <p className="font-bold">No leakage detected</p>
            </div>
          ) : leakage.map((alert, idx) => (
            <div key={idx} className={`bg-[var(--card-bg)] border rounded-2xl p-5 flex items-center justify-between ${alert.severity === 'high' ? 'border-red-500/20' : 'border-orange-500/20'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className={alert.severity === 'high' ? 'text-red-500' : 'text-orange-500'}/>
                <div>
                  <p className="font-bold text-sm">{alert.alert_type}</p>
                  <p className="text-xs text-gray-500">{alert.email} · Plan: {alert.plan}</p>
                  <p className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${alert.severity === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {alert.severity?.toUpperCase()}
                </span>
                <button onClick={() => queueOutreach(alert.email)}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold">
                  Queue Outreach
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'churn' && (
        <div className="space-y-3">
          {churnRisk.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
              <p className="font-bold">No high-risk students</p>
            </div>
          ) : churnRisk.map((s, idx) => (
            <div key={idx} className="bg-[var(--card-bg)] border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{s.email}</p>
                <p className="text-xs text-gray-500">{s.name} · Plan: {s.plan} · Streak: {s.streak} · Exams taken: {s.exams_taken}</p>
                <div className="mt-1 w-32 bg-gray-200 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${s.churn_score}%` }}/>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Churn score: {s.churn_score}/100</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded">HIGH RISK</span>
                <button onClick={() => queueOutreach(s.email)}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold">
                  Outreach
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'prediction' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                {['Student', 'Exam', 'Attempts', 'Avg Score', 'Best', 'Prediction', 'Last Attempt'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prediction.map((p, idx) => (
                <tr key={idx} className="border-b border-[var(--card-border)] hover:bg-[var(--background)]">
                  <td className="px-4 py-3 font-medium">{p.student_email?.split('@')[0]}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.exam_name}</td>
                  <td className="px-4 py-3 text-blue-500 font-bold">{p.attempts}</td>
                  <td className="px-4 py-3">
                    <span className={`font-black ${p.avg_score >= 70 ? 'text-green-500' : p.avg_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {p.avg_score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-purple-500 font-bold">{p.best_score}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      p.prediction?.includes('Very Likely') ? 'bg-green-500/10 text-green-500' :
                      p.prediction?.includes('Likely') ? 'bg-blue-500/10 text-blue-500' :
                      p.prediction?.includes('Borderline') ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-red-500/10 text-red-500'
                    }`}>{p.prediction}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.last_attempt ? new Date(p.last_attempt).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}