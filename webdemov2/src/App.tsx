import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useParams, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { 
  Bolt, 
  Search, 
  Plus, 
  ArrowBigUp, 
  MessageSquare, 
  ExternalLink, 
  Clock, 
  User,
  X,
  Send,
  GraduationCap,
  Utensils,
  Bus,
  Briefcase,
  Home as HomeIcon,
  HeartPulse,
  Gamepad2,
  Folder,
  CheckCircle2,
  Zap,
  Layers,
  Circle,
  Users,
  ArrowRight,
  ChevronDown,
  Tag,
  Link as LinkIcon,
  Eye,
  Edit,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Idea, Message, AppBuild, CATEGORIES } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ onOpenSubmit }: { onOpenSubmit: () => void }) => {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border-main h-14 flex items-center justify-between px-4 sm:px-6 w-full max-w-[1200px] mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-black flex items-center justify-center text-white">
          <Bolt size={14} />
        </div>
        <Link to="/" className="text-black font-bold text-lg tracking-tight hover:opacity-70 transition-opacity">
          helloVibeCoding
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center h-full">
        <Link 
          to="/" 
          className={cn(
            "h-full flex items-center px-5 text-sm font-medium border-b-2 transition-colors",
            location.pathname === '/' ? "border-black bg-surface text-black" : "border-transparent text-gray-500 hover:text-black hover:bg-surface/50"
          )}
        >
          灵感 Ideas
        </Link>
        <Link 
          to="/apps" 
          className={cn(
            "h-full flex items-center px-5 text-sm font-medium border-b-2 transition-colors",
            location.pathname === '/apps' ? "border-black bg-surface text-black" : "border-transparent text-gray-500 hover:text-black hover:bg-surface/50"
          )}
        >
          应用 Apps
        </Link>
        <Link 
          to="/rooms" 
          className={cn(
            "h-full flex items-center px-5 text-sm font-medium border-b-2 transition-colors",
            location.pathname === '/rooms' ? "border-black bg-surface text-black" : "border-transparent text-gray-500 hover:text-black hover:bg-surface/50"
          )}
        >
          房间 Rooms
        </Link>
        <button 
          onClick={onOpenSubmit}
          className={cn(
            "h-full flex items-center px-5 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-black hover:bg-surface/50"
          )}
        >
          提交 Submit
        </button>
      </nav>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center border border-border-main bg-surface px-2 h-8 w-48 focus-within:ring-1 focus-within:ring-black">
          <Search size={16} className="text-gray-400" />
          <input 
            className="bg-transparent border-none text-sm w-full focus:ring-0 placeholder:text-gray-400 p-0 px-2 h-full" 
            placeholder="搜索灵感..." 
            type="text"
          />
          <span className="text-[10px] text-gray-400 font-mono border border-border-main px-1 rounded-sm bg-white">⌘K</span>
        </div>
        <button 
          onClick={onOpenSubmit}
          className="text-sm font-medium border border-black bg-black text-white px-3 py-1.5 hover:bg-white hover:text-black transition-colors"
        >
          提交 Submit
        </button>
        <Link 
          to="/profile/alexc"
          className="w-8 h-8 rounded-full bg-gray-200 border border-border-main overflow-hidden cursor-pointer"
        >
          <img 
            alt="User Avatar" 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" 
            src="https://picsum.photos/seed/alexc/100/100" 
            referrerPolicy="no-referrer"
          />
        </Link>
      </div>
    </header>
  );
};

const SubmitModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [pitch, setPitch] = useState('');
  const [category, setCategory] = useState('school');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-[600px] bg-white border border-black z-50 shadow-none flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-main">
            <h2 className="text-black font-bold tracking-tight text-sm uppercase">Submit New Idea</h2>
            <button onClick={onClose} className="text-black hover:bg-surface p-1 rounded transition-colors group">
              <X size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="p-6 space-y-8">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Domain</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-x-1.5 px-3 py-1.5 border rounded transition-all",
                        category === cat.id ? "bg-black text-white border-black" : "bg-white text-black border-border-main hover:bg-surface hover:border-gray-400"
                      )}
                    >
                      <span className="text-sm font-medium">{cat.name.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider group-focus-within:text-black transition-colors">The Pitch</label>
                <textarea 
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full min-h-[160px] p-0 text-3xl font-serif font-bold text-black placeholder-gray-300 border-none bg-transparent focus:ring-0 resize-none leading-tight" 
                  placeholder="Describe your crazy idea in one sentence..."
                />
                <p className="text-xs text-gray-400 font-mono text-right">{pitch.length}/140</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Keywords</label>
                <div className="flex items-center gap-2 border-b border-border-main focus-within:border-black transition-colors pb-1">
                  <Tag size={18} className="text-gray-400" />
                  <input className="w-full p-0 border-none focus:ring-0 text-sm font-mono placeholder-gray-400 bg-transparent" placeholder="Add tags separated by comma..." type="text"/>
                </div>
              </div>

              <div className="pt-2">
                <button className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-black transition-colors">
                  <LinkIcon size={18} />
                  <span>Add reference link or attachment</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border-main bg-gray-50/50 flex items-center justify-between">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-black hover:underline underline-offset-4 transition-all">
              Cancel
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Eye size={14} />
                <span>Public</span>
              </div>
              <button className="px-8 py-2.5 bg-blue-700 text-white text-sm font-bold tracking-wide rounded hover:bg-blue-800 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all shadow-sm">
                PUBLISH IDEA
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface IdeaCardProps {
  idea: Idea;
  onVote: (id: string) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onVote }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'novel': return { label: 'Novel', icon: Zap, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'cocreate': return { label: 'Co-creating', icon: Layers, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'released': return { label: 'Released', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' };
      default: return { label: 'Unclaimed', icon: Circle, color: 'text-gray-500 bg-gray-50 border-gray-200' };
    }
  };

  const config = getStatusConfig(idea.status);

  return (
    <article className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-6 hover:bg-surface transition-colors cursor-pointer border-b border-border-main">
      <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 min-w-[3rem] shrink-0">
        <button 
          onClick={(e) => { e.preventDefault(); onVote(idea.id); }}
          className="text-gray-400 group-hover:text-black hover:scale-110 transition-transform"
        >
          <ArrowBigUp size={28} />
        </button>
        <span className="font-mono font-medium text-lg">{idea.votes}</span>
      </div>

      <Link to={`/idea/${idea.id}`} className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 border text-[11px] font-medium uppercase tracking-wide",
            config.color
          )}>
            <config.icon size={12} className="mr-1" /> {config.label}
          </span>
          <span className="text-xs text-gray-400 font-mono">#{idea.category.toLowerCase()}</span>
        </div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl leading-snug text-black group-hover:underline decoration-1 underline-offset-4">
          {idea.title}
        </h2>
        <p className="text-sm text-gray-600 line-clamp-2">
          {idea.description}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden">
                <img src={`https://picsum.photos/seed/${idea.author}/20/20`} referrerPolicy="no-referrer" />
              </div>
              <span>by {idea.author}</span>
            </div>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(idea.created_at))} ago</span>
          </div>
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-xs font-medium border border-black px-3 py-1 bg-white hover:bg-black hover:text-white transition-colors">Details</button>
          </div>
        </div>
      </Link>
    </article>
  );
};

// --- Pages ---

const Home = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(setIdeas);
  }, []);

  const handleVote = (id: string) => {
    fetch(`/api/ideas/${id}/vote`, { method: 'POST' })
      .then(() => {
        setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i));
      });
  };

  const filteredIdeas = activeCategory 
    ? ideas.filter(i => i.category.toLowerCase() === activeCategory.toLowerCase())
    : ideas;

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:border-r border-b md:border-b-0 border-border-main shrink-0 bg-white sticky top-14 h-auto md:h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="p-4">
          <h3 className="font-mono text-xs text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
          <div className="grid grid-cols-3 md:grid-cols-1 gap-1 md:gap-0">
            <button 
              onClick={() => setActiveCategory(null)}
              className={cn(
                "group flex items-center gap-3 w-full p-2 text-left transition-colors md:mb-1",
                activeCategory === null ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-surface"
              )}
            >
              <Zap size={18} />
              <span className="text-sm font-medium">All Ideas</span>
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "group flex items-center gap-3 w-full p-2 text-left transition-colors md:mb-1",
                  activeCategory === cat.id ? "bg-black text-white" : "text-gray-500 hover:text-black hover:bg-surface"
                )}
              >
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex-1 bg-white min-h-screen">
        <div className="sticky top-14 z-10 bg-white/95 backdrop-blur border-b border-border-main px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-serif font-bold text-xl">
              {activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.name : "All Ideas"}
            </span>
            <span className="bg-surface px-2 py-0.5 text-xs border border-border-main font-mono text-gray-400">
              {filteredIdeas.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">Newest</button>
            <button className="text-xs font-medium uppercase tracking-wider text-gray-400 hover:text-black pb-0.5 ml-3">Top Voted</button>
          </div>
        </div>

        <div className="divide-y divide-border-main">
          {filteredIdeas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
          ))}
        </div>
      </section>
    </main>
  );
};

const IdeaDetail = () => {
  const { id } = useParams();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => setIdea(data.find((i: Idea) => i.id === id)));

    fetch(`/api/ideas/${id}/messages`)
      .then(res => res.json())
      .then(setMessages);

    const newSocket = io();
    setSocket(newSocket);
    newSocket.emit('join-room', id);

    newSocket.on('new-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => { newSocket.close(); };
  }, [id]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    socket.emit('send-message', { ideaId: id, user: 'Anonymous', content: newMessage });
    setNewMessage('');
  };

  if (!idea) return <div className="p-20 text-center font-mono">Loading record...</div>;

  return (
    <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12">
      <section className="mb-12 border-b border-border-main pb-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="px-2 py-0.5 border border-orange-600 text-orange-600 text-xs font-medium uppercase tracking-wide bg-white">⚡ {idea.status}</span>
          <span className="px-2 py-0.5 border border-border-main text-gray-400 text-xs font-mono bg-surface">ID: #{idea.id}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium ml-auto">
            <Clock size={14} /> {formatDistanceToNow(new Date(idea.created_at))} ago • by {idea.author}
          </span>
        </div>
        <h1 className="idea-headline text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] text-black mb-6">
          {idea.title}
        </h1>
        <p className="text-lg text-gray-500 font-light max-w-3xl leading-relaxed">
          {idea.description}
        </p>
        <div className="flex gap-4 mt-8">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors border border-black">
            <ArrowBigUp size={18} /> Upvote ({idea.votes})
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium hover:bg-surface transition-colors border border-border-main">
            <ExternalLink size={18} /> Share
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-border-main bg-white">
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-border-main bg-surface/30">
          <div className="sticky top-14">
            <div className="p-4 border-b border-border-main flex justify-between items-center bg-white">
              <h2 className="font-sans font-semibold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Layers size={18} /> 竞品 / 已有实现 (Evidence)
              </h2>
              <button className="text-xs text-black underline hover:no-underline">Add Link</button>
            </div>
            <div className="p-4 space-y-3 min-h-[400px]">
              <a href="#" className="block p-3 bg-white border border-border-main hover:border-black transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-blue-50 border border-blue-100 flex items-center justify-center text-xl">💩</div>
                    <div>
                      <h3 className="font-bold text-sm text-black group-hover:underline decoration-1 underline-offset-2">Poop Map</h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">apps.apple.com</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-black" />
                </div>
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  Tracks places you've been. Less about health analysis, more about location tracking.
                </p>
              </a>
              
              <div className="p-4 border border-dashed border-border-main text-center bg-transparent mt-4">
                <p className="text-xs text-gray-400 font-mono">No direct AI competitors found.</p>
                <p className="text-xs text-blue-600 font-mono mt-1">Blue ocean opportunity.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full min-h-[600px] relative bg-white">
          <div className="p-4 border-b border-border-main flex justify-between items-center bg-white z-10">
            <h2 className="font-sans font-semibold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <MessageSquare size={18} /> 共建房间 (Co-creation)
            </h2>
          </div>
          
          <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="flex-shrink-0 w-8 text-right pt-1">
                  <div className="size-6 bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center rounded-sm">
                    {msg.user.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 max-w-lg">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-sm text-black">{msg.user}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {msg.created_at ? formatDistanceToNow(new Date(msg.created_at)) : 'just now'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-border-main">
            <div className="flex items-end gap-0 border border-black transition-shadow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                className="flex-1 border-none focus:ring-0 resize-none p-3 text-sm min-h-[48px] placeholder:text-gray-400 font-sans bg-transparent" 
                placeholder="Type your thought..." 
                rows={1}
              />
              <button 
                onClick={sendMessage}
                className="h-12 px-6 bg-black text-white font-medium text-sm hover:bg-gray-800 transition-colors uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
              >
                Send <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const AppGallery = () => {
  const [apps, setApps] = useState<AppBuild[]>([]);

  useEffect(() => {
    fetch('/api/apps').then(res => res.json()).then(setApps);
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-serif font-bold mb-4">Implemented Apps</h1>
        <p className="text-gray-500 max-w-2xl">A gallery of ideas brought to life by the community.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border-main">
        {apps.map(app => (
          <div key={app.id} className="border-r border-b border-border-main p-6 flex flex-col transition-colors hover:bg-surface min-h-[220px]">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 border border-black flex items-center justify-center bg-white">
                <span className="font-bold text-xl">{app.icon.substring(0, 1)}</span>
              </div>
              <span className="text-[10px] font-mono border border-green-600 text-green-600 px-2 py-0.5 uppercase">Released</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{app.title}</h3>
            <p className="text-sm text-gray-600 mb-6 flex-grow">{app.description}</p>
            <div className="flex items-center justify-between">
              <a className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline underline-offset-4" href={app.url}>
                View Site <ExternalLink size={14} />
              </a>
              <span className="text-[11px] text-gray-400 font-mono">By @{app.author}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

const Rooms = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => setIdeas(data));
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'novel': return { label: 'Novel', color: 'border-[#E65100] text-[#E65100]' };
      case 'cocreate': return { label: 'Co-creating', color: 'border-[#1565C0] text-[#1565C0]' };
      case 'released': return { label: 'Released', color: 'border-[#2E7D32] text-[#2E7D32]' };
      default: return { label: 'Unclaimed', color: 'border-[#757575] text-[#757575]' };
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black px-6 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">Active Rooms Directory</h1>
            <p className="text-gray-500 text-sm font-mono tracking-tight uppercase">High-activity co-creation channels. Join a build context.</p>
          </div>
          <div className="hidden sm:flex gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#2E7D32] rounded-full"></span>
              <span>1,204 Builders Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              <span>{ideas.length} Active Rooms</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto border-x border-gray-200 min-h-[calc(100vh-140px)]">
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 text-xs bg-surface">
          <span className="font-bold uppercase tracking-widest text-gray-400">Sort By:</span>
          <button className="font-bold underline underline-offset-4">Activity</button>
          <button className="text-gray-500 hover:text-black">Newest</button>
          <button className="text-gray-500 hover:text-black">Member Count</button>
          <div className="ml-auto hidden sm:flex items-center gap-4 text-gray-400">
            <span>Filter: ⚡ Novel</span>
            <span>🧩 Co-creating</span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {ideas.map(idea => {
            const config = getStatusConfig(idea.status);
            return (
              <div key={idea.id} className="flex items-center justify-between p-6 hover:bg-surface transition-colors group">
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-serif font-bold truncate group-hover:underline underline-offset-4">{idea.title}</h2>
                    <span className={cn("px-2 py-0.5 border text-[10px] font-bold uppercase tracking-tighter", config.color)}>
                      {idea.status === 'novel' ? '⚡ ' : idea.status === 'cocreate' ? '🧩 ' : ''}{config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 bg-[#2E7D32] rounded-full"></span>
                      <span className="font-mono text-xs">12 active</span>
                    </div>
                    <span className="text-gray-400 font-mono shrink-0">|</span>
                    <p className="text-gray-600 truncate italic">
                      <span className="font-bold text-black not-italic text-xs font-mono mr-1">@{idea.author}:</span> 
                      "{idea.description.substring(0, 60)}..."
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="hidden md:block text-right font-mono text-[10px] text-gray-400">
                    Last seen {formatDistanceToNow(new Date(idea.created_at))} ago
                  </div>
                  <Link 
                    to={`/idea/${idea.id}`}
                    className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                  >
                    Join
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 flex justify-center border-t border-gray-200">
          <button className="flex items-center gap-2 text-xs font-mono font-bold hover:underline">
            <ArrowRight size={14} className="rotate-90" />
            LOAD MORE ACTIVE SESSIONS
          </button>
        </div>
      </main>

      <div className="fixed bottom-6 left-6 hidden lg:flex flex-col gap-2 z-50">
        <div className="bg-black text-white px-3 py-1 text-[10px] font-mono border border-black brutalist-shadow-sm">
          LATEST: "Tinder for adoption..." is trending
        </div>
        <div className="bg-white text-black px-3 py-1 text-[10px] font-mono border border-black brutalist-shadow-sm">
          SYSTEM: All builds are 100% open source
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const { username } = useParams();

  useEffect(() => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => setIdeas(data.filter((i: Idea) => i.author === 'alex_dev' || i.author === 'alexc')));
  }, []);

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 border-x border-border-main min-h-[calc(100vh-56px)]">
      <aside className="col-span-1 lg:col-span-3 border-b lg:border-b-0 lg:border-r border-border-main p-6 lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] flex flex-col gap-6 bg-surface/30">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="size-24 rounded-full bg-gray-200 mb-4 border border-border-main overflow-hidden relative group">
            <img 
              alt="User Portrait" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
              src="https://picsum.photos/seed/alexc/200/200" 
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Alex Chen</h1>
          <p className="text-sm text-gray-400 font-mono mt-1">@{username || 'alexc'}</p>
          <div className="flex gap-2 mt-4">
            <span className="px-2 py-0.5 border border-border-main bg-white text-xs font-mono text-gray-400 rounded-sm">UTC-8</span>
            <span className="px-2 py-0.5 border border-border-main bg-white text-xs font-mono text-gray-400 rounded-sm">PRO</span>
          </div>
        </div>
        
        <div className="h-px w-full bg-border-main"></div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bio</h3>
          <p className="text-sm leading-relaxed text-black">
            Full-stack dev looking for weekend chaos. Building tools for the curious. Obsessed with offline-first architecture.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {['React', 'Node.js', 'Rust', 'UI Design'].map(skill => (
              <span key={skill} className="px-2 py-1 bg-white border border-border-main text-xs text-black font-mono hover:bg-black hover:text-white transition-colors cursor-default">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-border-main"></div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-2xl font-serif font-bold">{ideas.length}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Ideas</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-serif font-bold">3</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Builds</span>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button className="w-full h-10 border border-black bg-white hover:bg-black hover:text-white text-sm font-bold transition-all uppercase tracking-wide flex items-center justify-center gap-2 group">
            <span>Edit Profile</span>
            <Edit size={16} className="group-hover:text-white" />
          </button>
        </div>
      </aside>

      <div className="col-span-1 lg:col-span-9 flex flex-col">
        <div className="flex items-center border-b border-border-main bg-white sticky top-14 z-40">
          <button className="px-8 py-4 text-sm font-bold border-r border-border-main bg-surface text-black relative">
            Ideas ({ideas.length})
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black"></div>
          </button>
          <button className="px-8 py-4 text-sm font-medium border-r border-border-main text-gray-400 hover:text-black hover:bg-surface/50 transition-colors">
            Builds (3)
          </button>
          <button className="px-8 py-4 text-sm font-medium border-r border-border-main text-gray-400 hover:text-black hover:bg-surface/50 transition-colors">
            Saved
          </button>
          <div className="flex-1 bg-white"></div>
          <div className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-surface">
            <span className="text-xs font-mono text-gray-400">Sort by:</span>
            <span className="text-sm font-medium">Newest</span>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="flex-1 bg-white">
          <div className="flex flex-col divide-y divide-border-main">
            {ideas.map(idea => (
              <div key={idea.id} className="group flex flex-col sm:flex-row items-start sm:items-center p-6 gap-4 hover:bg-surface transition-colors cursor-pointer">
                <div className="flex flex-col items-center justify-center w-12 pt-1 sm:pt-0">
                  <ArrowUp size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                  <span className="text-sm font-bold font-mono">{idea.votes}</span>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2 py-0.5 border border-orange-600/30 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wide rounded-sm">
                      ⚡ {idea.status}
                    </span>
                    <span className="text-xs font-mono text-gray-400">Posted {formatDistanceToNow(new Date(idea.created_at))} ago</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-black leading-tight group-hover:underline decoration-1 underline-offset-4">
                    {idea.title}
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-border-main min-w-[120px] justify-center">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="size-6 rounded-full bg-gray-200 border border-white overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/20/20`} referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    <div className="size-6 rounded-full bg-gray-400 border border-white flex items-center justify-center text-[8px] font-mono text-white">+3</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 flex justify-center border-t border-transparent">
            <button className="text-sm font-mono text-gray-400 hover:text-black flex items-center gap-2 group">
              LOAD MORE RECORDS
              <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

// --- Root App ---

export default function App() {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-white selection:bg-black selection:text-white">
        <Navbar onOpenSubmit={() => setIsSubmitOpen(true)} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/idea/:id" element={<IdeaDetail />} />
          <Route path="/apps" element={<AppGallery />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
        
        <SubmitModal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} />
        
        <footer className="border-t border-border-main py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs font-mono text-gray-400 uppercase">
              © 2024 HELLOVIBECODING. BUILT WITH INTENT.
            </div>
            <div className="flex items-center gap-6">
              <a className="text-xs font-bold uppercase hover:underline underline-offset-4" href="#">GitHub</a>
              <a className="text-xs font-bold uppercase hover:underline underline-offset-4" href="#">Twitter</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
