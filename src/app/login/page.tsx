'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';

export default function LoginPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      setMessage('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Step 2: Get staff role
    const { data: roleData, error: roleError } = await supabase
      .from('staff_roles')
      .select('role, is_active')
      .eq('user_email', email)
      .single();

    if (roleError || !roleData) {
      setMessage('Access denied. You are not a registered staff member.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (!roleData.is_active) {
      setMessage('Your account has been deactivated. Contact Super Admin.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Step 3: Log the login event
    await supabase.from('audit_logs').insert([{
      user_email: email,
      action: 'STAFF_LOGIN',
      details: { role: roleData.role, timestamp: new Date().toISOString() }
    }]);

    // Step 4: Store session
    localStorage.setItem('tryit_user', email);
    localStorage.setItem('tryit_role', roleData.role);
    // Log login session
    await supabase.from('staff_sessions').insert([{
    user_email: email,
    event_type: 'login',
    timestamp: new Date().toISOString()
   }]);

    setMessage(`Access Granted! Welcome ${roleData.role.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => router.push('/dashboard'), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--background)]">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />

      <div className="max-w-md w-full bg-[var(--card-bg)] backdrop-blur-2xl rounded-[2rem] shadow-2xl p-10 border border-[var(--card-border)] relative z-10">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-4 rounded-[1.2rem] shadow-lg shadow-blue-500/30">
            <Zap size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-[var(--foreground)]">TryIT Hub</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Staff access only. All logins are monitored.</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="email"
              required
              placeholder="Staff email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-12 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm font-medium text-center ${
              message.includes('Granted')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : <>Access Workspace <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Not a staff member? Student login is at{' '}
          <a href="https://tryiteducations.com" className="text-blue-500 hover:underline">
            tryiteducations.com
          </a>
        </p>
      </div>
    </div>
  );
}
