'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, X, Briefcase, Calendar, CheckSquare, 
  Clock, PlayCircle, Eye, CheckCircle2, User
} from 'lucide-react';

type TaskType = {
  id: string;
  title: string;
  description: string;
  team: string;
  assigned_to: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
};

export default function TeamHub() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTeam, setNewTeam] = useState('QA');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newAssignee, setNewAssignee] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff_roles').select('user_email, role');
    if (data) setStaff(data);
  };

  useEffect(() => {
    fetchTasks();
    fetchStaff();
  }, [fetchTasks]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTask = {
      title: newTitle,
      description: newDesc,
      team: newTeam,
      priority: newPriority,
      assigned_to: newAssignee || null,
      status: 'todo'
    };
    
    const { error } = await supabase.from('tasks').insert([newTask]);
    if (!error) {
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      fetchTasks();
    } else {
      alert("Error creating task: " + error.message);
    }
  };

  const moveTask = async (id: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', icon: CheckSquare, color: 'text-slate-500' },
    { id: 'in_progress', title: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
    { id: 'review', title: 'In Review', icon: Eye, color: 'text-purple-500' },
    { id: 'done', title: 'Done', icon: CheckCircle2, color: 'text-green-500' },
  ];

  if (loading) return <div className="flex justify-center py-20 text-blue-500 font-medium animate-pulse">Loading Workspace...</div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 h-full flex flex-col opacity-0 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Briefcase className="text-purple-500" size={32} /> Team Workspace
          </h1>
          <p className="text-gray-500">Assign tasks and monitor team progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-purple-500/30"
        >
          <Plus size={18} /> New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-sm flex items-center gap-2 text-[var(--foreground)] uppercase tracking-wider">
                  <col.icon size={16} className={col.color} /> {col.title}
                </h3>
                <span className="bg-[var(--background)] text-gray-500 text-xs font-bold px-2 py-0.5 rounded-md border border-[var(--card-border)]">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-[var(--background)] p-4 rounded-2xl border border-[var(--card-border)] hover:border-purple-500/30 transition-all group shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-500/10 px-2 py-1 rounded-md">{task.team}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--foreground)] mb-1 leading-snug">{task.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--card-border)]">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate max-w-[100px]">
                        <User size={12} /> {task.assigned_to ? task.assigned_to.split('@')[0] : 'Unassigned'}
                      </div>
                      
                      {/* Simple Status Mover */}
                      <select 
                        value={task.status} 
                        onChange={(e) => moveTask(task.id, e.target.value as any)}
                        className="text-[10px] bg-transparent border border-[var(--card-border)] rounded p-1 outline-none cursor-pointer hover:border-purple-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-[var(--background)] border border-[var(--card-border)] p-8 rounded-3xl max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Plus className="text-purple-500"/> Create New Task</h2>
            
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Task Title</label>
                <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g., Review 50 Physics Questions" className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Add details..." className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 h-24 focus:outline-none focus:border-purple-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Team</label>
                  <select value={newTeam} onChange={e => setNewTeam(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-purple-500">
                    <option value="QA">QA Team</option>
                    <option value="Web Dev">Web Dev</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Priority</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-purple-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Assign To (Optional)</label>
                <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 focus:outline-none focus:border-purple-500">
                  <option value="">Unassigned</option>
                  {staff.map(s => (
                    <option key={s.user_email} value={s.user_email}>{s.user_email} ({s.role})</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl mt-4 transition-transform hover:scale-[1.02] shadow-lg shadow-purple-500/30">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
