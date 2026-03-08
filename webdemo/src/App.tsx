/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Menu, X, ArrowRight, Github, Twitter, Layout, MessageSquare, PlusCircle, Layers } from 'lucide-react';
import { cn } from './utils';

// Pages (will be implemented in separate files or as components here for now)
const Home = () => (
  <div className="space-y-16 py-12">
    {/* Hero Section */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-tight">
          做出更好的 <span className="not-italic font-sans font-bold">SaaS</span> 决策
        </h1>
        <p className="text-xl text-brand-ink/60 max-w-2xl mx-auto font-light">
          深度解析全球顶尖 SaaS 产品的设计模式、业务策略与增长逻辑。
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-brand-ink/40 group-focus-within:text-brand-ink transition-colors" />
        </div>
        <input
          type="text"
          placeholder="搜索产品、模式或讨论..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-brand-line/10 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/5 focus:border-brand-ink transition-all"
        />
      </div>
    </section>

    {/* Featured Grid */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { title: '产品情报', desc: '深度拆解 100+ 顶尖 SaaS', icon: Layout, link: '/directory' },
        { title: '设计模式', desc: '可复用的 UI/UX 最佳实践', icon: Layers, link: '/patterns' },
        { title: '社区讨论', desc: '与同行交流增长心得', icon: MessageSquare, link: '/discussions' },
      ].map((item, idx) => (
        <Link key={idx} to={item.link}>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 bg-white border border-brand-line/5 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="w-12 h-12 bg-brand-ink/5 rounded-2xl flex items-center justify-center">
              <item.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-brand-ink/60">{item.desc}</p>
          </motion.div>
        </Link>
      ))}
    </section>

    {/* Latest Breakdowns */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-serif italic">最新情报</h2>
        <Link to="/directory" className="text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
          查看全部 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Linear', 'Notion', 'Slack', 'Framer'].map((name, idx) => (
          <Link key={idx} to={`/intelligence/${name.toLowerCase()}`}>
            <div className="group relative aspect-[4/3] rounded-3xl overflow-hidden bg-brand-ink/5">
              <img
                src={`https://picsum.photos/seed/${name}/800/600`}
                alt={name}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                <h4 className="text-white text-xl font-bold">{name}</h4>
                <p className="text-white/70 text-sm">Productivity & Design</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  </div>
);

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: '产品库', path: '/directory' },
    { name: '模式库', path: '/patterns' },
    { name: '讨论区', path: '/discussions' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#F8F7F4]/80 backdrop-blur-md border-b border-brand-line/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-ink rounded-xl flex items-center justify-center text-brand-bg font-bold text-xl">
                V
              </div>
              <span className="text-xl font-bold tracking-tighter">helloVibeCoding</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-ink",
                    location.pathname === item.path ? "text-brand-ink" : "text-brand-ink/50"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/submit"
              className="flex items-center gap-2 px-4 py-2 bg-brand-ink text-brand-bg rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="h-4 w-4" />
              提交产品
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-brand-line/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-4 text-base font-medium text-brand-ink/70 hover:text-brand-ink hover:bg-brand-ink/5 rounded-xl"
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/submit"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 text-base font-bold text-brand-ink"
              >
                提交产品
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-white border-t border-brand-line/5 py-12 mt-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-ink rounded-lg flex items-center justify-center text-brand-bg font-bold text-lg">
            V
          </div>
          <span className="text-lg font-bold tracking-tighter">helloVibeCoding</span>
        </div>
        <p className="text-sm text-brand-ink/50 leading-relaxed">
          SaaS Intelligence Platform. <br />
          Helping you build better products.
        </p>
      </div>
      
      <div>
        <h4 className="font-bold mb-4">产品</h4>
        <ul className="space-y-2 text-sm text-brand-ink/50">
          <li><Link to="/directory" className="hover:text-brand-ink">产品库</Link></li>
          <li><Link to="/patterns" className="hover:text-brand-ink">模式库</Link></li>
          <li><Link to="/discussions" className="hover:text-brand-ink">讨论区</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-4">资源</h4>
        <ul className="space-y-2 text-sm text-brand-ink/50">
          <li><a href="#" className="hover:text-brand-ink">关于我们</a></li>
          <li><a href="#" className="hover:text-brand-ink">提交产品</a></li>
          <li><a href="#" className="hover:text-brand-ink">API 文档</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-4">关注我们</h4>
        <div className="flex gap-4">
          <a href="#" className="p-2 bg-brand-ink/5 rounded-lg hover:bg-brand-ink/10 transition-colors">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="#" className="p-2 bg-brand-ink/5 rounded-lg hover:bg-brand-ink/10 transition-colors">
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-brand-line/5 text-center text-xs text-brand-ink/30">
      © {new Date().getFullYear()} helloVibeCoding. All rights reserved.
    </div>
  </footer>
);

// Pages
import { Directory } from './pages/Directory';
import { Patterns } from './pages/Patterns';
import { Intelligence } from './pages/Intelligence';
import { Discussions } from './pages/Discussions';
import { Submit } from './pages/Submit';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/intelligence/:id" element={<Intelligence />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/submit" element={<Submit />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
