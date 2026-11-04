'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Plus, Heart, Flag, RefreshCw, Trash2, Search } from 'lucide-react';

export default function BharatPulse() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = localStorage.getItem('tryit_user') || '';
  const role = localStorage.getItem('tryit_role') || '';

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from('bharat_pulse').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('bharat_pulse').insert([{ content, author_email: user, author_role: role }]);
    setContent(''); setShowForm(false); setSubmitting(false);
    fetchPosts();
  };

  const likePost = async (id: string, current: number) => {
    await supabase.from('bharat_pulse').update({ likes_count: current + 1 }).eq('id', id);
    fetchPosts();
  };

  const removePost = async (id: string) => {
    if (!confirm('Remove this post?')) return;
    await supabase.from('bharat_pulse').delete().eq('id', id);
    await supabase.from('audit_logs').insert([{ user_email: user, action: 'PULSE_POST_REMOVED', details: { post_id: id } }]);
    fetchPosts();
  };

  const filtered = posts.filter(p => !search || p.content?.toLowerCase().includes(search.toLowerCase()) || p.author_email?.includes(search));

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-fuchsia-500" size={40}/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Sparkles className="text-fuchsia-500" size={32}/> Bharat Pulse</h1>
          <p className="text-gray-500">Internal ops feed — announcements, updates, and team wins.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
          <Plus size={18}/> Post Update
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--card-bg)] border border-fuchsia-500/30 rounded-2xl p-6">
          <form onSubmit={createPost} className="space-y-4">
            <textarea required value={content} onChange={e => setContent(e.target.value)}
              placeholder="Share an update, announcement, or win with the team..."
              rows={4} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-fuchsia-500 resize-none"/>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting || !content.trim()}
                className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2.5 rounded-xl disabled:opacity-50">
                {submitting ? 'Posting...' : 'Post to Pulse'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
          className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-fuchsia-500"/>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <Sparkles size={40} className="text-gray-300 mx-auto mb-3"/>
            <p className="font-bold">No posts yet</p>
            <p className="text-gray-500 text-sm">Be the first to post an update</p>
          </div>
        ) : filtered.map(post => (
          <div key={post.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {post.author_email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm">{post.author_email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{post.author_role?.replace('_', ' ')} · {new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              {(role === 'super_admin' || post.author_email === user) && (
                <button onClick={() => removePost(post.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={16}/>
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed mb-4">{post.content}</p>
            <div className="flex items-center gap-4 pt-3 border-t border-[var(--card-border)]">
              <button onClick={() => likePost(post.id, post.likes_count || 0)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <Heart size={16}/> {post.likes_count || 0}
              </button>
              {post.report_count > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-orange-500">
                  <Flag size={14}/> {post.report_count} reports
                </span>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {new Date(post.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}