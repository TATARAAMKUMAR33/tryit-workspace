'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TelemetryTracker({ email, currentPage }: { email: string, currentPage: string }) {
  useEffect(() => {
    if (!email) return;

    const trackUser = async () => {
      // Get IP Address via a free, fast API
      let ip = 'Unknown';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        ip = data.ip;
      } catch (e) {}

      // Get Device Info
      const ua = navigator.userAgent;
      let device = 'Desktop';
      if (/android/i.test(ua)) device = 'Android Mobile';
      if (/iPad|iPhone|iPod/.test(ua)) device = 'iOS Mobile';

      // Send to Supabase (Upsert = insert or update if exists)
      await supabase.from('user_telemetry').upsert({
        user_email: email,
        ip_address: ip,
        device_info: device,
        current_page: currentPage,
        last_active: new Date().toISOString()
      }, { onConflict: 'user_email' });
    };

    trackUser();
    // Ping every 60 seconds to keep "last_active" fresh
    const interval = setInterval(trackUser, 60000);
    return () => clearInterval(interval);
  }, [email, currentPage]);

  return null; // This component is invisible
}
