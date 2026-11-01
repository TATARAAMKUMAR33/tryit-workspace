'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowRight, Zap } from 'lucide-react';

export default function LoginPortal() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.from('staff_roles').select('role').eq('user_email', email).single();

    if (error || !data) {
      setMessage('? Unauthorized email. Contact Super Admin.');
      setLoading(false);
    } else {
      setMessage(`? Access Granted! Role: ${data.role.toUpperCase()}`);
      localStorage.setItem('tryit_user', email);
      localStorage.setItem('tryit_role', data.role);
      setTimeout(() => router.push('/dashboard'), 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--background)]">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full bg-[var(--card-bg)] backdrop-blur-2xl rounded-[2rem] shadow-2xl p-10 border border-[var(--card-border)] relative z-10 transition-all duration-300">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-4 rounded-[1.2rem] shadow-lg shadow-blue-500/30">
            <Zap size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-center mb-2 tracking-tight text-[var(--foreground)]">TryIT Team Hub</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Enter your staff credentials to access God Mode</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tatu.ind@hotmail.com"
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl py-3 pl-12 pr-4 text-[var(--foreground)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Workspace'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-sm text-center font-medium ${message.includes('?') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
