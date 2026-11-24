import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar, Clock, ArrowRight, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import usePageMeta from '../../hooks/usePageMeta';

export default function Blog() {
  usePageMeta({
    title: 'Blog – Exam Tips, Study Strategies & Updates',
    description: 'Read expert articles on exam preparation strategies, current affairs, study tips, and updates for SSC, UPSC, Banking, Railway, and State PCS exams on Abhyo Blog.',
    canonical: '/blog',
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/cms/blog');
        setPosts(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div className="min-h-screen pt-32 flex justify-center"><Loader className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Abhyo <span className="text-indigo-600">Blog</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Insights, strategies, and updates to help you navigate your exam preparation journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link to={`/blog/${post.slug}`} key={post.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="h-48 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <BookOpen className="w-12 h-12 text-slate-300" />
                )}
                {post.category && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {post.category}
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.readTime && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors">
            Load More Articles
          </button>
        </div>
      </div>
    </div>
  );
}
