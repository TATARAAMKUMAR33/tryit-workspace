'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, AlertTriangle, CheckCircle2, IndianRupee, 
  Ticket, ShieldAlert, Zap, Clock, BellRing
} from 'lucide-react';

type EventType = {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  created_at: string;
};

export default function LiveOpsFeed() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial history
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('system_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setEvents(data as EventType[]);
      setLoading(false);
    };
    fetchEvents();

    // 2. Subscribe to REAL-TIME inserts
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_events' },
        (payload) => {
          // Add new event to the top of the list instantly
          setEvents((prev) => [payload.new as EventType, ...prev]);
          
          // Optional: Play a subtle sound for critical events (commented out for browser policies)
          // if (payload.new.severity === 'critical') new Audio('/alert.mp3').play();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSeverityStyle = (severity: string, type: string) => {
    if (severity === 'critical') return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', icon: ShieldAlert };
    if (severity === 'warning') return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', icon: AlertTriangle };
    if (severity === 'success') return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', icon: CheckCircle2 };
    
    // Default by type
    if (type === 'billing') return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', icon: IndianRupee };
    if (type === 'crm') return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', icon: Ticket };
    return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-500', icon: Activity };
  };

  if (loading) return <div className="flex justify-center py-20"><Zap className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <BellRing className="text-blue-500" size={32} /> Live Operations Feed
          </h1>
          <p className="text-gray-500">Real-time event stream. Zero refresh required.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-xl text-sm font-bold border border-green-500/20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> LIVE
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-xl">
        <div className="relative border-l-2 border-gray-500/20 ml-4 space-y-8">
          {events.length === 0 ? (
            <p className="text-gray-500 italic pl-6">No events logged yet.</p>
          ) : (
            events.map((event, index) => {
              const style = getSeverityStyle(event.severity, event.event_type);
              return (
                <div key={event.id} className={`relative pl-8 ${index === 0 ? 'animate-fade-up' : ''}`}>
                  
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[17px] top-1 p-1.5 rounded-full border-4 border-[var(--background)] ${style.bg}`}>
                    <style.icon size={14} className={style.text} />
                  </div>
                  
                  {/* Event Card */}
                  <div className={`bg-[var(--background)] border p-5 rounded-2xl transition-all hover:shadow-md ${style.border}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className={`font-bold ${style.text} flex items-center gap-2`}>
                        {event.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                        <Clock size={12} /> {new Date(event.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-500/10 px-2 py-1 rounded-md">
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
