'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Plus, RefreshCw, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function RunbookManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'templates'>('today');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ task_name: '', assigned_role: 'crm_agent', due_time: '09:00', consequence_if_missed: '', recurrence: 'daily' });
  const user = typeof window !== 'undefined' ? localStorage.getItem('tryit_user') || '' : '';
  const role = typeof window !== 'undefined' ? localStorage.getItem('tryit_role') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [t, tasks] = await Promise.all([
      supabase.from('runbook_templates').select('*').order('due_time'),
      supabase.from('daily_runbook').select('*').eq('date', today).order('due_time'),
    ]);
    if (t.data) setTemplates(t.data);
    if (tasks.data) setTodayTasks(tasks.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('runbook_templates').insert([{ ...form, created_by: user }]);
    setForm({ task_name: '', assigned_role: 'crm_agent', due_time: '09:00', consequence_if_missed: '', recurrence: 'daily' });
    setShowForm(false);
    fetchData();
  };

  const completeTask = async (id: string) => {
    await supabase.from('daily_runbook').update({ status: 'completed', completed_by: user, completed_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? It will no longer generate daily tasks.')) return;
    await supabase.from('runbook_templates').update({ is_active: false }).eq('id', id);
    fetchData();
  };

  const generateToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const inserts = templates.filter(t => t.is_active !== false).map(t => ({
      task_name: t.task_name,
      assigned_role: t.assigned_role,
      due_time: t.due_time,
      consequence_if_missed: t.consequence_if_missed,
      date: today,
      status: 'pending'
    }));
    if (inserts.length > 0) {
      await supabase.from('daily_runbook').upsert(inserts, { onConflict: 'task_name,date' });
    }
    fetchData();
  };

  const myTasks = role === 'super_admin' ? todayTasks : todayTasks.filter(t => t.assigned_role === role);
  const completedCount = myTasks.filter(t => t.status === 'completed').length;
  const ROLES = ['super_admin','qa_agent','crm_agent','hr','discipline_officer','finance','content_lead','mentor'];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><ClipboardList className="text-blue-500" size={32}/> Runbook</h1>
          <p className="text-gray-500">Daily task checklist for all roles. {completedCount}/{myTasks.length} done today.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={generateToday} className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-sm font-bold">
            Generate Today's Tasks
          </button>
          {(role === 'super_admin' || role === 'hr') && (
            <button onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
              <Plus size={18}/> Add Template
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'today' ? 'bg-blue-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
          Today ({myTasks.length})
        </button>
        <button onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'templates' ? 'bg-blue-500 text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-gray-500'}`}>
          Templates ({templates.length})
        </button>
      </div>

      {showForm && activeTab === 'templates' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <form onSubmit={addTemplate} className="grid grid-cols-2 gap-4">
            <input required placeholder="Task name *" value={form.task_name} onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
            <select value={form.assigned_role} onChange={e => setForm(p => ({ ...p, assigned_role: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
            </select>
            <input type="time" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            <input placeholder="Consequence if missed" value={form.consequence_if_missed} onChange={e => setForm(p => ({ ...p, consequence_if_missed: e.target.value }))}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl">Add Template</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'today' && (
        <div className="space-y-3">
          {myTasks.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3"/>
              <p className="font-bold">No tasks for today</p>
              <p className="text-gray-500 text-sm">Click "Generate Today's Tasks" to create from templates</p>
            </div>
          ) : myTasks.map(task => (
            <div key={task.id} className={`bg-[var(--card-bg)] border rounded-2xl p-5 flex items-start justify-between gap-4 ${task.status === 'completed' ? 'opacity-60 border-[var(--card-border)]' : 'border-blue-500/20'}`}>
              <div className="flex items-start gap-3">
                {task.status === 'completed'
                  ? <CheckCircle2 size={20} className="text-green-500 mt-0.5 shrink-0"/>
                  : <Clock size={20} className="text-blue-500 mt-0.5 shrink-0"/>}
                <div>
                  <p className={`font-bold ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.task_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Due by {task.due_time} · <span className="capitalize">{task.assigned_role?.replace('_', ' ')}</span>
                  </p>
                  {task.consequence_if_missed && task.status !== 'completed' && (
                    <p className="text-xs text-orange-400 mt-1">⚠️ {task.consequence_if_missed}</p>
                  )}
                  {task.completed_by && (
                    <p className="text-xs text-green-500 mt-1">✓ Completed by {task.completed_by.split('@')[0]}</p>
                  )}
                </div>
              </div>
              {task.status === 'pending' && (
                <button onClick={() => completeTask(task.id)}
                  className="px-4 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl text-sm font-bold shrink-0 transition-colors">
                  Mark Done
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
              <ClipboardList size={40} className="text-gray-300 mx-auto mb-3"/>
              <p className="font-bold">No templates yet</p>
              <p className="text-gray-500 text-sm">Add templates to auto-generate daily tasks</p>
            </div>
          ) : templates.map(t => (
            <div key={t.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-bold">{t.task_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.assigned_role?.replace(/_/g, ' ').toUpperCase()} · Due by {t.due_time} · {t.recurrence}
                </p>
                {t.consequence_if_missed && <p className="text-xs text-orange-400 mt-0.5">⚠️ {t.consequence_if_missed}</p>}
              </div>
              {(role === 'super_admin' || role === 'hr') && (
                <button onClick={() => deleteTemplate(t.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors">
                  <Trash2 size={16}/>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}