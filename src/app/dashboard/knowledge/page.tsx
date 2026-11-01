'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Save, FileText, ChevronRight, Edit3, X } from 'lucide-react';

type ArticleType = {
  id: string;
  title: string;
  category: string;
  content: string;
  author_email: string;
  created_at: string;
};

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<ArticleType[]>([]);
  const [activeArticle, setActiveArticle] = useState<ArticleType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General SOP');
  const [content, setContent] = useState('');

  const fetchArticles = async () => {
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
    if (data) setArticles(data);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreateNew = () => {
    setActiveArticle(null);
    setTitle('');
    setCategory('General SOP');
    setContent('');
    setIsEditing(true);
  };

  const handleEdit = (article: ArticleType) => {
    setActiveArticle(article);
    setTitle(article.title);
    setCategory(article.category);
    setContent(article.content);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const userEmail = localStorage.getItem('tryit_user') || 'tatu.ind@hotmail.com';

    if (activeArticle) {
      // Update existing
      await supabase.from('knowledge_base').update({ title, category, content }).eq('id', activeArticle.id);
    } else {
      // Create new
      await supabase.from('knowledge_base').insert([{ title, category, content, author_email: userEmail }]);
    }
    
    setIsEditing(false);
    fetchArticles();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-2xl animate-fade-up">
      
      {/* Sidebar (Article List) */}
      <div className="w-80 bg-[var(--background)] border-r border-[var(--card-border)] flex flex-col">
        <div className="p-4 border-b border-[var(--card-border)] flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[var(--foreground)]">
            <BookOpen className="text-blue-500" size={20} /> Knowledge Base
          </h2>
          <button onClick={handleCreateNew} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            <Plus size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {articles.length === 0 ? (
            <p className="text-sm text-gray-500 italic p-4 text-center">No documents yet. Click + to create one.</p>
          ) : (
            articles.map(article => (
              <div 
                key={article.id} 
                onClick={() => { setActiveArticle(article); setIsEditing(false); }}
                className={`p-3 rounded-xl cursor-pointer transition-colors group ${
                  activeArticle?.id === article.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-[var(--card-bg)] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className={activeArticle?.id === article.id ? 'text-blue-500' : 'text-gray-500'} />
                  <p className={`text-sm font-bold line-clamp-1 ${activeArticle?.id === article.id ? 'text-blue-500' : 'text-[var(--foreground)]'}`}>{article.title}</p>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{article.category}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[var(--card-bg)]">
        {isEditing ? (
          /* EDITOR MODE */
          <form onSubmit={handleSave} className="flex flex-col h-full">
            <div className="p-6 border-b border-[var(--card-border)]">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title..."
                className="w-full bg-transparent text-3xl font-bold text-[var(--foreground)] focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[var(--background)] border border-[var(--card-border)] text-sm rounded-lg px-3 py-1 focus:outline-none">
                  <option>General SOP</option>
                  <option>QA Guidelines</option>
                  <option>HR Policies</option>
                  <option>Development</option>
                  <option>Moderation Rules</option>
                </select>
              </div>
            </div>
            
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing your SOP here..."
              className="flex-1 w-full bg-transparent p-6 text-[var(--foreground)] resize-none focus:outline-none leading-relaxed"
            />
            
            <div className="p-4 border-t border-[var(--card-border)] flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-500/10 rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2">
                <Save size={16} /> Save Document
              </button>
            </div>
          </form>
        ) : activeArticle ? (
          /* READING MODE */
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-[var(--card-border)] flex justify-between items-start">
              <div>
                <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-4 inline-block">
                  {activeArticle.category}
                </span>
                <h1 className="text-4xl font-bold text-[var(--foreground)]">{activeArticle.title}</h1>
                <p className="text-sm text-gray-500 mt-2">Written by {activeArticle.author_email.split('@')[0]} • {new Date(activeArticle.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleEdit(activeArticle)} className="p-2 border border-[var(--card-border)] hover:bg-gray-500/10 rounded-xl flex items-center gap-2 text-sm font-medium">
                <Edit3 size={16} /> Edit
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto whitespace-pre-wrap text-[var(--foreground)] leading-relaxed">
              {activeArticle.content}
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <BookOpen size={64} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">Select a document from the sidebar</p>
            <p className="text-sm">or create a new one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
