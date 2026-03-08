import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Globe, Twitter, Github, Users, Calendar, TrendingUp, DollarSign, ArrowLeft, Info, ChevronRight, PlusCircle, Database, MessageSquare } from 'lucide-react';
import { APPS } from '../data';
import { cn } from '../utils';

export const Intelligence = () => {
  const { id } = useParams();
  const app = APPS.find(a => a.id === id);
  const [activeTab, setActiveTab] = useState('Overview');

  if (!app) return <div className="p-20 text-center">Product not found.</div>;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <div className="bg-white border-b border-brand-line/5 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Link to="/directory" className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink/40 hover:text-brand-ink transition-colors">
            <ArrowLeft className="h-4 w-4" /> 返回产品库
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-brand-ink/5 rounded-3xl flex items-center justify-center p-4 border border-brand-line/5 shadow-sm">
                <img src={app.logo} alt={app.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">{app.name}</h1>
                <p className="text-lg text-brand-ink/60 font-light">{app.tagline}</p>
                <div className="flex gap-4 pt-2">
                  <Globe className="h-5 w-5 text-brand-ink/30 hover:text-brand-ink cursor-pointer transition-colors" />
                  <Twitter className="h-5 w-5 text-brand-ink/30 hover:text-brand-ink cursor-pointer transition-colors" />
                  <Github className="h-5 w-5 text-brand-ink/30 hover:text-brand-ink cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-brand-ink text-brand-bg rounded-2xl font-bold hover:opacity-90 transition-opacity">
                关注动态
              </button>
              <button className="p-3 bg-brand-ink/5 rounded-2xl hover:bg-brand-ink/10 transition-colors">
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-brand-line/5 pt-4">
            {['Overview', 'Breakdown', 'Patterns', 'Tech Stack'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative",
                  activeTab === tab ? "text-brand-ink" : "text-brand-ink/40 hover:text-brand-ink/60"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-ink" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Metrics Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'ARR', value: app.metrics.arr, icon: DollarSign },
              { label: 'Founded', value: app.metrics.founded, icon: Calendar },
              { label: 'Team Size', value: app.metrics.team, icon: Users },
              { label: 'Valuation', value: app.metrics.valuation || 'N/A', icon: TrendingUp },
            ].map((stat, idx) => (
              <div key={idx} className="p-6 bg-white border border-brand-line/5 rounded-3xl space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-brand-ink/40">
                  <stat.icon className="h-4 w-4" />
                  <span className="text-[10px] font-mono uppercase tracking-widest">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </section>

          {/* Narrative Analysis */}
          <section className="bg-white border border-brand-line/5 rounded-3xl p-8 space-y-6 shadow-sm">
            <h2 className="text-2xl font-serif italic">深度拆解</h2>
            <div className="prose prose-brand max-w-none text-brand-ink/70 leading-relaxed">
              <p>{app.narrative}</p>
              <p className="mt-4">
                在产品设计的细节上，{app.name} 展现出了极高的审美与工程水准。特别是其对用户心智的精准把握，使得产品在极短的时间内就建立起了强大的品牌壁垒。
              </p>
            </div>
            <div className="pt-6 border-t border-brand-line/5 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-8 h-8 rounded-full border-2 border-white" />
                ))}
                <div className="w-8 h-8 rounded-full bg-brand-ink/5 flex items-center justify-center text-[10px] font-bold border-2 border-white">
                  +12
                </div>
              </div>
              <span className="text-xs text-brand-ink/40">12 位分析师参与了此拆解</span>
            </div>
          </section>

          {/* Screenshots */}
          {app.screenshots.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-serif italic">产品截图</h2>
              {app.screenshots.map((s) => (
                <div key={s.id} className="relative bg-white border border-brand-line/5 rounded-3xl overflow-hidden shadow-sm group">
                  <img src={s.url} alt={s.caption} className="w-full h-auto" referrerPolicy="no-referrer" />
                  {s.hotspots.map((h, idx) => (
                    <div
                      key={idx}
                      className="absolute w-8 h-8 -ml-4 -mt-4 bg-brand-ink text-brand-bg rounded-full flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-transform group/hotspot"
                      style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-brand-ink text-brand-bg rounded-2xl opacity-0 group-hover/hotspot:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">
                        <h4 className="font-bold text-sm mb-1">{h.title}</h4>
                        <p className="text-[10px] text-brand-bg/60 leading-tight">{h.description}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-brand-ink" />
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-brand-line/5 text-center text-sm font-medium">
                    {s.caption}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Tech Stack */}
          <section className="bg-white border border-brand-line/5 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold flex items-center gap-2">
              <Database className="h-4 w-4" /> 技术栈
            </h3>
            <div className="flex flex-wrap gap-2">
              {app.techStack.map(tech => (
                <span key={tech} className="px-3 py-1 bg-brand-ink/5 rounded-lg text-xs font-medium text-brand-ink/60">
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* Related Discussions */}
          <section className="bg-white border border-brand-line/5 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> 相关讨论
            </h3>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="group cursor-pointer space-y-1">
                  <h4 className="text-sm font-medium group-hover:text-brand-ink transition-colors line-clamp-2">
                    {i === 1 ? `如何评价 ${app.name} 的增长引擎？` : `${app.name} 的 UI 细节有哪些值得学习的地方？`}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-brand-ink/40">
                    <span>24 回复</span>
                    <span>•</span>
                    <span>2 小时前</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-xs font-bold text-brand-ink/60 hover:text-brand-ink transition-colors border-t border-brand-line/5 pt-4">
              查看全部讨论
            </button>
          </section>

          {/* Revenue Model */}
          <section className="bg-brand-ink text-brand-bg rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> 商业模式
            </h3>
            <div className="p-4 bg-white/10 rounded-2xl space-y-2">
              <div className="text-xs opacity-60 uppercase tracking-widest font-mono">Model</div>
              <div className="text-lg font-bold">{app.revenueModel}</div>
            </div>
            <p className="text-xs opacity-60 leading-relaxed">
              该产品主要通过订阅制获取收入，针对不同规模的企业提供差异化的功能包。
            </p>
            <button className="w-full py-3 bg-white text-brand-ink rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
              查看定价详情 <ChevronRight className="h-3 w-3" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
