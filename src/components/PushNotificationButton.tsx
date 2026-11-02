'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, BellOff } from 'lucide-react';

export default function PushNotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already subscribed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported on this browser.');
      return;
    }

    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('You blocked notifications. Please allow them in settings.');
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // Save to Supabase
      const userEmail = localStorage.getItem('tryit_user') || 'admin@tryit.com';
      await supabase.from('push_subscriptions').upsert([{
        user_email: userEmail,
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
        auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!))))
      }], { onConflict: 'endpoint' });

      setIsSubscribed(true);
    } catch (err) {
      console.error('Failed to subscribe', err);
      alert('Failed to enable notifications.');
    }
    setLoading(false);
  };

  if (loading) return null;

  return (
    <button 
      onClick={subscribeUser}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
        isSubscribed 
          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
      }`}
    >
      {isSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
      {isSubscribed ? 'Notifications ON' : 'Enable Push Alerts'}
    </button>
  );
}
