'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Search, Edit2, Trash2, RefreshCw, Eye } from 'lucide-react';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' });
  const user = localStorage.getItem('tryit_user') || '';

  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
    if (data) setArticles(data);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const saveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()), author: user };
    if (editing) {
      await supabase.from('knowledge_base').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('knowledge_base').insert([payload]);
    }
    setForm({ title: '', content: '', category: 'general', tags: '' });
    setEditing(null);
    fetchArticles();
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await supabase.from('knowledge_base').delete().eq('id', id);
    fetchArticles();
  };

  const startEdit = (article: any) => {
    setEditing(article);
    setForm({ title: article.title, content: article.content, category: article.category || 'general', tags: Array.isArray(article.tags) ? article.tags.join(', ') : '' });
    setViewing(null);
  };

  const categories = ['all', ...new Set(articles.map(a => a.category || 'general').filter(Boolean))];
  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || (a.category || 'general') === category;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-yellow-500" size={40}/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><BookOpen className="text-yellow-600" size={32}/> Knowledge Base</h1>
          <p className="text-gray-500">{articles.length} articles · Internal SOPs and guides</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ title: '', content: '', category: 'general', tags: '' }); setViewing('new'); }}
          className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
          <Plus size={18}/> New Article
        </button>
      </div>

      {viewing === 'new' || editing ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="font-bold mb-4">{editing ? 'Edit Article' : 'New Article'}</h2>
          <form onSubmit={saveArticle} className="space-y-4">
            <input required placeholder="Article title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500"/>
            <div className="grid grid-cols-2 gap-4">
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                <option value="general">General</option>
                <option value="crm">CRM / Support</option>
                <option value="qa">QA Process</option>
                <option value="finance">Finance</option>
                <option value="hr">HR Policy</option>
                <option value="technical">Technical</option>
                <option value="security">Security</option>
              </select>
              <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500"/>
            </div>
            <textarea required placeholder="Article content (markdown supported) *" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={10} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 resize-none font-mono"/>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 rounded-xl">
                {editing ? 'Update Article' : 'Publish Article'}
              </button>
              <button type="button" onClick={() => { setEditing(null); setViewing(null); }}
                className="px-6 bg-gray-500/10 text-gray-500 font-bold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      ) : viewing && viewing !== 'new' ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{viewing.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{viewing.category} · {new Date(viewing.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(viewing)} className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg"><Edit2 size={16}/></button>
              <button onClick={() => setViewing(null)} className="p-2 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white rounded-lg">✕</button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[var(--foreground)]">{viewing.content}</div>
          {viewing.tags?.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {viewing.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-500"/>
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none capitalize">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
                <BookOpen size={40} className="text-gray-300 mx-auto mb-3"/>
                <p className="font-bold">No articles found</p>
              </div>
            ) : filtered.map(article => (
              <div key={article.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-yellow-500/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded capitalize">{article.category || 'general'}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewing(article)} className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg"><Eye size={14}/></button>
                    <button onClick={() => startEdit(article)} className="p-1.5 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white rounded-lg"><Edit2 size={14}/></button>
                    <button onClick={() => deleteArticle(article.id)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
                <h3 className="font-bold mb-2 cursor-pointer hover:text-yellow-600" onClick={() => setViewing(article)}>{article.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{article.content}</p>
                <div className="flex items-center gap-2 mt-3">
                  {Array.isArray(article.tags) && article.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] bg-gray-500/10 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-auto">{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}