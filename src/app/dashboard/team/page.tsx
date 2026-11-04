'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, RefreshCw, TrendingUp, Award, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TeamHub() {
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [runbook, setRunbook] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = localStorage.getItem('tryit_user') || '';
  const role = localStorage.getItem('tryit_role') || '';

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [s, r, l, b] = await Promise.all([
      supabase.from('staff_scorecards').select('*'),
      supabase.from('daily_runbook').select('*').eq('date', today).order('due_time'),
      supabase.from('team_leave_calendar').select('*'),
      supabase.from('staff_badges').select('*').order('earned_at', { ascending: false }).limit(10),
    ]);
    if (s.data) setScorecards(s.data);
    if (r.data) setRunbook(r.data);
    if (l.data) setLeaves(l.data);
    if (b.data) setBadges(b.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const completeTask = async (id: string) => {
    await supabase.from('daily_runbook').update({ status: 'completed', completed_by: user, completed_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const myTasks = runbook.filter(r => role === 'super_admin' || r.assigned_role === role || r.assigned_to_email === user);
  const pendingTasks = myTasks.filter(r => r.status === 'pending');
  const completedTasks = myTasks.filter(r => r.status === 'completed');
  const onLeaveToday = leaves.filter(l => l.status === 'approved');

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-green-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Users className="text-green-500" size={32}/> Team Hub</h1>
          <p className="text-gray-500">Today's runbook, team performance, and leave status.</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', value: scorecards.filter(s => s.is_active).length, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending Tasks', value: pendingTasks.length, color: pendingTasks.length > 0 ? 'text-yellow-500' : 'text-green-500', bg: pendingTasks.length > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10' },
          { label: 'On Leave Today', value: onLeaveToday.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Badges Earned', value: badges.length, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-center">
            <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Today's Runbook</h2>
          <div className="space-y-2">
            {myTasks.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center">
                <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2"/>
                <p className="text-gray-500 text-sm">No tasks assigned for today</p>
              </div>
            ) : myTasks.map(task => (
              <div key={task.id} className={`bg-[var(--card-bg)] border rounded-2xl p-4 flex items-start justify-between gap-3 ${task.status === 'completed' ? 'opacity-60 border-[var(--card-border)]' : 'border-blue-500/20'}`}>
                <div className="flex items-start gap-3">
                  {task.status === 'completed'
                    ? <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0"/>
                    : <Clock size={18} className="text-blue-500 mt-0.5 shrink-0"/>}
                  <div>
                    <p className={`font-bold text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.task_name}</p>
                    <p className="text-xs text-gray-500">Due by {task.due_time} · {task.assigned_role.replace('_', ' ')}</p>
                    {task.status === 'pending' && task.consequence_if_missed && (
                      <p className="text-xs text-orange-400 mt-1">⚠️ {task.consequence_if_missed}</p>
                    )}
                  </div>
                </div>
                {task.status === 'pending' && (
                  <button onClick={() => completeTask(task.id)}
                    className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold shrink-0">
                    Done
                  </button>
                )}
              </div>
            ))}
            {myTasks.length > 0 && (
              <div className="text-xs text-gray-500 text-right">
                {completedTasks.length}/{myTasks.length} completed today
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-purple-500"/> Team Leaderboard</h2>
            <div className="space-y-2">
              {scorecards.filter(s => s.is_active).sort((a, b) => b.tickets_this_week - a.tickets_this_week).slice(0, 5).map((s, idx) => (
                <div key={s.user_email} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  '}`}>
                      {idx < 3 ? ['🥇','🥈','🥉'][idx] : `#${idx+1}`}
                    </span>
                    <div>
                      <p className="font-bold text-sm">{s.user_email.split('@')[0]}</p>
                      <p className="text-xs text-gray-500 capitalize">{s.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-500">{s.tickets_this_week}</p>
                    <p className="text-[10px] text-gray-500">this week</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {onLeaveToday.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-500"/> On Leave Today</h2>
              {onLeaveToday.map(l => (
                <div key={l.user_email} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{l.user_email.split('@')[0]}</p>
                    <p className="text-xs text-gray-500">{l.role.replace('_', ' ')} · {l.leave_type}</p>
                  </div>
                  {l.substitute_email && (
                    <span className="text-xs text-blue-500">Cover: {l.substitute_email.split('@')[0]}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Award size={18} className="text-yellow-500"/> Recent Badges</h2>
            <div className="space-y-2">
              {badges.length === 0
                ? <p className="text-gray-500 text-sm">No badges earned yet</p>
                : badges.slice(0, 4).map(b => (
                  <div key={b.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">{b.badge_icon}</span>
                    <div>
                      <p className="font-bold text-sm">{b.badge_name}</p>
                      <p className="text-xs text-gray-500">{b.user_email.split('@')[0]} · {new Date(b.earned_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}