'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';

export default function EscalationAlerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkEscalations = async () => {
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000).toISOString();

    // 1. Check for URGENT/OPEN tickets that are older than 15 minutes
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'open')
      .in('priority', ['urgent', 'high'])
      .lt('created_at', fifteenMinsAgo);

    const newAlerts: any[] = [];

    if (tickets && tickets.length > 0) {
      tickets.forEach(t => {
        newAlerts.push({
          id: t.id,
          type: 'ticket',
          title: 'SLA Breach: Ticket Unresolved',
          message: `${t.priority.toUpperCase()}: ${t.issue_type} (${t.student_email})`,
          url: '/dashboard/tickets'
        });
      });
    }

    // 2. Check for critical system errors in the last 15 mins
    const { data: errors } = await supabase
      .from('error_logs')
      .select('*')
      .gte('created_at', fifteenMinsAgo);

    if (errors && errors.length > 2) { // If more than 2 errors recently
      newAlerts.push({
        id: 'sys-error',
        type: 'system',
        title: 'System Alert: Recurring Errors',
        message: `${errors.length} errors detected in the last 15 minutes.`,
        url: '/dashboard/system'
      });
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    checkEscalations();
    // Poll every 30 seconds
    const interval = setInterval(checkEscalations, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full border transition-all ${alerts.length > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-gray-500 hover:text-[var(--foreground)]'}`}
      >
        <Bell size={18} />
        {alerts.length > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[var(--background)] rounded-full"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-up">
          <div className="p-4 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--card-bg)]">
            <h3 className="font-bold text-sm">Escalations ({alerts.length})</h3>
            {alerts.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ACTION NEEDED</span>}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <CheckCircle2 size={32} className="text-green-500 mb-2" />
                <p className="text-sm">All clear! No SLA breaches.</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div 
                  key={i} 
                  onClick={() => { router.push(alert.url); setIsOpen(false); }}
                  className="p-4 border-b border-[var(--card-border)] hover:bg-red-500/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 text-red-500 rounded-lg mt-0.5">
                      {alert.type === 'system' ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--foreground)] mb-1">{alert.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{alert.message}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
