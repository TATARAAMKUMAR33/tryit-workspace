'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [gPressed, setGPressed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    let gTimer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      // Show help with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(prev => !prev);
        return;
      }

      // Escape closes help
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      // G then letter navigation
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        setGPressed(true);
        gTimer = setTimeout(() => setGPressed(false), 1500);
        return;
      }

      if (gPressed) {
        const routes: Record<string, string> = {
          'd': '/dashboard',
          't': '/dashboard/tickets',
          'q': '/dashboard/qa',
          's': '/dashboard/students',
          'c': '/dashboard/chat',
          'h': '/dashboard/hr',
          'a': '/dashboard/analytics',
          'r': '/dashboard/risk',
          'k': '/dashboard/knowledge',
          'p': '/dashboard/profile',
          'f': '/dashboard/feed',
          'e': '/dashboard/expenses',
          'b': '/dashboard/billing',
          'n': '/dashboard/questions',
        };
        if (routes[e.key]) {
          router.push(routes[e.key]);
          setGPressed(false);
          clearTimeout(gTimer);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gPressed, router]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={() => setShowHelp(false)}>
      <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-4">⌨️ Keyboard Shortcuts</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['Ctrl + K', 'Global search'],
            ['?', 'Toggle this help'],
            ['G then D', 'Dashboard'],
            ['G then T', 'Tickets'],
            ['G then Q', 'QA Inspector'],
            ['G then S', 'Students'],
            ['G then C', 'Chat'],
            ['G then H', 'HR'],
            ['G then A', 'Analytics'],
            ['G then R', 'Risk Radar'],
            ['G then K', 'Knowledge Base'],
            ['G then P', 'My Profile'],
            ['G then F', 'Live Feed'],
            ['G then N', 'Question Bank'],
            ['Escape', 'Close dialogs'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-[var(--card-bg)]">
              <kbd className="text-xs font-mono bg-gray-100 border border-gray-200 rounded px-2 py-1 text-gray-700">{key}</kbd>
              <span className="text-xs text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">Press ? to close</p>
      </div>
    </div>
  );
}