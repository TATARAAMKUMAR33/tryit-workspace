'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Columns, Plus, CheckCircle2, Circle, Clock, RefreshCw, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export default function Sprints() {
  const [sprints, setSprints] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sprintName, setSprintName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSprint, setTaskSprint] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [s, t, st] = await Promise.all([
      supabase.from('sprints').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('staff_roles').select('user_email, role').eq('is_active', true)
    ]);
    if (s.data) { setSprints(s.data); if (s.data.length > 0 && !expandedSprint) setExpandedSprint(s.data[0].id); }
    if (t.data) setTasks(t.data);
    if (st.data) setStaff(st.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('sprints').insert([{ name: sprintName }]).select().single();
    setSprintName('');
    if (data) setExpandedSprint(data.id);
    fetchData();
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('tasks').insert([{
      title: taskTitle, sprint_id: taskSprint || null,
      assigned_to: taskAssignee || null, status: 'todo'
    }]);
    setTaskTitle(''); fetchData();
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    fetchData();
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    fetchData();
  };

  const columns = [
    { id: 'todo', label: 'To Do', color: 'text-gray-500', bg: 'bg-gray-500/10' },
    { id: 'in_progress', label: 'In Progress', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'review', label: 'Review', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'done', label: 'Done', color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'done') return <CheckCircle2 size={14} className="text-green-500"/>;
    if (status === 'in_progress') return <Clock size={14} className="text-blue-500"/>;
    return <Circle size={14} className="text-gray-400"/>;
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-500" size={40}/></div>;

  const unassignedTasks = tasks.filter(t => !t.sprint_id);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Columns className="text-indigo-500" size={32}/> Sprint Planning</h1>
          <p className="text-gray-500">{sprints.length} sprints · {tasks.filter(t=>t.status!=='done').length} open tasks</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-gray-500">
          <RefreshCw size={20}/>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={createSprint} className="flex gap-2">
          <input required value={sprintName} onChange={e => setSprintName(e.target.value)} placeholder="New sprint name..."
            className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"/>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl flex items-center gap-1">
            <Plus size={18}/>
          </button>
        </form>

        <form onSubmit={createTask} className="lg:col-span-2 flex gap-2">
          <input required value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="New task title..."
            className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"/>
          <select value={taskSprint} onChange={e => setTaskSprint(e.target.value)}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">No Sprint</option>
            {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">Unassigned</option>
            {staff.map(s => <option key={s.user_email} value={s.user_email}>{s.user_email.split('@')[0]}</option>)}
          </select>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl">
            <Plus size={18}/>
          </button>
        </form>
      </div>

      {sprints.map(sprint => {
        const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
        const doneCount = sprintTasks.filter(t => t.status === 'done').length;
        const progress = sprintTasks.length > 0 ? Math.round((doneCount / sprintTasks.length) * 100) : 0;
        const isExpanded = expandedSprint === sprint.id;

        return (
          <div key={sprint.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--background)]"
              onClick={() => setExpandedSprint(isExpanded ? null : sprint.id)}>
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg">{sprint.name}</h3>
                <span className="text-xs text-gray-500">{sprintTasks.length} tasks</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}/>
                  </div>
                  <span className="text-xs font-bold text-indigo-500">{progress}%</span>
                </div>
              </div>
              {isExpanded ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
            </div>

            {isExpanded && (
              <div className="grid grid-cols-4 gap-3 p-4 border-t border-[var(--card-border)]">
                {columns.map(col => {
                  const colTasks = sprintTasks.filter(t => t.status === col.id);
                  return (
                    <div key={col.id} className="space-y-2">
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${col.bg}`}>
                        <span className={`text-xs font-bold ${col.color}`}>{col.label}</span>
                        <span className={`text-xs font-bold ${col.color}`}>{colTasks.length}</span>
                      </div>
                      {colTasks.map(task => (
                        <div key={task.id} className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 group">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(task.status)}
                            <p className="text-xs font-medium flex-1">{task.title}</p>
                          </div>
                          {task.assigned_to && (
                            <p className="text-[10px] text-gray-400 mt-1 ml-5">{task.assigned_to.split('@')[0]}</p>
                          )}
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {col.id !== 'todo' && (
                              <button onClick={() => moveTask(task.id, columns[columns.findIndex(c=>c.id===col.id)-1].id)}
                                className="text-[10px] px-2 py-1 bg-gray-500/10 rounded hover:bg-gray-500/20">←</button>
                            )}
                            {col.id !== 'done' && (
                              <button onClick={() => moveTask(task.id, columns[columns.findIndex(c=>c.id===col.id)+1].id)}
                                className="text-[10px] px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded hover:bg-indigo-500/20">→</button>
                            )}
                            <button onClick={() => deleteTask(task.id)}
                              className="text-[10px] px-2 py-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 ml-auto">
                              <Trash2 size={10}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {unassignedTasks.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
          <h3 className="font-bold mb-3 text-gray-500">Backlog (Unassigned to Sprint) — {unassignedTasks.length}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {unassignedTasks.map(task => (
              <div key={task.id} className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  <p className="text-xs font-medium">{task.title}</p>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}