'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Play, BookOpen, Clock, Trophy, Megaphone, AlertTriangle, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data) setAnnouncements(data);
    }
    fetchAnnouncements();
  }, []);

  const startExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    localStorage.setItem('student_email', email);
    router.push('/student/exam');
  };

  const getAlertStyle = (type: string) => {
    if (type === 'warning') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    if (type === 'success') return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      
      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <div className="max-w-4xl w-full mb-8 space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className={`p-4 rounded-2xl border flex items-start gap-4 shadow-sm ${getAlertStyle(ann.type)}`}>
              <div className="mt-0.5">
                {ann.type === 'warning' ? <AlertTriangle size={20} /> : 
                 ann.type === 'success' ? <CheckCircle size={20} /> : <Megaphone size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-sm">{ann.title}</h4>
                <p className="text-sm opacity-90">{ann.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">TryIT Student Portal</h1>
          <p className="text-gray-500">Your journey to the top starts here.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Exam Entry Card */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy size={100} className="text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                <BookOpen size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">All India Mock Test</h2>
              <p className="text-gray-500 mb-6 flex items-center gap-2 text-sm"><Clock size={16}/> 50 Minutes • 5 Questions • Level 7+</p>
              
              <form onSubmit={startExam} className="space-y-3">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to start" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                  <Play size={18} fill="currentColor" /> Start Exam
                </button>
              </form>
            </div>
          </div>

          {/* Doubt Engine Link */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col justify-center items-center text-center group cursor-pointer hover:shadow-2xl transition-all" onClick={() => router.push('/doubts')}>
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
              <Megaphone size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Need Help?</h2>
            <p className="text-gray-500 mb-6">Ask doubts and get answers from top mentors instantly.</p>
            <button className="bg-purple-100 text-purple-700 font-bold py-3 px-8 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              Go to Doubt Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
