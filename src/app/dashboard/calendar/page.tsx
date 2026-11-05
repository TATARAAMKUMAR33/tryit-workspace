'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const EVENT_COLORS: Record<string, string> = {
  general: 'bg-blue-500',
  exam: 'bg-red-500',
  leave: 'bg-yellow-500',
  meeting: 'bg-purple-500',
  deadline: 'bg-orange-500',
  holiday: 'bg-green-500',
};

export default function ERPCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', event_time: '', event_type: 'general', assigned_to: '', assigned_team: '', color: '#3b82f6' });
  const user = localStorage.getItem('tryit_user') || '';
  const role = localStorage.getItem('tryit_role') || '';

  const fetchEvents = async () => {
    setLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data } = await supabase.from('erp_calendar').select('*').gte('event_date', startOfMonth).lte('event_date', endOfMonth).order('event_date');
    if (data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('erp_calendar').insert([{ ...form, created_by: user }]);
    setForm({ title: '', description: '', event_date: '', event_time: '', event_type: 'general', assigned_to: '', assigned_team: '', color: '#3b82f6' });
    setShowForm(false);
    fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('erp_calendar').delete().eq('id', id);
    fetchEvents();
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.event_date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  const monthName = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const upcomingEvents = events.filter(e => e.event_date >= new Date().toISOString().split('T')[0]).slice(0, 10);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Calendar className="text-blue-500" size={32}/> Team Calendar</h1>
          <p className="text-gray-500">Exams, leaves, meetings, and deadlines in one place.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
          <Plus size={18}/> Add Event
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <form onSubmit={createEvent} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input required placeholder="Event title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
            <select value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="general">General</option>
              <option value="exam">Exam Date</option>
              <option value="leave">Leave</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="holiday">Holiday</option>
            </select>
            <input required type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            <input type="time" value={form.event_time} onChange={e => setForm(p => ({ ...p, event_time: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            <input placeholder="Assign to (email or team)" value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
              className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            <input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl">Add Event</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">{monthName}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1.5 hover:bg-[var(--background)] rounded-lg"><ChevronLeft size={18}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs bg-blue-500/10 text-blue-500 rounded-lg font-bold">Today</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1.5 hover:bg-[var(--background)] rounded-lg"><ChevronRight size={18}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-16"/>;
              const dayEvents = getEventsForDay(day);
              return (
                <div key={day} className={`h-16 rounded-xl p-1 cursor-pointer hover:bg-[var(--background)] transition-colors ${isToday(day) ? 'bg-blue-500/10 border-2 border-blue-500' : ''}`}>
                  <div className={`text-xs font-bold mb-1 ${isToday(day) ? 'text-blue-500' : 'text-[var(--foreground)]'}`}>{day}</div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(evt => (
                      <div key={evt.id} className={`text-[9px] px-1 py-0.5 rounded text-white truncate ${EVENT_COLORS[evt.event_type] || 'bg-blue-500'}`}>
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[9px] text-gray-400">+{dayEvents.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Upcoming Events</h2>
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
                <p className="text-gray-500 text-sm">No upcoming events</p>
              </div>
            ) : upcomingEvents.map(evt => (
              <div key={evt.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 flex items-start justify-between group">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${EVENT_COLORS[evt.event_type] || 'bg-blue-500'}`}/>
                  <div>
                    <p className="font-bold text-sm">{evt.title}</p>
                    <p className="text-xs text-gray-500">{evt.event_date} {evt.event_time}</p>
                    {evt.description && <p className="text-xs text-gray-400">{evt.description}</p>}
                    {evt.assigned_to && <p className="text-xs text-blue-500">→ {evt.assigned_to}</p>}
                  </div>
                </div>
                {(role === 'super_admin' || evt.created_by === user) && (
                  <button onClick={() => deleteEvent(evt.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}