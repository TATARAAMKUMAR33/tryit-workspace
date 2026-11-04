'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart2, RefreshCw, TrendingUp, TrendingDown, Award, Target } from 'lucide-react';

export default function StaffKPI() {
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [wellbeing, setWellbeing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scorecards');

  const fetchData = async () => {
    setLoading(true);
    const [s, b, w] = await Promise.all([
      supabase.from('staff_scorecards').select('*'),
      supabase.from('staff_badges').select('*').order('earned_at', { ascending: false }).limit(50),
      supabase.from('staff_wellbeing').select('*').order('submitted_at', { ascending: false }).limit(30),
    ]);
    if (s.data) setScorecards(s.data);
    if (b.data) setBadges(b.data);
    if (w.data) setWellbeing(w.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getBadgesForUser = (email: string) => badges.filter(b => b.user_email === email);
  const getWellbeingForUser = (email: string) => wellbeing.filter(w => w.user_email === email);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-cyan-500" size={40}/></div>;

  const activeStaff = scorecards.filter(s => s.is_active);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><BarChart2 className="text-cyan-600" size={32}/> Staff KPI Dashboard</h1>
          <p className="text-gray-500">{activeStaff.length} active staff members being tracked</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'scorecards', label: 'Scorecards' },
          { id: 'badges', label: 'Badges' },
          { id: 'wellbeing', label: 'Wellbeing' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-cyan-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scorecards' && (
        <div className="space-y-3">
          {activeStaff.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
              <Target size={40} className="text-gray-300 mx-auto mb-3"/>
              <p className="font-bold">No scorecard data yet</p>
              <p className="text-gray-500 text-sm">Data populates as staff resolve tickets and complete tasks</p>
            </div>
          ) : activeStaff.sort((a, b) => b.tickets_this_week - a.tickets_this_week).map((staff, idx) => (
            <div key={staff.user_email} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                    idx === 0 ? 'bg-yellow-500 text-black' :
                    idx === 1 ? 'bg-gray-400 text-black' :
                    idx === 2 ? 'bg-amber-600 text-white' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {idx < 3 ? ['🥇','🥈','🥉'][idx] : idx + 1}
                  </div>
                  <div>
                    <p className="font-bold">{staff.user_email.split('@')[0]}</p>
                    <p className="text-xs text-gray-500 capitalize">{staff.role.replace('_', ' ')}</p>
                  </div>
                  <div className="flex gap-1">
                    {getBadgesForUser(staff.user_email).slice(0, 3).map(b => (
                      <span key={b.id} title={b.badge_name} className="text-lg">{b.badge_icon}</span>
                    ))}
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${staff.rank_in_team === 1 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-gray-500/10 text-gray-500'}`}>
                  Rank #{staff.rank_in_team} in team
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Today', value: staff.tickets_today, icon: TrendingUp, color: 'text-green-500' },
                  { label: 'This Week', value: staff.tickets_this_week, icon: BarChart2, color: 'text-blue-500' },
                  { label: 'SLA Breaches', value: staff.sla_breaches, icon: TrendingDown, color: staff.sla_breaches === 0 ? 'text-green-500' : 'text-red-500' },
                  { label: 'Team Rank', value: `#${staff.rank_in_team}`, icon: Award, color: staff.rank_in_team === 1 ? 'text-yellow-500' : 'text-blue-500' },
                ].map(metric => (
                  <div key={metric.label} className="bg-[var(--background)] rounded-xl p-3 text-center">
                    <metric.icon size={16} className={`${metric.color} mx-auto mb-1`}/>
                    <div className={`text-xl font-black ${metric.color}`}>{metric.value}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{metric.label}</div>
                  </div>
                ))}
              </div>

              {getWellbeingForUser(staff.user_email)[0] && (
                <div className="mt-3 flex items-center gap-3 bg-[var(--background)] rounded-xl p-3">
                  <span className="text-xs text-gray-500">Wellbeing this week:</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-4 h-4 rounded-full ${n <= (getWellbeingForUser(staff.user_email)[0]?.mood_score || 0) ? 'bg-green-500' : 'bg-gray-200'}`}/>
                    ))}
                  </div>
                  {getWellbeingForUser(staff.user_email)[0]?.win && (
                    <span className="text-xs text-gray-500 italic">"{getWellbeingForUser(staff.user_email)[0].win}"</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Award size={18} className="text-yellow-500"/> Recently Earned Badges</h2>
          {badges.length === 0 ? (
            <p className="text-gray-500 text-sm">No badges earned yet. Badges auto-award as staff hit milestones.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {badges.map(badge => (
                <div key={badge.id} className="flex items-center gap-4 bg-[var(--background)] rounded-xl p-4">
                  <span className="text-3xl">{badge.badge_icon}</span>
                  <div>
                    <p className="font-bold">{badge.badge_name}</p>
                    <p className="text-xs text-gray-500">{badge.user_email.split('@')[0]} · {badge.badge_description}</p>
                    <p className="text-xs text-gray-400">{new Date(badge.earned_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wellbeing' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">Weekly Wellbeing Check-ins</h2>
          {wellbeing.length === 0 ? (
            <p className="text-gray-500 text-sm">No wellbeing submissions yet. Staff submit via their profile page.</p>
          ) : wellbeing.map(w => (
            <div key={w.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl mb-2">
              <div>
                <p className="font-bold text-sm">{w.user_email.split('@')[0]}</p>
                <p className="text-xs text-gray-500">Week of {w.week_of}</p>
                {w.win && <p className="text-xs text-green-500 mt-1">Win: "{w.win}"</p>}
                {w.blocker && <p className="text-xs text-red-400 mt-1">Blocker: "{w.blocker}"</p>}
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-lg font-black text-blue-500">{w.mood_score}/5</div>
                  <div className="text-[10px] text-gray-500">Mood</div>
                </div>
                <div>
                  <div className="text-lg font-black text-purple-500">{w.workload_feeling}/5</div>
                  <div className="text-[10px] text-gray-500">Workload</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}