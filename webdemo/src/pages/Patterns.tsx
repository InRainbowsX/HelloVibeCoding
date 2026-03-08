import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Maximize2, Heart, MessageCircle } from 'lucide-react';
import { PATTERNS } from '../data';
import { cn } from '../utils';

export const Patterns = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Onboarding', 'Pricing', 'Navigation', 'Empty State', 'Dashboard', 'Settings'];

  const filteredPatterns = PATTERNS.filter(p => 
    selectedCategory === 'All' || p.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-serif italic">设计模式库</h1>
        <p className="text-brand-ink/50 max-w-2xl mx-auto">
          收集并解析全球顶尖 SaaS 产品的 UI/UX 最佳实践，为你的产品设计提供灵感。
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all",
              selectedCategory === cat 
                ? "bg-brand-ink text-brand-bg shadow-lg shadow-brand-ink/20" 
                : "bg-white border border-brand-line/10 text-brand-ink/60 hover:border-brand-ink/30"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry-like Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {filteredPatterns.map((pattern) => (
          <motion.div
            layout
            key={pattern.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="break-inside-avoid group relative bg-white border border-brand-line/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <div className="relative aspect-auto">
              <img
                src={pattern.imageUrl}
                alt={pattern.title}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-brand-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button className="p-3 bg-white rounded-full hover:scale-110 transition-transform">
                  <Maximize2 className="h-5 w-5" />
                </button>
                <button className="p-3 bg-white rounded-full hover:scale-110 transition-transform">
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-ink/40 bg-brand-ink/5 px-2 py-1 rounded">
                  {pattern.category}
                </span>
                <span className="text-xs font-bold text-brand-ink/60">{pattern.appName}</span>
              </div>
              <h3 className="text-lg font-bold leading-tight group-hover:text-brand-ink transition-colors">
                {pattern.title}
              </h3>
              <p className="text-sm text-brand-ink/50 line-clamp-2 leading-relaxed">
                {pattern.description}
              </p>
              <div className="pt-4 border-t border-brand-line/5 flex justify-between items-center text-brand-ink/30">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs">
                    <Heart className="h-3 w-3" /> 124
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <MessageCircle className="h-3 w-3" /> 12
                  </span>
                </div>
                <span className="text-[10px] font-mono">2024.05.20</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
