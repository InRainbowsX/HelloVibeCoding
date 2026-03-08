import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APPS } from '../data';
import { cn } from '../utils';

export const Directory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Productivity', 'Collaboration', 'Design', 'Marketing', 'Sales'];

  const filteredApps = APPS.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || app.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-serif italic">产品情报库</h1>
          <p className="text-brand-ink/50">探索全球顶尖 SaaS 的核心数据与增长策略</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-ink/30" />
            <input
              type="text"
              placeholder="搜索产品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-brand-line/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/5"
            />
          </div>
          <button className="p-2 bg-white border border-brand-line/10 rounded-xl hover:bg-brand-ink/5 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              category === cat 
                ? "bg-brand-ink text-brand-bg" 
                : "bg-white border border-brand-line/10 text-brand-ink/60 hover:border-brand-ink/30"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Data Grid */}
      <div className="bg-white border border-brand-line/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[60px_2fr_1fr_1fr_1fr] p-4 bg-brand-ink/5 border-b border-brand-line/10">
          <span className="col-header">Logo</span>
          <span className="col-header">产品名称</span>
          <span className="col-header">分类</span>
          <span className="col-header">ARR</span>
          <span className="col-header">成立时间</span>
        </div>
        
        <div className="divide-y divide-brand-line/5">
          {filteredApps.map((app) => (
            <Link key={app.id} to={`/intelligence/${app.id}`}>
              <motion.div 
                whileHover={{ backgroundColor: 'rgba(20, 20, 20, 0.02)' }}
                className="grid grid-cols-[60px_2fr_1fr_1fr_1fr] p-4 items-center transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-ink/5 flex items-center justify-center overflow-hidden">
                  <img src={app.logo} alt={app.name} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-brand-ink">{app.name}</span>
                  <span className="text-xs text-brand-ink/40 line-clamp-1">{app.tagline}</span>
                </div>
                <span className="text-sm text-brand-ink/60">{app.category}</span>
                <span className="data-value">{app.metrics.arr}</span>
                <span className="data-value">{app.metrics.founded}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
