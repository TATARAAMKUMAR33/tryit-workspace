'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Timer, AlertTriangle, WifiOff, ChevronRight, ChevronLeft, 
  CheckCircle2, Trophy, Medal, RefreshCw
} from 'lucide-react';

export default function ExamRoom() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineTimer, setOfflineTimer] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Result & Leaderboard State
  const [result, setResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    async function loadExam() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('generated_by', 'tryit_v3_approved')
        .limit(5);
      
      if (data) setQuestions(data);
      const saved = localStorage.getItem('tryit_exam_cache');
      if (saved) setAnswers(JSON.parse(saved));
    }
    loadExam();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleAutoSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(timer);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOffline && offlineTimer > 0) {
      interval = setInterval(() => {
        setOfflineTimer((prev) => {
          if (prev <= 1) { handleAutoSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (!isOffline) {
      setOfflineTimer(120);
    }
    return () => clearInterval(interval);
  }, [isOffline, offlineTimer]);

  const handleSelectOption = (qId: string, index: number) => {
    const newAnswers = { ...answers, [qId]: index };
    setAnswers(newAnswers);
    localStorage.setItem('tryit_exam_cache', JSON.stringify(newAnswers));
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);

    const student_email = localStorage.getItem('student_email') || 'unknown@student.com';
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) score++;
    });

    const timeTaken = (50 * 60) - timeLeft;

    await supabase.from('exam_submissions').insert([{
      student_email,
      exam_name: 'All India Mock Test',
      score,
      total_questions: questions.length,
      time_taken_seconds: timeTaken
    }]);

    // Fetch Leaderboard (Top 5 scores for this exam)
    const { data: lb } = await supabase
      .from('exam_submissions')
      .select('student_email, score, time_taken_seconds')
      .eq('exam_name', 'All India Mock Test')
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(5);
    
    if (lb) setLeaderboard(lb);

    localStorage.removeItem('tryit_exam_cache');
    setResult({ score, total: questions.length });
    setIsSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RESULT SCREEN WITH LEADERBOARD ---
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-10">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-2xl w-full">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Exam Complete!</h2>
          <p className="text-gray-500 mb-8">Your responses have been securely saved.</p>
          
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 flex justify-center gap-10">
            <div>
              <p className="text-sm text-gray-500 mb-1">Score</p>
              <p className="text-4xl font-black text-blue-600">{result.score}/{result.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Accuracy</p>
              <p className="text-4xl font-black text-purple-600">{Math.round((result.score/result.total)*100)}%</p>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="text-left bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> All India Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-gray-700">{user.student_email.split('@')[0]}</span>
                  </div>
                  <div className="flex gap-4 text-sm font-bold">
                    <span className="text-blue-600">{user.score} pts</span>
                    <span className="text-gray-400">{formatTime(user.time_taken_seconds)}</span>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-sm text-gray-500">No other submissions yet.</p>}
            </div>
          </div>
          
          <button onClick={() => router.push('/student')} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500"><RefreshCw className="animate-spin mr-2"/> Loading Secure Exam...</div>;
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      {isOffline && (
        <div className="fixed inset-0 bg-red-600/95 z-50 flex flex-col items-center justify-center text-white backdrop-blur-md">
          <WifiOff size={80} className="mb-6 animate-pulse" />
          <h2 className="text-4xl font-black mb-4">INTERNET DISCONNECTED</h2>
          <p className="text-xl mb-8 max-w-md text-center">Your exam is paused. If connection is not restored, your exam will auto-submit.</p>
          <div className="bg-black/30 px-10 py-4 rounded-2xl">
            <p className="text-sm uppercase tracking-widest mb-1">Time Remaining</p>
            <p className="text-5xl font-mono">{formatTime(offlineTimer)}</p>
          </div>
        </div>
      )}

      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="font-bold text-xl text-gray-800">All India Mock Test</div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-bold ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <Timer size={20} /> {formatTime(timeLeft)}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg">Q {currentQ + 1}</span>
              <span className="text-sm text-gray-500 font-medium">Level {q.level} • {q.topic_id.replace(/_/g, ' ')}</span>
            </div>
            
            <h2 className="text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
              {q.question_en}
            </h2>

            <div className="space-y-3">
              {q.options_en.map((opt: string, i: number) => (
                <div 
                  key={i}
                  onClick={() => handleSelectOption(q.id, i)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    answers[q.id] === i 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-bold mr-3 text-gray-500">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-500"/> Palette</h3>
          <div className="grid grid-cols-4 gap-3 mb-8">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-10 w-10 rounded-xl font-bold text-sm transition-colors ${
                  currentQ === i ? 'bg-blue-600 text-white' : 
                  answers[questions[i].id] !== undefined ? 'bg-green-100 text-green-700' : 
                  'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-3">
            <button onClick={handleAutoSubmit} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2">
              {isSubmitting ? <RefreshCw className="animate-spin" size={18}/> : 'Submit & See Rank'}
            </button>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 p-4 flex justify-between items-center">
        <button onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))} disabled={currentQ === 0} className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50">
          <ChevronLeft size={20} /> Previous
        </button>
        <button onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))} disabled={currentQ === questions.length - 1} className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white bg-gray-900 hover:bg-black disabled:opacity-50">
          Next <ChevronRight size={20} />
        </button>
      </footer>
    </div>
  );
}
