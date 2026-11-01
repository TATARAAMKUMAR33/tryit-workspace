'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, IndianRupee, Database, Activity, RefreshCw, BarChart3 
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    payouts: 0,
    totalQuestions: 0,
    activeStudents: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);

    // 1. Fetch raw data in parallel
    const [invoicesRes, walletsRes, questionsRes, examsRes, doubtsRes, pulseRes] = await Promise.all([
      supabase.from('invoices').select('amount, status'),
      supabase.from('mentor_wallets').select('total_paid'),
      supabase.from('questions').select('created_at'),
      supabase.from('exam_submissions').select('student_email'),
      supabase.from('doubts').select('id'),
      supabase.from('bharat_pulse').select('id')
    ]);

    const invoices = invoicesRes.data || [];
    const wallets = walletsRes.data || [];
    const questions = questionsRes.data || [];

    // 2. Calculate Top-Level Metrics
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
    const totalPayouts = wallets.reduce((sum, w) => sum + Number(w.total_paid || 0), 0);
    const uniqueStudents = new Set(examsRes.data?.map(e => e.student_email) || []).size;

    setMetrics({
      revenue: totalRevenue,
      payouts: totalPayouts,
      totalQuestions: questions.length,
      activeStudents: uniqueStudents
    });

    // 3. Prepare Revenue vs Payout Chart Data
    setRevenueData([
      { name: 'Collected Revenue', amount: totalRevenue, fill: '#10b981' },
      { name: 'Mentor Payouts', amount: totalPayouts, fill: '#f59e0b' }
    ]);

    // 4. Prepare Engagement Breakdown Chart Data
    setEngagementData([
      { name: 'Exams Taken', value: examsRes.data?.length || 0 },
      { name: 'Doubts Asked', value: doubtsRes.data?.length || 0 },
      { name: 'Pulse Posts', value: pulseRes.data?.length || 0 }
    ]);

    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <BarChart3 className="text-blue-500" size={32} /> Company Analytics
          </h1>
          <p className="text-gray-500">Macro-level health, growth, and financial forecasting.</p>
        </div>
        <button onClick={fetchAnalytics} className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-gray-500/10 text-gray-500 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-green-500">
            <TrendingUp size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Total Revenue</span>
          </div>
          <h3 className="text-3xl font-black text-[var(--foreground)] flex items-center"><IndianRupee size={22}/>{metrics.revenue.toLocaleString()}</h3>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-yellow-500">
            <IndianRupee size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Mentor Payouts</span>
          </div>
          <h3 className="text-3xl font-black text-[var(--foreground)] flex items-center"><IndianRupee size={22}/>{metrics.payouts.toLocaleString()}</h3>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-500">
            <Database size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Question Bank</span>
          </div>
          <h3 className="text-3xl font-black text-[var(--foreground)]">{metrics.totalQuestions.toLocaleString()}</h3>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-purple-500">
            <Activity size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Active Students</span>
          </div>
          <h3 className="text-3xl font-black text-[var(--foreground)]">{metrics.activeStudents.toLocaleString()}</h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue vs Payout Chart */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-6 border-b border-[var(--card-border)] pb-4">Financial Health (Revenue vs Payouts)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Breakdown Chart */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-6 border-b border-[var(--card-border)] pb-4">Platform Engagement Breakdown</h2>
          <div className="h-72 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
