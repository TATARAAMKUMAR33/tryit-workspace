'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Database, CheckCircle2, Ticket, Users, Activity, 
  IndianRupee, TrendingUp, AlertTriangle, Calendar,
  BookOpen, Shield, Zap, RefreshCw, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuestions: 0, pendingQA: 0, openTickets: 0, totalStaff: 0,
    mentorQuestions: 0, revenueToday: 0, activeExams: 0,
    highDropout: 0, healthScore: 0, slaBreaches: 0,
    activeStudents: 0, pdfUploads: 0
  });
  const [criticalExams, setCriticalExams] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [recentRisks, setRecentRisks] = useState<any[]>([]);
  const [runbook, setRunbook] = useState<any[]>([]);
  const role = typeof window !== 'undefined' ? localStorage.getItem('tryit_role') || '' : '';
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);

    const [
      qTotal, qPending, tickets, staff,
      mentorQ, revenue, exams, dropout,
      health, sla, risks, rb, pdfs
    ] = await Promise.all([
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }).eq('verified', false),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('staff_roles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('submitted_questions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('invoices').select('amount').eq('status', 'paid').gte('created_at', todayStart.toISOString()),
      supabase.from('exam_countdown').select('*').lte('days_to_exam', 30).order('days_to_exam').limit(5),
      supabase.from('dropout_risk').select('id', { count: 'exact', head: true }).eq('churn_risk', 'HIGH'),
      supabase.from('platform_health_score').select('health_score').single(),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open').lt('sla_deadline', new Date().toISOString()),
      supabase.from('risk_alerts').select('*').eq('status', 'pending').order('risk_score', { ascending: false }).limit(3),
      supabase.from('daily_runbook').select('*').eq('date', today).order('due_time').limit(5),
      supabase.from('submitted_question_papers').select('id', { count: 'exact', head: true }),
    ]);

    const totalRevenue = revenue.data?.reduce((s, i) => s + Number(i.amount), 0) || 0;

    setStats({
      totalQuestions: qTotal.count || 0,
      pendingQA: qPending.count || 0,
      openTickets: tickets.count || 0,
      totalStaff: staff.count || 0,
      mentorQuestions: mentorQ.count || 0,
      revenueToday: totalRevenue,
      activeExams: exams.data?.filter(e => e.days_to_exam <= 7).length || 0,
      highDropout: dropout.count || 0,
      healthScore: health.data?.health_score || 0,
      slaBreaches: sla.count || 0,
      activeStudents: 0,
      pdfUploads: pdfs.count || 0,
    });

    if (exams.data) setCriticalExams(exams.data);
    if (risks.data) setRecentRisks(risks.data);
    if (rb.data) setRunbook(rb.data);

    const { data: t } = await supabase.from('tickets').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(3);
    if (t) setRecentTickets(t);

    setLoading(false);
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 30000); return () => clearInterval(i); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-blue-500 animate-pulse">
      <Activity className="animate-spin mr-3" size={28}/>
      <span className="font-medium">Loading Live Data...</span>
    </div>
  );

  const topCards = [
    { title: 'Total Questions', value: stats.totalQuestions.toLocaleString(), icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/dashboard/qa', sub: `+${stats.mentorQuestions} from mentors` },
    { title: 'Pending QA Review', value: stats.pendingQA.toLocaleString(), icon: CheckCircle2, color: stats.pendingQA > 500 ? 'text-orange-500' : 'text-green-500', bg: stats.pendingQA > 500 ? 'bg-orange-500/10' : 'bg-green-500/10', href: '/dashboard/qa', sub: 'Need human review' },
    { title: 'Open Tickets', value: stats.openTickets, icon: Ticket, color: stats.openTickets > 10 ? 'text-red-500' : 'text-orange-500', bg: 'bg-orange-500/10', href: '/dashboard/tickets', sub: `${stats.slaBreaches} SLA breached` },
    { title: 'Active Staff', value: stats.totalStaff, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', href: '/dashboard/staff', sub: 'Currently registered' },
    { title: 'Revenue Today', value: `₹${stats.revenueToday.toLocaleString()}`, icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-500/10', href: '/dashboard/billing', sub: 'Paid invoices today' },
    { title: 'Platform Health', value: `${stats.healthScore}/100`, icon: Activity, color: stats.healthScore > 80 ? 'text-green-500' : 'text-red-500', bg: stats.healthScore > 80 ? 'bg-green-500/10' : 'bg-red-500/10', href: '/dashboard/system', sub: 'Auto-calculated score' },
    { title: 'Dropout Risk', value: stats.highDropout, icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-500/10', href: '/dashboard/students', sub: 'High risk students' },
    { title: 'Mentor Submissions', value: stats.pdfUploads, icon: BookOpen, color: 'text-teal-500', bg: 'bg-teal-500/10', href: '/dashboard/content-ops', sub: 'Papers submitted' },
  ];

  const myRunbook = runbook.filter(r => role === 'super_admin' || r.assigned_role === role);
  const pendingRunbook = myRunbook.filter(r => r.status === 'pending');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back, <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent capitalize">{user.split('@')[0]}</span>
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
            Live data · Auto-refreshes every 30 seconds
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase">{role.replace('_', ' ')}</span>
          </p>
        </div>
        <button onClick={fetchAll} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500 hover:bg-gray-500/10">
          <RefreshCw size={18}/>
        </button>
      </div>

      {stats.slaBreaches > 0 && (
        <div onClick={() => router.push('/dashboard/tickets')}
          className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-500/15 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 animate-pulse" size={20}/>
            <span className="font-bold text-red-500">{stats.slaBreaches} ticket{stats.slaBreaches > 1 ? 's' : ''} breached SLA — Action required immediately</span>
          </div>
          <ArrowRight className="text-red-500" size={18}/>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topCards.map((card, i) => (
          <div key={i} onClick={() => router.push(card.href)}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <card.icon size={20} className={card.color}/>
            </div>
            <div className={`text-3xl font-black ${card.color} mb-0.5`}>{card.value}</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{card.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Calendar size={18} className="text-red-500"/> Exam Countdown</span>
            <button onClick={() => router.push('/dashboard/command-center')} className="text-xs text-blue-500 hover:underline">View all</button>
          </h2>
          {criticalExams.length === 0 ? <p className="text-gray-500 text-sm">No upcoming exams in 30 days</p>
            : criticalExams.map(e => (
              <div key={e.exam_name} className={`flex items-center justify-between p-3 rounded-xl mb-2 ${e.days_to_exam <= 3 ? 'bg-red-500/10 border border-red-500/30' : e.days_to_exam <= 7 ? 'bg-orange-500/10' : 'bg-[var(--background)]'}`}>
                <div>
                  <p className="font-bold text-sm">{e.exam_name}</p>
                  <p className="text-xs text-gray-500">{e.exam_body}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${e.days_to_exam <= 3 ? 'text-red-500' : e.days_to_exam <= 7 ? 'text-orange-500' : 'text-blue-500'}`}>{e.days_to_exam}</p>
                  <p className="text-[10px] text-gray-500">days</p>
                </div>
              </div>
            ))}
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Ticket size={18} className="text-orange-500"/> Recent Tickets</span>
            <button onClick={() => router.push('/dashboard/tickets')} className="text-xs text-blue-500 hover:underline">View all</button>
          </h2>
          {recentTickets.length === 0 ? (
            <div className="text-center py-6"><CheckCircle2 size={28} className="text-green-500 mx-auto mb-2"/><p className="text-sm text-gray-500">No open tickets</p></div>
          ) : recentTickets.map(t => (
            <div key={t.id} className="p-3 bg-[var(--background)] rounded-xl mb-2">
              <div className="flex justify-between items-start">
                <p className="font-bold text-sm">{t.issue_type}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-orange-500/20 text-orange-500'}`}>{t.priority}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t.student_email?.split('@')[0]}</p>
            </div>
          ))}
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Shield size={18} className="text-red-500"/> Risk Alerts</span>
            <button onClick={() => router.push('/dashboard/risk')} className="text-xs text-blue-500 hover:underline">View all</button>
          </h2>
          {recentRisks.length === 0 ? (
            <div className="text-center py-6"><CheckCircle2 size={28} className="text-green-500 mx-auto mb-2"/><p className="text-sm text-gray-500">No pending risks</p></div>
          ) : recentRisks.map(r => (
            <div key={r.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl mb-2">
              <p className="font-bold text-sm">{r.entity_email}</p>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">{r.risk_type}</p>
                <span className="text-xs font-black text-red-500">{r.risk_score}/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingRunbook.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-yellow-500"/> Your Pending Tasks Today ({pendingRunbook.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRunbook.map(task => (
              <div key={task.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <p className="font-bold text-sm">{task.task_name}</p>
                <p className="text-xs text-gray-500 mt-1">Due by {task.due_time}</p>
                {task.consequence_if_missed && <p className="text-xs text-orange-400 mt-1">⚠️ {task.consequence_if_missed}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-blue-500"/> Question Bank Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Questions', value: stats.totalQuestions.toLocaleString(), color: 'text-blue-500' },
            { label: 'Verified & Live', value: (stats.totalQuestions - stats.pendingQA).toLocaleString(), color: 'text-green-500' },
            { label: 'Pending QA', value: stats.pendingQA.toLocaleString(), color: 'text-orange-500' },
            { label: 'From Mentors', value: stats.mentorQuestions.toLocaleString(), color: 'text-purple-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-[var(--background)] rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}