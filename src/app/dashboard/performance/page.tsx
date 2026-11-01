'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, Award, Medal, Star, RefreshCw, 
  CheckCircle2, Ticket, CheckSquare, Zap
} from 'lucide-react';

export default function StaffLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    setLoading(true);

    // 1. Get all staff
    const { data: staff } = await supabase.from('staff_roles').select('user_email, role');
    if (!staff) return;

    // 2. Fetch all completed tasks, resolved tickets, and reviewed questions in parallel
    const [tasksRes, ticketsRes, qaRes] = await Promise.all([
      supabase.from('tasks').select('assigned_to').eq('status', 'done'),
      supabase.from('tickets').select('assigned_to').eq('status', 'resolved'),
      supabase.from('questions').select('reviewed_by').not('reviewed_by', 'is', null)
    ]);

    const completedTasks = tasksRes.data || [];
    const resolvedTickets = ticketsRes.data || [];
    const reviewedQA = qaRes.data || [];

    // 3. Calculate scores for each staff member
    const performanceData = staff.map(member => {
      const email = member.user_email;
      
      const tasksDone = completedTasks.filter(t => t.assigned_to === email).length;
      const ticketsSolved = resolvedTickets.filter(t => t.assigned_to === email).length;
      const questionsChecked = reviewedQA.filter(q => q.reviewed_by === email).length;

      // Weighted scoring system
      const totalScore = (tasksDone * 10) + (ticketsSolved * 15) + (questionsChecked * 5);

      return {
        email,
        role: member.role,
        tasksDone,
        ticketsSolved,
        questionsChecked,
        totalScore
      };
    });

    // 4. Sort by highest score
    performanceData.sort((a, b) => b.totalScore - a.totalScore);
    setLeaderboard(performanceData);
    setLoading(false);
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500 animate-bounce" size={32} />;
    if (index === 1) return <Medal className="text-gray-400" size={28} />;
    if (index === 2) return <Award className="text-orange-500" size={28} />;
    return <span className="text-gray-500 font-bold text-xl">{index + 1}</span>;
  };

  const getPodiumStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-t from-yellow-500/20 to-transparent border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] transform md:-translate-y-4';
    if (index === 1) return 'bg-gradient-to-t from-gray-500/20 to-transparent border-gray-400/50';
    if (index === 2) return 'bg-gradient-to-t from-orange-500/20 to-transparent border-orange-500/50';
    return 'bg-[var(--card-bg)] border-[var(--card-border)]';
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} /> Staff Leaderboard
          </h1>
          <p className="text-gray-500">Gamified performance tracking for the TryIT team.</p>
        </div>
        <button onClick={fetchPerformance} className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-gray-500/10 text-gray-500 transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-12 mb-8">
        {/* Rank 2 */}
        {top3[1] && (
          <div className={`border-2 rounded-3xl p-6 text-center order-1 md:order-1 ${getPodiumStyle(1)}`}>
            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-500 mb-4 shadow-lg">
              {getRankIcon(1)}
            </div>
            <h3 className="font-bold text-lg text-[var(--foreground)]">{top3[1].email.split('@')[0]}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{top3[1].role.replace('_', ' ')}</p>
            <div className="text-3xl font-black text-[var(--foreground)]">{top3[1].totalScore} <span className="text-sm text-gray-500">pts</span></div>
          </div>
        )}

        {/* Rank 1 */}
        {top3[0] && (
          <div className={`border-2 rounded-3xl p-8 text-center order-2 md:order-2 z-10 ${getPodiumStyle(0)}`}>
            <div className="w-20 h-20 mx-auto bg-yellow-900/30 rounded-full flex items-center justify-center border-4 border-yellow-500 mb-4 shadow-xl">
              {getRankIcon(0)}
            </div>
            <h3 className="font-black text-2xl text-[var(--foreground)]">{top3[0].email.split('@')[0]}</h3>
            <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">{top3[0].role.replace('_', ' ')}</p>
            <div className="text-4xl font-black text-yellow-500">{top3[0].totalScore} <span className="text-sm text-gray-500">pts</span></div>
          </div>
        )}

        {/* Rank 3 */}
        {top3[2] && (
          <div className={`border-2 rounded-3xl p-6 text-center order-3 md:order-3 ${getPodiumStyle(2)}`}>
            <div className="w-16 h-16 mx-auto bg-orange-900/30 rounded-full flex items-center justify-center border-4 border-orange-500 mb-4 shadow-lg">
              {getRankIcon(2)}
            </div>
            <h3 className="font-bold text-lg text-[var(--foreground)]">{top3[2].email.split('@')[0]}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{top3[2].role.replace('_', ' ')}</p>
            <div className="text-3xl font-black text-[var(--foreground)]">{top3[2].totalScore} <span className="text-sm text-gray-500">pts</span></div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[var(--card-border)] bg-[var(--background)]/50">
          <h2 className="text-xl font-bold flex items-center gap-2"><Star className="text-blue-500"/> Remaining Staff Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)] text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-5 font-semibold w-16 text-center">Rank</th>
                <th className="p-5 font-semibold">Employee</th>
                <th className="p-5 font-semibold text-center"><CheckSquare size={14} className="inline mr-1"/> QA Checked</th>
                <th className="p-5 font-semibold text-center"><Ticket size={14} className="inline mr-1"/> Tickets Solved</th>
                <th className="p-5 font-semibold text-center"><CheckCircle2 size={14} className="inline mr-1"/> Tasks Done</th>
                <th className="p-5 font-semibold text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {rest.map((emp, idx) => (
                <tr key={emp.email} className="hover:bg-[var(--background)]/30 transition-colors">
                  <td className="p-5 flex justify-center text-gray-500 font-bold">{idx + 4}</td>
                  <td className="p-5">
                    <p className="font-bold text-[var(--foreground)]">{emp.email}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{emp.role.replace('_', ' ')}</p>
                  </td>
                  <td className="p-5 text-center font-mono text-lg">{emp.questionsChecked}</td>
                  <td className="p-5 text-center font-mono text-lg">{emp.ticketsSolved}</td>
                  <td className="p-5 text-center font-mono text-lg">{emp.tasksDone}</td>
                  <td className="p-5 text-right">
                    <span className="bg-blue-500/10 text-blue-500 font-bold px-3 py-1 rounded-xl text-lg">{emp.totalScore}</span>
                  </td>
                </tr>
              ))}
              {rest.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 italic">Not enough staff data to fill the leaderboard yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scoring Legend */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 flex flex-wrap gap-6 items-center justify-center text-sm font-medium text-gray-500 shadow-sm">
        <div className="flex items-center gap-2"><Zap className="text-yellow-500" size={16} /> Ticket Resolved = <span className="text-[var(--foreground)] font-bold">15 pts</span></div>
        <div className="flex items-center gap-2"><Zap className="text-purple-500" size={16} /> Task Completed = <span className="text-[var(--foreground)] font-bold">10 pts</span></div>
        <div className="flex items-center gap-2"><Zap className="text-blue-500" size={16} /> QA Approved = <span className="text-[var(--foreground)] font-bold">5 pts</span></div>
      </div>

    </div>
  );
}
