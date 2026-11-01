'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings, ShieldAlert, Power, BookOpen, MessageSquare, 
  Sparkles, RefreshCw, Save, AlertTriangle
} from 'lucide-react';

type SettingType = {
  id: string;
  key: string;
  value: boolean;
  description: string;
};

export default function GlobalSettings() {
  const [settings, setSettings] = useState<Record<string, SettingType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_settings').select('*');
    if (data) {
      const settingsMap: Record<string, SettingType> = {};
      data.forEach((s: any) => {
        settingsMap[s.key] = { ...s, value: s.value === true || s.value === 'true' };
      });
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleSetting = async (key: string, currentValue: boolean) => {
    // Optimistic update
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value: !currentValue }
    }));

    setSaving(true);
    await supabase.from('platform_settings').update({ 
      value: !currentValue,
      updated_at: new Date().toISOString()
    }).eq('key', key);
    setSaving(false);
  };

  const settingConfig = [
    { key: 'maintenance_mode', title: 'Global Maintenance Mode', icon: Power, color: 'text-red-500', bg: 'bg-red-500/10', desc: 'Blocks ALL students from accessing the platform immediately.' },
    { key: 'exam_engine_active', title: 'Exam Engine', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Allows students to take All India Mock Tests.' },
    { key: 'doubt_engine_active', title: 'Doubt Engine', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'Allows students to post doubts and mentors to answer.' },
    { key: 'bharat_pulse_active', title: 'Bharat Pulse Feed', icon: Sparkles, color: 'text-orange-500', bg: 'bg-orange-500/10', desc: 'Toggles the community social feed.' },
  ];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Settings className="text-blue-500" size={32} /> Platform Settings
          </h1>
          <p className="text-gray-500">Control platform-wide features and emergency kill-switches.</p>
        </div>
        {saving && <div className="text-sm font-bold text-green-500 flex items-center gap-2"><RefreshCw className="animate-spin" size={16}/> Saving...</div>}
      </div>

      {/* Warning Banner if Maintenance Mode is ON */}
      {settings['maintenance_mode']?.value && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 mt-0.5" size={24} />
          <div>
            <h3 className="font-bold text-red-500">Platform is in Maintenance Mode</h3>
            <p className="text-sm text-red-400">Students cannot access the platform right now. Turn this off to restore access.</p>
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-xl space-y-4">
        {settingConfig.map((config) => {
          const setting = settings[config.key];
          if (!setting) return null;
          
          return (
            <div key={config.key} className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${config.bg} ${config.color}`}>
                  <config.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--foreground)]">{config.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">{config.desc}</p>
                </div>
              </div>
              
              <button 
                onClick={() => toggleSetting(config.key, setting.value)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${setting.value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${setting.value ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
