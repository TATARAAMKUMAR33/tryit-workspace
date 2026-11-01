'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MessageSquare, Send, User, GraduationCap, 
  Clock, Award, Zap, Eye, ShieldAlert
} from 'lucide-react';

type DoubtType = {
  id: string;
  user_id: string;
  subject: string;
  question: string;
  is_resolved: boolean;
  views: number;
  created_at: string;
  doubt_answers: AnswerType[];
  staff_comments: StaffCommentType[];
};

type AnswerType = {
  id: string;
  mentor_email: string;
  answer_text: string;
  created_at: string;
};

type StaffCommentType = {
  id: string;
  staff_email: string;
  comment_text: string;
  created_at: string;
};

export default function DoubtEngine() {
  const [viewMode, setViewMode] = useState<'student' | 'mentor'>('student');
  const [doubts, setDoubts] = useState<DoubtType[]>([]);
  const [loading, setLoading] = useState(true);

  // Student Form State
  const [subject, setSubject] = useState('Physics');
  const [question, setQuestion] = useState('');
  const [studentEmail, setStudentEmail] = useState('rahul@gmail.com'); 

  // Mentor State
  const [activeDoubt, setActiveDoubt] = useState<DoubtType | null>(null);
  const [mentorEmail, setMentorEmail] = useState('mentor_raj@tryit.com');
  const [answerText, setAnswerText] = useState('');
  
  // Staff State
  const [staffComment, setStaffComment] = useState('');
  const [userRole, setUserRole] = useState('student');

  const fetchDoubts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('doubts')
      .select(`*, doubt_answers (*), staff_comments (*)`)
      .order('created_at', { ascending: false });
    
    if (data) setDoubts(data as any);
    setLoading(false);
  };

  useEffect(() => {
    setUserRole(localStorage.getItem('tryit_role') || 'student');
    fetchDoubts();
  }, []);

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const { error } = await supabase.from('doubts').insert([{
      user_id: studentEmail,
      subject: subject,
      question: question,
      is_resolved: false,
      is_public: true
    }]);

    if (!error) {
      setQuestion('');
      fetchDoubts();
    } else {
      alert("Error posting doubt: " + error.message);
    }
  };

  const handleAnswer = async (doubtId: string) => {
    if (!answerText.trim()) return;

    const currentDoubt = doubts.find(d => d.id === doubtId);
    if (currentDoubt && currentDoubt.doubt_answers.length >= 5) {
      alert("Payout slots filled! You can no longer answer this doubt.");
      return;
    }

    const { error } = await supabase.from('doubt_answers').insert([{
      doubt_id: doubtId,
      mentor_email: mentorEmail,
      answer_text: answerText
    }]);

    if (!error) {
      setAnswerText('');
      setActiveDoubt(null);
      fetchDoubts();
    }
  };

  const handleStaffComment = async (doubtId: string) => {
    if (!staffComment.trim()) return;
    const { error } = await supabase.from('staff_comments').insert([{
      doubt_id: doubtId,
      staff_email: 'tatu.ind@hotmail.com',
      comment_text: staffComment
    }]);
    if (!error) {
      setStaffComment('');
      fetchDoubts();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3 mb-4 md:mb-0">
            <MessageSquare className="text-blue-600" /> TryIT Doubt Engine
          </h1>
          
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button 
              onClick={() => setViewMode('student')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${viewMode === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <User size={16} /> Student View
            </button>
            <button 
              onClick={() => setViewMode('mentor')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${viewMode === 'mentor' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
            >
              <GraduationCap size={16} /> Mentor View
            </button>
          </div>
        </div>

        {/* STUDENT VIEW */}
        {viewMode === 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ask Form */}
            <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-200 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ask a Doubt</h2>
              <form onSubmit={handleAskDoubt} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subject</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 font-medium">
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Maths</option>
                    <option>Biology</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Your Question</label>
                  <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type your doubt here..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 h-32 focus:outline-none focus:border-blue-500 resize-none" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/30">
                  <Send size={18} /> Post Doubt
                </button>
              </form>
            </div>

            {/* Doubts Feed */}
            <div className="md:col-span-2 space-y-4">
              {doubts.map(doubt => (
                <div key={doubt.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {doubt.user_id[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{doubt.user_id.split('@')[0]}</p>
                        <p className="text-xs text-gray-500">{doubt.subject}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Eye size={12}/> {doubt.views || 0}</span>
                      <span className="flex items-center gap-1"><Clock size={12}/> {new Date(doubt.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-lg mb-4">{doubt.question}</p>
                  
                  {/* Staff Comments */}
                  {doubt.staff_comments && doubt.staff_comments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {doubt.staff_comments.map((comment: any) => (
                        <div key={comment.id} className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                          <ShieldAlert size={16} className="text-red-500 mt-1" />
                          <div>
                            <p className="text-xs font-bold text-red-700 mb-1">Official TryIT Staff</p>
                            <p className="text-sm text-gray-700">{comment.comment_text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Staff Admin Box to Add Comment */}
                  {userRole === 'super_admin' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Post an official staff comment..." 
                        value={staffComment}
                        onChange={(e) => setStaffComment(e.target.value)}
                        className="flex-1 bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-500"
                      />
                      <button 
                        onClick={() => handleStaffComment(doubt.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                      >
                        <Send size={14} /> Post
                      </button>
                    </div>
                  )}

                  {doubt.doubt_answers && doubt.doubt_answers.length > 0 ? (
                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Award size={14} className="text-purple-500"/> {doubt.doubt_answers.length} Mentor Answers</p>
                      {doubt.doubt_answers.map(ans => (
                        <div key={ans.id} className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                          <p className="text-xs font-bold text-purple-700 mb-1">{ans.mentor_email.split('@')[0]} replied:</p>
                          <p className="text-sm text-gray-700">{ans.answer_text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded-lg inline-block font-medium mt-4">Waiting for mentors to answer...</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENTOR VIEW */}
        {viewMode === 'mentor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><Zap className="text-yellow-500"/> Live Doubt Queue</h2>
              
              {doubts.filter(d => !d.doubt_answers || d.doubt_answers.length < 5).map(doubt => (
                <div 
                  key={doubt.id} 
                  onClick={() => setActiveDoubt(doubt)}
                  className={`bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all ${activeDoubt?.id === doubt.id ? 'border-purple-500 shadow-lg' : 'border-gray-200 hover:border-purple-300'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">{doubt.subject}</span>
                    <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Zap size={12}/> {5 - (doubt.doubt_answers?.length || 0)} Payout Slots Left
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 line-clamp-2">{doubt.question}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-200 sticky top-8 h-fit">
              {activeDoubt ? (
                <>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Answering Doubt</h3>
                  <p className="text-lg font-medium text-gray-800 mb-6 bg-gray-50 p-4 rounded-xl">{activeDoubt.question}</p>
                  
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Your Solution</label>
                  <textarea 
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="Provide a step-by-step solution..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 h-40 focus:outline-none focus:border-purple-500 resize-none mb-4"
                  />
                  <button 
                    onClick={() => handleAnswer(activeDoubt.id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform shadow-lg shadow-purple-500/30"
                  >
                    <Send size={18} /> Submit Answer
                  </button>
                </>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <GraduationCap size={48} className="mx-auto mb-4 text-gray-300"/>
                  <p className="font-medium">Select a doubt from the queue to start answering.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
