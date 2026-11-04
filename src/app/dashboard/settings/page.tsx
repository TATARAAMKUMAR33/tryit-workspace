'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, RefreshCw, Shield, Bell, Database, Sliders } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [s, t, f] = await Promise.all([
      supabase.from('platform_settings').select('*').order('key'),
      supabase.from('system_thresholds').select('*').order('name'),
      supabase.from('system_features').select('*').order('name'),
    ]);
    if (s.data) setSettings(s.data);
    if (t.data) setThresholds(t.data);
    if (f.data) setFeatures(f.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateSetting = async (id: string, value: string) => {
    setSaving(id);
    await supabase.from('platform_settings').update({ value, updated_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('audit_logs').insert([{
      user_email: localStorage.getItem('tryit_user') || 'admin',
      action: 'SETTING_UPDATED',
      details: { setting_id: id, new_value: value }
    }]);
    setSaving(null);
    fetchData();
  };

  const updateThreshold = async (id: string, value: number) => {
    setSaving(id);
    await supabase.from('system_thresholds').update({ value }).eq('id', id);
    setSaving(null);
    fetchData();
  };

  const toggleFeature = async (id: string, current: boolean) => {
    setSaving(id);
    await supabase.from('system_features').update({ is_enabled: !current }).eq('id', id);
    await supabase.from('audit_logs').insert([{
      user_email: localStorage.getItem('tryit_user') || 'admin',
      action: current ? 'FEATURE_DISABLED' : 'FEATURE_ENABLED',
      details: { feature_id: id }
    }]);
    setSaving(null);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-gray-500" size={40}/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Settings className="text-gray-500" size={32}/> System Settings</h1>
        <p className="text-gray-500">All changes are logged in the audit trail. Super Admin only.</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Sliders size={18} className="text-blue-500"/> Fraud Detection Thresholds</h2>
        {thresholds.length === 0 ? (
          <p className="text-gray-500 text-sm">No thresholds configured. Add them via Supabase SQL Editor.</p>
        ) : thresholds.map(t => (
          <div key={t.id} className="flex items-center justify-between py-3 border-b border-[var(--card-border)] last:border-0">
            <div>
              <p className="font-bold text-sm">{t.name}</p>
              <p className="text-xs text-gray-500">{t.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="number" defaultValue={t.value}
                onBlur={e => updateThreshold(t.id, parseFloat(e.target.value))}
                className="w-24 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-1.5 text-sm text-center focus:outline-none focus:border-blue-500"/>
              {saving === t.id && <RefreshCw size={14} className="animate-spin text-blue-500"/>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-green-500"/> Feature Flags</h2>
        {features.length === 0 ? (
          <p className="text-gray-500 text-sm">No feature flags configured yet.</p>
        ) : features.map(f => (
          <div key={f.id} className="flex items-center justify-between py-3 border-b border-[var(--card-border)] last:border-0">
            <div>
              <p className="font-bold text-sm">{f.name}</p>
              <p className="text-xs text-gray-500">{f.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleFeature(f.id, f.is_enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${f.is_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${f.is_enabled ? 'left-7' : 'left-1'}`}/>
              </button>
              {saving === f.id && <RefreshCw size={14} className="animate-spin text-green-500"/>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Database size={18} className="text-purple-500"/> Platform Settings</h2>
        {settings.length === 0 ? (
          <p className="text-gray-500 text-sm">No platform settings configured yet.</p>
        ) : settings.map(s => (
          <div key={s.id} className="flex items-center justify-between py-3 border-b border-[var(--card-border)] last:border-0">
            <div>
              <p className="font-bold text-sm font-mono">{s.key}</p>
              <p className="text-xs text-gray-500">{s.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <input defaultValue={s.value}
                onBlur={e => updateSetting(s.id, e.target.value)}
                className="w-48 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"/>
              {saving === s.id && <Save size={14} className="text-purple-500"/>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}