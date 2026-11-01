'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, User, Smartphone, Globe, Clock, 
  BookOpen, MessageSquare, Ticket, ShieldAlert, 
  CheckCircle2, XCircle, ChevronRight
} from 'lucide-react';

export default function Student360() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setLoading(true);
    setSearched(true);

    // Fetch all data in parallel
    const [telemetryRes, examsRes, doubtsRes, ticketsRes] = await Promise.all([
      supabase.from('user_telemetry').select('*').eq('user_email', searchEmail).maybeSingle(),
      supabase.from('exam_submissions').select('*').eq('student_email', searchEmail).order('submitted_at', { ascending: false }).limit(5),
      supabase.from('doubts').select('*').eq('user_id', searchEmail).order('created_at', { ascending: false }).limit(5),
      supabase.from('tickets').select('*').eq('student_email', searchEmail).order('created_at', { ascending: false }).limit(5)
    ]);

    setProfile(telemetryRes.data);
    setExams(examsRes.data || []);
    setDoubts(doubtsRes.data || []);
    setTickets(ticketsRes.data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      
      {/* Header & Search */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
          <User className="text-blue-500" size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Student 360 Profile</h1>
        <p className="text-gray-500 mb-8">Search any student's email to view their entire platform history.</p>
        
        <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
          <Search className="absolute left-4 top-4 text-gray-400" size={24} />
          <input 
            type="email" 
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter student email (e.g., rahul@gmail.com)"
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl py-4 pl-14 pr-32 text-lg shadow-xl focus:outline-none focus:border-blue-500 transition-all"
          />
          <button type="submit" className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Loading / Empty State */}
      {loading && <div className="text-center text-gray-500">Fetching 360 data...</div>}
      {searched && !loading && !profile && exams.length === 0 && doubts.length === 0 && tickets.length === 0 && (
        <div className="text-center text-red-500 bg-red-500/10 p-6 rounded-2xl">
          No records found for {searchEmail}.
        </div>
      )}

      {/* Results Layout */}
      {searched && !loading && (profile || exams.length > 0 || tickets.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Identity & Device */}
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4 border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
                <Globe size={18} className="text-blue-500" /> Live Device Info
              </h2>
              {profile ? (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email</span>
                    <span className="font-semibold">{profile.user_email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">IP Address</span>
                    <span className="font-mono bg-gray-500/10 px-2 py-1 rounded">{profile.ip_address}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Device</span>
                    <span className="font-semibold flex items-center gap-1"><Smartphone size={14}/> {profile.device_info}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Last Active</span>
                    <span className="font-semibold text-green-500">{new Date(profile.last_active).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Device telemetry offline or not found.</p>
              )}
            </div>

            {/* Support Tickets */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4 border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
                <Ticket size={18} className="text-yellow-500" /> Support Tickets
              </h2>
              {tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map(t => (
                    <div key={t.id} className="p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-sm">{t.issue_type}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${t.status === 'open' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No support tickets.</p>
              )}
            </div>
          </div>

          {/* Right Column: Academic History */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Exam Submissions */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4 border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
                <BookOpen size={18} className="text-purple-500" /> Recent Exams
              </h2>
              {exams.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-500 uppercase text-xs tracking-wider border-b border-[var(--card-border)]">
                        <th className="pb-3 font-semibold">Exam Name</th>
                        <th className="pb-3 font-semibold">Score</th>
                        <th className="pb-3 font-semibold">Accuracy</th>
                        <th className="pb-3 font-semibold text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {exams.map(e => (
                        <tr key={e.id}>
                          <td className="py-3 font-medium">{e.exam_name}</td>
                          <td className="py-3">{e.score} / {e.total_questions}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${(e.score/e.total_questions) > 0.7 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                              {Math.round((e.score/e.total_questions)*100)}%
                            </span>
                          </td>
                          <td className="py-3 text-right text-gray-500">{new Date(e.submitted_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No exams taken yet.</p>
              )}
            </div>

            {/* Doubt History */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4 border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
                <MessageSquare size={18} className="text-orange-500" /> Recent Doubts
              </h2>
              {doubts.length > 0 ? (
                <div className="space-y-3">
                  {doubts.map(d => (
                    <div key={d.id} className="p-4 bg-[var(--background)] rounded-xl border border-[var(--card-border)] flex justify-between items-center group cursor-pointer hover:border-orange-500/50 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-orange-500 mb-1">{d.subject}</p>
                        <p className="text-sm font-medium line-clamp-1">{d.question}</p>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No doubts asked yet.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
