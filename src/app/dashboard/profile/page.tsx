'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Camera, Save, RefreshCw, Award, Clock, Calendar, Heart } from 'lucide-react';

export default function StaffProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [wellbeing, setWellbeing] = useState({ workload_feeling: 3, mood_score: 3, win: '', blocker: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingWellbeing, setSubmittingWellbeing] = useState(false);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = localStorage.getItem('tryit_user') || '';
  const role = localStorage.getItem('tryit_role') || '';

  const fetchData = async () => {
    setLoading(true);
    const [p, sc, b, bal] = await Promise.all([
      supabase.from('staff_roles').select('*').eq('user_email', user).single(),
      supabase.from('staff_scorecards').select('*').eq('user_email', user).single(),
      supabase.from('staff_badges').select('*').eq('user_email', user).order('earned_at', { ascending: false }),
      supabase.from('leave_balances').select('*').eq('user_email', user).single(),
    ]);
    if (p.data) setProfile(p.data);
    if (sc.data) setScorecard(sc.data);
    if (b.data) setBadges(b.data);
    if (bal.data) setBalance(bal.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('staff_roles').update({
      bio: profile.bio,
      phone: profile.phone,
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
    }).eq('user_email', user);
    setMessage('✅ Profile saved');
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${user.replace('@', '_')}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('staff_roles').update({ avatar_url: data.publicUrl }).eq('user_email', user);
      setProfile((p: any) => ({ ...p, avatar_url: data.publicUrl }));
      setMessage('✅ Photo updated');
    }
    setIsUploading(false);
  };

  const submitWellbeing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWellbeing(true);
    const weekOf = new Date();
    weekOf.setDate(weekOf.getDate() - weekOf.getDay());
    await supabase.from('staff_wellbeing').upsert([{
      user_email: user,
      week_of: weekOf.toISOString().split('T')[0],
      ...wellbeing
    }], { onConflict: 'user_email,week_of' });
    setMessage('✅ Wellbeing check-in submitted');
    setSubmittingWellbeing(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><User className="text-blue-500" size={32}/> My Profile</h1>
        <p className="text-gray-500">Your personal workspace — scores, badges, leave balance, and wellbeing.</p>
      </div>

      {message && (
        <div className="bg-green-500/10 text-green-600 border border-green-500/20 p-3 rounded-xl text-sm font-medium">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar + Stats */}
        <div className="space-y-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-black overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                  : user[0]?.toUpperCase()}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white"/>
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={uploadAvatar} className="hidden"/>
            <p className="text-xs text-gray-500 mb-3">{isUploading ? 'Uploading...' : 'Click photo to change'}</p>
            <h2 className="font-bold text-lg">{user.split('@')[0]}</h2>
            <p className="text-sm text-gray-500 capitalize">{role.replace('_', ' ')}</p>
            <p className="text-xs text-gray-400 mt-1">{user}</p>
          </div>

          {scorecard && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><Clock size={14} className="text-blue-500"/> My Performance</h3>
              <div className="space-y-2">
                {[
                  { label: 'Tickets Today', value: scorecard.tickets_today, color: 'text-blue-500' },
                  { label: 'This Week', value: scorecard.tickets_this_week, color: 'text-purple-500' },
                  { label: 'SLA Breaches', value: scorecard.sla_breaches, color: scorecard.sla_breaches === 0 ? 'text-green-500' : 'text-red-500' },
                  { label: 'Team Rank', value: `#${scorecard.rank_in_team}`, color: 'text-yellow-500' },
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{stat.label}</span>
                    <span className={`font-black ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {balance && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <h3 className="font-bold mb-3 text-sm flex items-center gap-2"><Calendar size={14} className="text-green-500"/> Leave Balance</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Casual', value: balance.casual_leave, color: 'text-blue-500' },
                  { label: 'Sick', value: balance.sick_leave, color: 'text-red-500' },
                  { label: 'Earned', value: balance.earned_leave, color: 'text-green-500' },
                  { label: 'Emergency', value: balance.emergency_leave, color: 'text-orange-500' },
                ].map(item => (
                  <div key={item.label} className="bg-[var(--background)] rounded-xl p-2 text-center">
                    <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
                    <div className="text-[10px] text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Edit + Wellbeing + Badges */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <h2 className="font-bold mb-4">Edit Profile</h2>
            {profile && (
              <form onSubmit={saveProfile} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Bio</label>
                  <textarea value={profile.bio || ''} onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell your team about yourself..."
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 resize-none h-20"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone</label>
                  <input value={profile.phone || ''} onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Emergency Contact Name</label>
                  <input value={profile.emergency_contact_name || ''} onChange={e => setProfile((p: any) => ({ ...p, emergency_contact_name: e.target.value }))}
                    placeholder="Parent / Spouse name"
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Emergency Contact Phone</label>
                  <input value={profile.emergency_contact_phone || ''} onChange={e => setProfile((p: any) => ({ ...p, emergency_contact_phone: e.target.value }))}
                    placeholder="+91 98765 00000"
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <div className="col-span-2">
                  <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={16}/> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Heart size={18} className="text-red-500"/> Weekly Wellbeing Check-in</h2>
            <form onSubmit={submitWellbeing} className="space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block">How is your workload this week? (1=Overwhelmed, 5=I can take more)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setWellbeing(p => ({ ...p, workload_feeling: n }))}
                      className={`flex-1 py-2 rounded-xl font-bold transition-all ${wellbeing.workload_feeling === n ? 'bg-blue-500 text-white' : 'bg-[var(--background)] border border-[var(--card-border)] text-gray-500'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold mb-2 block">How are you feeling overall? (1=Bad, 5=Great)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setWellbeing(p => ({ ...p, mood_score: n }))}
                      className={`flex-1 py-2 rounded-xl font-bold transition-all ${wellbeing.mood_score === n ? 'bg-green-500 text-white' : 'bg-[var(--background)] border border-[var(--card-border)] text-gray-500'}`}>
                      {['😰','😟','😐','😊','🤩'][n-1]}
                    </button>
                  ))}
                </div>
              </div>
              <input value={wellbeing.win} onChange={e => setWellbeing(p => ({ ...p, win: e.target.value }))}
                placeholder="One thing that went well this week..."
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"/>
              <input value={wellbeing.blocker} onChange={e => setWellbeing(p => ({ ...p, blocker: e.target.value }))}
                placeholder="One thing blocking you (optional)..."
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"/>
              <button type="submit" disabled={submittingWellbeing}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
                {submittingWellbeing ? 'Submitting...' : 'Submit Weekly Check-in'}
              </button>
            </form>
          </div>

          {badges.length > 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2"><Award size={18} className="text-yellow-500"/> My Badges</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {badges.map(badge => (
                  <div key={badge.id} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                    <span className="text-3xl">{badge.badge_icon}</span>
                    <p className="font-bold text-sm mt-1">{badge.badge_name}</p>
                    <p className="text-xs text-gray-500">{badge.badge_description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(badge.earned_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}