import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Loader, User } from 'lucide-react';
import api from '../../lib/api';
import usePageMeta from '../../hooks/usePageMeta';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic meta from blog post data
  usePageMeta({
    title: post ? post.title : 'Blog – Abhyo',
    description: post ? (post.excerpt || post.title) : 'Expert exam preparation insights on Abhyo blog.',
    canonical: post ? `/blog/${post.slug}` : '/blog',
    image: post?.coverImage || undefined,
    type: 'article',
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/cms/blog/${slug}`);
        setPost(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) return <div className="min-h-screen pt-32 flex justify-center"><Loader className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-20 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Post not found</h1>
        <Link to="/blog" className="text-indigo-600 font-bold hover:underline">Return to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to all posts
        </Link>
        <div className="mb-10 text-center">
          {post.category && (
            <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-6">
              {post.category}
            </div>
          )}
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(post.createdAt).toLocaleDateString()}</span>
            {post.readTime && <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {post.readTime}</span>}
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> Editorial Team</span>
          </div>
        </div>

        {post.coverImage && (
          <div className="h-80 lg:h-[28rem] w-full rounded-[2rem] overflow-hidden mb-12 shadow-lg">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 lg:p-12 text-slate-700 font-medium leading-relaxed prose prose-indigo max-w-none prose-lg" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </div>
  );
}
