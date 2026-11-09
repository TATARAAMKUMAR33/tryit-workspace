'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EscalationAlerts() {
  const [count, setCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('tryit_user') || '';
    const role = localStorage.getItem('tryit_role') || '';
    if (!user) return;

    const fetchCount = async () => {
      const now = new Date().toISOString();
      const { count: c } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
        .lt('sla_deadline', now);
      setCount(c || 0);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <button onClick={() => router.push('/dashboard/tickets')}
      className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1.5 rounded-xl text-xs font-black animate-pulse hover:bg-red-500 hover:text-white transition-colors">
      <AlertTriangle size={14}/>
      {count} SLA breach{count > 1 ? 'es' : ''}
    </button>
  );
}