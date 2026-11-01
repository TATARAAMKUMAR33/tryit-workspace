import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@tryit.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushToAll(title, body) {
  const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*');
  
  if (error || !subscriptions) {
    console.error('Error fetching subscriptions:', error);
    return;
  }

  console.log(`Sending to ${subscriptions.length} devices...`);

  const payload = JSON.stringify({ title, body });

  const promises = subscriptions.map(sub => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    return webpush.sendNotification(pushSubscription, payload).catch(err => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription has expired or is no longer valid
        console.log(`Removing dead subscription: ${sub.id}`);
        return supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
      console.error('Error sending push:', err);
    });
  });

  await Promise.all(promises);
  console.log('✅ All push notifications sent!');
}

// Test it out!
sendPushToAll('TryIT Alert!', 'A new urgent ticket has been created.');
