'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, IndianRupee, Database, Activity,
  RefreshCw, BarChart3, Users, Target, ArrowUp, ArrowDown
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    revenue: 0, payouts: 0, totalQuestions: 0,
    activeStudents: 0, paidStudents: 0, freeStudents: 0,
    mentorQuestions: 0, ticketsResolved: 0, avgResolutionMins: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [examDistribution, setExamDistribution] = useState<any[]>([]);
  const [questionsBySubject, setQuestionsBySubject] = useState<any[]>([]);
  const [weeklyGrowth, setWeeklyGrowth] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const [
      invoicesRes, walletsRes, questionsRes, examsRes,
      doubtsRes, pulseRes, profilesRes, ticketsRes,
      mentorQRes, submissionsRes
    ] = await Promise.all([
      supabase.from('invoices').select('amount, status, created_at'),
      supabase.from('mentor_wallets').select('total_paid, mentor_email'),
      supabase.from('question_bank_stats').select('created_at, subject_name, verified'),
      supabase.from('exam_submissions').select('student_email, exam_name, submitted_at'),
      supabase.from('doubts').select('id, created_at'),
      supabase.from('bharat_pulse').select('id'),
      supabase.from('profiles').select('plan, created_at, account_status'),
      supabase.from('tickets').select('status, created_at, updated_at'),
      supabase.from('submitted_questions').select('id, subject, status'),
      supabase.from('submitted_question_papers').select('id, created_at'),
    ]);

    const invoices = invoicesRes.data || [];
    const wallets = walletsRes.data || [];
    const questions = questionsRes.data || [];
    const profiles = profilesRes.data || [];
    const tickets = ticketsRes.data || [];
    const mentorQ = mentorQRes.data || [];

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const totalPayouts = wallets.reduce((s, w) => s + Number(w.total_paid || 0), 0);
    const uniqueStudents = new Set(examsRes.data?.map(e => e.student_email) || []).size;
    const paidStudents = profiles.filter(p => p.plan !== 'free').length;
    const freeStudents = profiles.filter(p => p.plan === 'free').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');
    const avgRes = resolvedTickets.length > 0
      ? Math.round(resolvedTickets.reduce((s, t) => {
          if (t.updated_at && t.created_at) return s + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 60000;
          return s;
        }, 0) / resolvedTickets.length)
      : 0;

    setMetrics({
      revenue: totalRevenue, payouts: totalPayouts,
      totalQuestions: questions.length, activeStudents: uniqueStudents,
      paidStudents, freeStudents,
      mentorQuestions: mentorQ.filter(q => q.status === 'approved').length,
      ticketsResolved: resolvedTickets.length, avgResolutionMins: avgRes
    });

    setRevenueData([
      { name: 'Revenue', amount: totalRevenue, fill: '#10b981' },
      { name: 'Payouts', amount: totalPayouts, fill: '#f59e0b' },
      { name: 'Net', amount: totalRevenue - totalPayouts, fill: '#3b82f6' }
    ]);

    setEngagementData([
      { name: 'Exams Taken', value: examsRes.data?.length || 0 },
      { name: 'Doubts Asked', value: doubtsRes.data?.length || 0 },
      { name: 'Pulse Posts', value: pulseRes.data?.length || 0 },
      { name: 'Mentor Papers', value: submissionsRes.data?.length || 0 },
    ]);

    setPlanDistribution([
      { name: 'Free', value: freeStudents },
      { name: 'Pro', value: profiles.filter(p => p.plan === 'pro').length },
      { name: 'Ultra', value: profiles.filter(p => p.plan === 'ultra').length },
    ]);

    // Questions by subject
    const subjectCounts: Record<string, number> = {};
    questions.forEach(q => { 
  const subKey = q.subject_name || 'Unknown';
  subjectCounts[subKey] = (subjectCounts[subKey] || 0) + 1; 
      });
    // Weekly signups
    const weeks: Record<string, number> = {};
    profiles.forEach(p => {
      const week = new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      weeks[week] = (weeks[week] || 0) + 1;
    });
    const weekData = Object.entries(weeks).slice(-7).map(([date, signups]) => ({ date, signups }));
    setWeeklyGrowth(weekData);

    // Exam distribution
    const examCounts: Record<string, number> = {};
    examsRes.data?.forEach(e => { if (e.exam_name) examCounts[e.exam_name] = (examCounts[e.exam_name] || 0) + 1; });
    const examData = Object.entries(examCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: name.substring(0, 15), count }));
    setExamDistribution(examData);

    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  const conversionRate = metrics.paidStudents + metrics.freeStudents > 0
    ? Math.round((metrics.paidStudents / (metrics.paidStudents + metrics.freeStudents)) * 100)
    : 0;

  const kpiCards = [
    { label: 'Total Revenue', value: `₹${metrics.revenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-500/10', sub: 'All paid invoices' },
    { label: 'Mentor Payouts', value: `₹${metrics.payouts.toLocaleString()}`, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10', sub: 'Total disbursed' },
    { label: 'Net Revenue', value: `₹${(metrics.revenue - metrics.payouts).toLocaleString()}`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Revenue minus payouts' },
    { label: 'Question Bank', value: metrics.totalQuestions.toLocaleString(), icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: `+${metrics.mentorQuestions} from mentors` },
    { label: 'Active Students', value: metrics.activeStudents.toLocaleString(), icon: Users, color: 'text-teal-500', bg: 'bg-teal-500/10', sub: 'Took at least 1 exam' },
    { label: 'Paid Conversion', value: `${conversionRate}%`, icon: Activity, color: conversionRate > 20 ? 'text-green-500' : 'text-orange-500', bg: 'bg-blue-500/10', sub: `${metrics.paidStudents} paid users` },
    { label: 'Tickets Resolved', value: metrics.ticketsResolved, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: `Avg ${metrics.avgResolutionMins}m resolution` },
    { label: 'Free Students', value: metrics.freeStudents.toLocaleString(), icon: Users, color: 'text-gray-500', bg: 'bg-gray-500/10', sub: 'Conversion opportunity' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><BarChart3 className="text-blue-500" size={32}/> Platform Analytics</h1>
          <p className="text-gray-500">Revenue, growth, content, and engagement intelligence.</p>
        </div>
        <button onClick={fetchAnalytics} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20}/>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl">
            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon size={18} className={card.color}/>
            </div>
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{card.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">Financial Health (Revenue vs Payouts)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12}/>
              <YAxis stroke="#6b7280" fontSize={12}/>
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px' }}/>
              <Bar dataKey="amount" radius={[8,8,0,0]}>
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">Student Plan Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px' }}/>
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">Questions by Subject</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={questionsBySubject} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
              <XAxis type="number" stroke="#6b7280" fontSize={12}/>
              <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={80}/>
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px' }}/>
              <Bar dataKey="count" fill="#8b5cf6" radius={[0,8,8,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">Platform Engagement</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2}/>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12}/>
              <YAxis stroke="#6b7280" fontSize={12}/>
              <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--card-border)', borderRadius: '12px' }}/>
              <Bar dataKey="value" fill="#06b6d4" radius={[8,8,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {examDistribution.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">Top Exams by Submissions</h2>
          <div className="space-y-3">
            {examDistribution.map((exam, idx) => {
              const max = examDistribution[0].count;
              const pct = Math.round((exam.count / max) * 100);
              return (
                <div key={exam.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{exam.name}</span>
                    <span className="font-bold text-blue-500">{exam.count} submissions</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" style={{ width: `${pct}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}