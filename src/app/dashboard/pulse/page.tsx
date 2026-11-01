'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Image as ImageIcon, Heart, MessageCircle, RefreshCw, Sparkles, Flag } from 'lucide-react';

type PostType = {
  id: string;
  author_email: string;
  author_role: string;
  content: string;
  media_url: string | null;
  likes_count: number;
  report_count: number;
  created_at: string;
};

export default function BharatPulse() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const fetchPosts = async () => {
    const { data } = await supabase.from('bharat_pulse').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    const role = localStorage.getItem('tryit_role') || 'user';
    const email = localStorage.getItem('tryit_user') || 'tatu.ind@hotmail.com';
    setUserRole(role);
    setUserEmail(email);
    fetchPosts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    const { error } = await supabase.from('bharat_pulse').insert([{
      author_email: userEmail,
      author_role: userRole,
      content: newPost
    }]);

    if (!error) {
      setNewPost('');
      fetchPosts();
    } else {
      alert("Error posting: " + error.message);
    }
    setPosting(false);
  };

  const handleReport = async (postId: string, currentCount: number) => {
    await supabase.from('bharat_pulse').update({ report_count: (currentCount || 0) + 1 }).eq('id', postId);
    alert('Post reported to moderation team.');
    fetchPosts();
  };

  const getRoleColor = (role: string) => {
    if (role === 'super_admin') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (role === 'mentor') return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (role === 'institution') return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 opacity-0 animate-fade-up pb-20">
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Sparkles className="text-purple-500" size={32} /> Bharat Pulse
        </h1>
        <p className="text-gray-500">Share updates, launch news, and post inspiring stories.</p>
      </div>

      {/* Post Composer */}
      <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl p-6 shadow-xl sticky top-20 z-10">
        <form onSubmit={handlePost}>
          <textarea 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-transparent text-lg resize-none focus:outline-none mb-4 min-h-[80px]"
          />
          <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
            <div className="flex gap-2 text-blue-500">
              <button type="button" className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><ImageIcon size={20} /></button>
            </div>
            <button 
              type="submit" 
              disabled={posting || !newPost.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-transform disabled:opacity-50"
            >
              {posting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No posts yet. Be the first!</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)] rounded-3xl p-6 shadow-sm hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {post.author_email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--foreground)]">{post.author_email.split('@')[0]}</div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleColor(post.author_role)}`}>
                      {post.author_role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
              
              <p className="text-[var(--foreground)] leading-relaxed mb-4 whitespace-pre-wrap">
                {post.content}
              </p>
              
              <div className="flex items-center gap-6 pt-4 border-t border-[var(--card-border)] text-gray-500">
                <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                  <Heart size={18} /> {post.likes_count || 0}
                </button>
                <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                  <MessageCircle size={18} /> Reply
                </button>
                <button onClick={() => handleReport(post.id, post.report_count || 0)} className="flex items-center gap-2 hover:text-orange-500 transition-colors ml-auto">
                  <Flag size={16} /> {post.report_count > 0 ? post.report_count : 'Report'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
