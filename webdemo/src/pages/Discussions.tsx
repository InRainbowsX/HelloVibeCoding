import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Heart, Share2, Search, Filter, PlusCircle } from 'lucide-react';
import { DISCUSSIONS } from '../data';
import { cn } from '../utils';

export const Discussions = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-serif italic">社区讨论</h1>
          <p className="text-brand-ink/50">与 10,000+ SaaS 创始人与设计师交流心得</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-ink text-brand-bg rounded-2xl font-bold hover:opacity-90 transition-opacity whitespace-nowrap">
          <PlusCircle className="h-5 w-5" /> 发起讨论
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ink/30" />
          <input
            type="text"
            placeholder="搜索话题..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-brand-line/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-ink/5"
          />
        </div>
        <button className="p-4 bg-white border border-brand-line/10 rounded-2xl hover:bg-brand-ink/5 transition-colors">
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        {DISCUSSIONS.map((discussion) => (
          <motion.div
            key={discussion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white border border-brand-line/5 rounded-3xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex gap-6">
              <div className="hidden sm:flex flex-col items-center gap-1 pt-1">
                <button className="p-2 hover:bg-brand-ink/5 rounded-xl transition-colors">
                  <Heart className="h-5 w-5 text-brand-ink/30 group-hover:text-red-500 transition-colors" />
                </button>
                <span className="text-xs font-bold text-brand-ink/40">{discussion.likes}</span>
              </div>
              
              <div className="flex-grow space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-brand-ink/5 rounded text-[10px] font-mono uppercase tracking-widest text-brand-ink/40">
                    {discussion.category}
                  </span>
                  <span className="text-[10px] text-brand-ink/30">•</span>
                  <span className="text-[10px] text-brand-ink/30">{discussion.timestamp}</span>
                </div>
                
                <h3 className="text-xl font-bold leading-tight group-hover:text-brand-ink transition-colors">
                  {discussion.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={discussion.avatar} alt={discussion.author} className="w-6 h-6 rounded-full" />
                    <span className="text-xs font-bold text-brand-ink/60">{discussion.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-brand-ink/30">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs font-bold">{discussion.replies}</span>
                    </div>
                    <button className="hover:text-brand-ink transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center pt-8">
        <button className="px-8 py-3 bg-brand-ink/5 text-brand-ink/60 rounded-2xl font-bold hover:bg-brand-ink/10 transition-colors">
          加载更多
        </button>
      </div>
    </div>
  );
};
