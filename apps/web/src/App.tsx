import { FormEvent, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

const AdminPage = lazy(() => import('./components/admin').then(m => ({ default: m.AdminPage })));
import { ArrowUpRight, CheckCircle2, CircleDashed, Flame, Flag, Lightbulb, Menu, MessageCircleMore, MessageSquareDot, PenSquare, QrCode, Sparkles, Target, X } from 'lucide-react';
import {
  createIncubation,
  createDiscussion,
  getDiscussions,
  getIdeaBlocks,
  getIncubationDetail,
  getIncubations,
  getProjectDetail,
  getProjects,
  recommendIdeaProducts,
  DiscussionThread,
  IdeaBlock,
  IdeaProductRecommendation,
  IncubationListItem,
  ProjectDetail,
  ProjectListItem,
} from './lib/api';

type ProjectDiscussion = DiscussionThread & {
  target?: { slug: string; name: string } | null;
  targetType?: string;
};

function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loader()
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError((requestError as Error).message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error, setData };
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getIdeaBlockTypeLabel(blockType: string) {
  switch (blockType) {
    case 'FEATURE':
      return '功能';
    case 'WORKFLOW':
      return '流程';
    case 'CHANNEL':
      return '渠道';
    case 'FORMULA':
      return '公式';
    default:
      return blockType;
  }
}

function renderIdeaTagLabel(tag: string) {
  return tag === 'AI' ? '🔥 AI' : tag;
}

function getIncubationStatusLabel(status: string) {
  switch (status) {
    case 'OPEN':
      return '开放中';
    case 'VALIDATING':
      return '验证中';
    case 'BUILDING':
      return '制作中';
    case 'ARCHIVED':
      return '已归档';
    default:
      return status;
  }
}

function getIncubationNextStep(incubation: IncubationListItem) {
  if (incubation.discussionCount <= 1) return '缺第一轮用户判断';
  if (incubation.discussionCount <= 3) return '缺场景和优先级反馈';
  if (incubation.roomCount === 0) return '缺具体做法和初步验证';
  return '继续收集真实反馈';
}

function getIncubationProgress(incubation: Pick<IncubationListItem, 'blockCount' | 'discussionCount' | 'roomCount'>) {
  let score = 1;
  if (incubation.blockCount >= 2) score += 1;
  if (incubation.discussionCount >= 2) score += 1;
  if (incubation.discussionCount >= 4 || incubation.roomCount > 0) score += 1;
  return {
    completed: score,
    total: 4,
    percent: Math.round((score / 4) * 100),
  };
}

function getIncubationMilestones(incubation: {
  blockCount: number;
  discussionCount: number;
  roomCount: number;
}) {
  return [
    {
      title: '问题方向成形',
      detail: '先用一句话讲清楚，这个方向到底要解决什么问题。',
      done: true,
    },
    {
      title: '点子组合完成',
      detail: '至少由 2 个点子组合，避免只停留在单个灵感。',
      done: incubation.blockCount >= 2,
    },
    {
      title: '拿到首轮反馈',
      detail: '至少收到 2 轮讨论，确认大家在争论什么、质疑什么。',
      done: incubation.discussionCount >= 2,
    },
    {
      title: '形成最小验证',
      detail: '确定具体怎么做，明确下一步怎么试。'}, {
      done: incubation.discussionCount >= 4 || incubation.roomCount > 0,
    },
  ];
}

function BrandMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#d7d7d3] bg-white text-[#2e2d29] shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.2 8.2L6.8 12l3.4 3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.8 8.2L17.2 12l-3.4 3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[color:var(--color-brand-bg)] text-[color:var(--color-brand-ink)]">
      <header className="sticky top-0 z-30 border-b border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" className="flex items-center gap-4" onClick={() => setIsMobileMenuOpen(false)}>
            <BrandMark />
            <div className="text-[19px] font-bold tracking-[-0.035em] text-[#2e2d29] sm:text-[20px]">
              helloVibeCoding
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-5 md:flex">
            {[
              ['/', '首页'],
              ['/projects', '作品库'],
              ['/idea-blocks', '点子实验室'],
              ['/incubations', 'Idea 孵化区'],
              ['/rooms', '房间（暂不开放）'],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `border-b pb-1 text-sm transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-accent)] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-[color:var(--color-brand-ink)] text-[color:var(--color-brand-ink)]'
                      : 'border-transparent text-[color:var(--color-brand-muted)] hover:border-[color:var(--color-brand-line)] hover:text-[color:var(--color-brand-ink)]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[color:var(--color-brand-muted)] transition-colors hover:bg-black/5 hover:text-[color:var(--color-brand-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-accent)] md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="border-t border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-surface)] px-6 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {[
                ['/', '首页'],
                ['/projects', '作品库'],
                ['/idea-blocks', '点子实验室'],
                ['/incubations', 'Idea 孵化区'],
                ['/rooms', '房间（暂不开放）'],
                ['/admin', '管理后台'],
              ].map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-[color:var(--color-brand-accent-light)] text-[color:var(--color-brand-accent)]'
                        : 'text-[color:var(--color-brand-muted)] hover:bg-black/5 hover:text-[color:var(--color-brand-ink)]'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 lg:px-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto mt-6 max-w-5xl px-6 pb-12 lg:px-10">
      <div className="border-t border-[color:var(--color-brand-line)] pt-7 text-sm text-[color:var(--color-brand-muted)]">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="editorial-kicker">联系</div>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="flex items-center gap-2 border border-[color:var(--color-brand-line)] px-3 py-2 transition hover:text-[color:var(--color-brand-ink)]">
                <MessageCircleMore className="h-4 w-4" />
                <span>问题反馈</span>
              </a>
              <a href="#" className="flex items-center gap-2 border border-[color:var(--color-brand-line)] px-3 py-2 transition hover:text-[color:var(--color-brand-ink)]">
                <Sparkles className="h-4 w-4" />
                <span>商务合作</span>
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <div className="editorial-kicker">关注</div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 border border-[color:var(--color-brand-line)] px-3 py-2">
                <QrCode className="h-4 w-4" />
                <span>微信扫码联系</span>
              </div>
              <a href="#" className="border border-[color:var(--color-brand-line)] px-3 py-2 transition hover:text-[color:var(--color-brand-ink)]">
                小红书
              </a>
            </div>
          </div>
        </div>
        <div className="mt-5 text-[15px] leading-7">
          <span>©2026 helloVibeCoding</span>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="editorial-kicker mb-3">{eyebrow}</div>
      <div className="editorial-rule mb-5" />
      <h2 className="text-3xl leading-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-brand-muted)] sm:text-base">{description}</p>
    </div>
  );
}

function Surface({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`border border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-surface)] ${className}`}>
      {children}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[color:var(--color-brand-line)] px-3 py-1.5 text-xs">
      <span className="mr-2 font-mono uppercase tracking-[0.16em] text-[color:var(--color-brand-muted)]">{label}</span>
      <span className="font-medium text-[color:var(--color-brand-ink)]">{value}</span>
    </div>
  );
}

function getPricingLabel(pricing: string) {
  switch (pricing) {
    case 'FREE':
      return '免费';
    case 'PAID':
      return '付费';
    case 'FREEMIUM':
      return 'Freemium';
    case 'USAGE_BASED':
      return '按量';
    default:
      return pricing;
  }
}

function looksLikeImageUrl(value: string) {
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(value);
}

const PROJECT_ICON_MAP: Record<string, string> = {
  'poop-map': '/assets/projects/poop-map/icon.png',
  'countdown-reminders-and-timer': '/assets/projects/countdown-reminders-and-timer/icon.jpg',
  liteschedule: '/assets/projects/liteschedule/icon.jpg',
  'xiaoshipin-yasuo': '/assets/projects/xiaoshipin-yasuo/icon.jpg',
  atvtools: '/assets/projects/atvtools/icon.jpg',
  'lovekey-keyboard': '/assets/projects/lovekey-keyboard/icon.jpg',
  'biubiubiu-air-gun': '/assets/projects/biubiubiu-air-gun/icon.jpg',
  hunqi: '/assets/projects/hunqi/icon.jpg',
  'air-basketball': '/assets/projects/air-basketball/icon.jpg',
  'cat-language': '/assets/projects/cat-language/icon.jpg',
  'watch-browser': '/assets/projects/watch-browser/icon.jpg',
  'plate-simulator': '/assets/projects/plate-simulator/icon.jpg',
};

function ProjectIcon({ slug, name, className = 'h-13 w-13' }: { slug: string; name: string; className?: string }) {
  const iconUrl = PROJECT_ICON_MAP[slug];

  if (iconUrl) {
    return <img alt={`${name} icon`} className={`${className} shrink-0 rounded-[18px] border border-[color:var(--color-brand-line)] object-cover`} src={iconUrl} />;
  }

  return (
    <div className={`flex ${className} shrink-0 items-center justify-center rounded-[18px] border border-[color:var(--color-brand-line)] bg-[#f8f8f8] font-serif text-lg`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function DirectoryProjectRow({ project }: { project: ProjectListItem }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="block border-b border-[color:var(--color-brand-line)] px-4 py-4 transition hover:bg-black/[0.015]"
    >
      <div className="flex gap-4">
        <ProjectIcon slug={project.slug} name={project.name} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="truncate text-[24px] leading-none">{project.name}</h3>
                <span className="truncate text-base text-[color:var(--color-brand-muted)]">{project.tagline}</span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm leading-6 text-[color:var(--color-brand-muted)]">
                {project.tagline}
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-[#6ea6eb] px-2.5 py-1 text-xs font-medium text-white">
              {project.discussionCount}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--color-brand-muted)]">
            <span>{project.category}</span>
            <span>•</span>
            <span>{getPricingLabel(project.pricing)}</span>
            <span>•</span>
            <span>{formatRelativeDate(project.createdAt)}</span>
            <span>•</span>
            <span>热度 {project.heatScore}</span>
          </div>
        </div>

        <div className="hidden w-24 shrink-0 items-end justify-between self-stretch text-right text-sm text-[color:var(--color-brand-muted)] lg:flex lg:flex-col">
          <span>{project.ideaBlockCount} 点子</span>
          <span>{project.incubationCount} 孵化</span>
          <span>{project.roomCount} 房间</span>
        </div>
      </div>
    </Link>
  );
}

function IdeaBlockDirectoryRow({ block }: { block: IdeaBlock }) {
  return (
    <div className="border-b border-[color:var(--color-brand-line)] px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center border border-[color:var(--color-brand-line)] bg-[#f8f8f8] font-mono text-sm uppercase text-[color:var(--color-brand-muted)]">
          {getIdeaBlockTypeLabel(block.blockType).slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-[24px] leading-none">{block.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{block.summary}</p>
            </div>
            <div className="hidden shrink-0 rounded-full border border-[color:var(--color-brand-line)] px-2.5 py-1 text-xs text-[color:var(--color-brand-muted)] md:block">
              {block.incubationCount || 0} 次复用
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--color-brand-muted)]">
            <span>{getIdeaBlockTypeLabel(block.blockType)}</span>
            {block.sourceProjects[0] ? (
              <>
                <span>•</span>
                <span>来源 {block.sourceProjects[0].name}</span>
              </>
            ) : null}
            {block.tags[0] ? (
              <>
                <span>•</span>
                <span>{block.tags[0]}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function IncubationDirectoryRow({ incubation }: { incubation: IncubationListItem }) {
  const progress = getIncubationProgress(incubation);

  return (
    <Link to={`/incubations/${incubation.slug}`} className="block border-b border-[color:var(--color-brand-line)] px-4 py-5 transition hover:bg-[#fcfdff]">
      <div className="flex items-start gap-4">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-brand-line)] bg-[#f7f9fd] font-mono text-sm uppercase text-[color:var(--color-brand-accent)]">
          IN
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                <span>创作议题</span>
                <span>·</span>
                <span>{progress.percent}% 进度</span>
              </div>
              <h3 className="mt-2 truncate text-[26px] leading-none">{incubation.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{incubation.oneLiner}</p>
            </div>
            <div className="shrink-0 rounded-full border border-[color:var(--color-brand-line)] px-2.5 py-1 text-xs text-[color:var(--color-brand-muted)]">{getIncubationStatusLabel(incubation.status)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(incubation.tags || []).slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full border border-[color:var(--color-brand-line)] px-3 py-1 text-xs text-[color:var(--color-brand-muted)]">
                {renderIdeaTagLabel(tag)}
              </span>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-full bg-black/[0.05]">
            <div className="h-1.5 bg-[color:var(--color-brand-accent)] transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="mt-4 grid gap-3 border-t border-[color:var(--color-brand-line)] pt-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">当前在讨论什么</div>
              <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-ink)]">{incubation.oneLiner}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">更缺什么验证</div>
              <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{getIncubationNextStep(incubation)}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--color-brand-muted)]">
            <span>{incubation.blockCount} 个点子</span>
            <span>•</span>
            <span>{incubation.discussionCount} 条讨论</span>
            <span>•</span>
            <span>{incubation.roomCount} 个房间</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Link to={`/projects/${project.slug}`} className="block">
      <Surface className="h-full border-x-0 border-t-0 p-0 pb-6 transition hover:border-[color:var(--color-brand-accent)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <ProjectIcon slug={project.slug} name={project.name} className="h-16 w-16" />
            <div>
              <div className="editorial-meta">{project.category}</div>
              <h3 className="mt-3 text-3xl leading-tight">{project.name}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-brand-muted)]">{project.tagline}</p>
            </div>
          </div>
          <div className="editorial-meta">{project.pricing}</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <MetricPill label="讨论" value={project.discussionCount} />
          <MetricPill label="点子" value={project.ideaBlockCount} />
          <MetricPill label="孵化" value={project.incubationCount} />
          <MetricPill label="热度" value={project.heatScore} />
        </div>
      </Surface>
    </Link>
  );
}

function DiscussionCard({ discussion }: { discussion: ProjectDiscussion }) {
  return (
    <Surface className="border-x-0 border-t-0 p-0 pb-5">
      <div className="flex flex-wrap items-center gap-2 editorial-meta">
        <span>{discussion.targetType === 'INCUBATION' ? 'Idea 孵化区' : '作品讨论'}</span>
        {discussion.target ? <Link to={`/projects/${discussion.target.slug}`} className="editorial-link">{discussion.target.name}</Link> : null}
      </div>
      <h3 className="mt-3 text-2xl leading-tight">{discussion.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--color-brand-muted)]">{discussion.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[color:var(--color-brand-muted)]">
        <span>{discussion.createdBy || '匿名'}</span>
        <span>·</span>
        <span>{discussion.replyCount} 条回复</span>
        <span>·</span>
        <span>{formatRelativeDate(discussion.lastActivityAt)}</span>
      </div>
    </Surface>
  );
}

function IdeaBlockCard({ block }: { block: IdeaBlock }) {
  return (
    <Surface className="p-5">
      <div className="editorial-meta">{getIdeaBlockTypeLabel(block.blockType)}</div>
      <h3 className="mt-3 text-2xl leading-tight">{block.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--color-brand-muted)]">{block.summary}</p>
      {block.noveltyNote ? <p className="mt-4 border-l-2 border-[color:var(--color-brand-line)] pl-4 text-sm leading-7 text-[color:var(--color-brand-ink)]">{block.noveltyNote}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {block.tags.map((tag) => (
          <span key={tag} className="border border-[color:var(--color-brand-line)] px-3 py-1 text-xs text-[color:var(--color-brand-muted)]">
            {tag}
          </span>
        ))}
      </div>
    </Surface>
  );
}

function IncubationCard({ incubation }: { incubation: IncubationListItem }) {
  return (
    <Link to={`/incubations/${incubation.slug}`} className="block">
      <Surface className="p-5 transition hover:-translate-y-0.5 hover:border-black/25">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-black/35">Idea 孵化区</div>
          <div className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/60">{getIncubationStatusLabel(incubation.status)}</div>
        </div>
        <h3 className="mt-3 text-xl font-medium">{incubation.title}</h3>
        <p className="mt-2 text-sm leading-6 text-black/60">{incubation.oneLiner}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <MetricPill label="点子" value={incubation.blockCount} />
          <MetricPill label="讨论" value={incubation.discussionCount} />
          <MetricPill label="房间" value={incubation.roomCount} />
        </div>
      </Surface>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-surface)] px-6 py-20 text-center">
      <div className="relative">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--color-brand-line)] border-t-[color:var(--color-brand-accent)]"></div>
      </div>
      <p className="mt-4 text-sm text-[color:var(--color-brand-muted)]">正在加载…</p>
    </div>
  );
}

function HomePage() {
  const projects = useAsyncData(() => getProjects(), []);
  const discussions = useAsyncData(() => getDiscussions(), []);
  const ideaBlocks = useAsyncData(() => getIdeaBlocks(), []);
  const incubations = useAsyncData(() => getIncubations(), []);

  if (!projects.data || !discussions.data || !ideaBlocks.data || !incubations.data) {
    return <LoadingState />;
  }

  const workflowProject = projects.data.items.find((item) => item.slug === 'poop-map') || projects.data.items[0];
  const workflowIdea = ideaBlocks.data.items.find((item) => item.slug === 'private-behavior-map') || ideaBlocks.data.items[0];
  const workflowIncubation = incubations.data.items.find((item) => item.slug === 'slack-off-map') || incubations.data.items[0];

  return (
    <div className="space-y-12">
      <section>
        <Surface className="p-7">
          <div className="editorial-kicker">HelloVibeCoding</div>
          <h1 className="mt-4 max-w-4xl text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
            这些产品方向，
            <br />
            都是从真实 App 里抠出来的。
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--color-brand-muted)]">
            先扒市面上真实的上线产品，看它们哪些设计真的管用。把能复用的点子挑出来，两三个一组合，说不定就能做出新东西。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/projects" className="border border-[color:var(--color-brand-ink)] bg-[color:var(--color-brand-ink)] px-5 py-3 text-sm text-[color:var(--color-brand-surface)] transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-accent)] focus-visible:ring-offset-2">
              先看作品
            </Link>
            <Link to="/idea-blocks" className="border border-[color:var(--color-brand-line)] px-5 py-3 text-sm text-[color:var(--color-brand-ink)] transition-all duration-200 hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-accent)] focus-visible:ring-offset-2">
              进入点子实验室
            </Link>
          </div>
          <div className="mt-8 border-t border-[color:var(--color-brand-line)] pt-6">
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)_52px_minmax(0,1fr)] lg:items-center">
              {[
                ['作品', `${projects.data.total} 个真实样本`, '扒真实的上线产品，看它们为什么能成。', 'bg-[#eef3ff] text-[#4b6cb7]'],
                ['点子', `${ideaBlocks.data.total} 个共享机制`, '把好用的设计挑出来，大家都能拿去用。', 'bg-[#eef8f1] text-[#2f7d57]'],
                ['孵化', `${incubations.data.total} 个进行中方向`, '挑几个点子拼一拼，看看能不能长出新产品。', 'bg-[#fff4e8] text-[#b36a1f]'],
              ].flatMap((item, index, array) =>
                index < array.length - 1
                  ? [
                      <div key={`${item[0]}-card`} className="rounded-[22px] border border-[color:var(--color-brand-line)] px-4 py-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium ${item[3]}`}>
                          {index + 1}
                        </div>
                        <div className="mt-3 text-xl">{item[0]}</div>
                        <div className="mt-1 text-sm text-[color:var(--color-brand-accent)]">{item[1]}</div>
                        <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{item[2]}</div>
                      </div>,
                      <div key={`${item[0]}-arrow`} className="flow-arrow hidden lg:block" aria-hidden="true" />,
                    ]
                  : [
                      <div key={`${item[0]}-card`} className="rounded-[22px] border border-[color:var(--color-brand-line)] px-4 py-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium ${item[3]}`}>
                          {index + 1}
                        </div>
                        <div className="mt-3 text-xl">{item[0]}</div>
                        <div className="mt-1 text-sm text-[color:var(--color-brand-accent)]">{item[1]}</div>
                        <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{item[2]}</div>
                      </div>,
                    ],
              )}
            </div>
          </div>
        </Surface>
      </section>

      <section>
        <Surface className="p-6">
          <div className="editorial-kicker">真实链路示例</div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)_56px_minmax(0,1fr)] lg:items-stretch">
            <Link to={`/projects/${workflowProject.slug}`} className="border border-[color:var(--color-brand-line)] px-5 py-5 transition hover:border-[color:var(--color-brand-accent)]">
              <div className="editorial-meta">作品</div>
              <div className="mt-3 flex items-center gap-4">
                <ProjectIcon slug={workflowProject.slug} name={workflowProject.name} className="h-14 w-14" />
                <div>
                  <div className="text-2xl">Poop Map</div>
                  <div className="mt-1 text-sm leading-6 text-[color:var(--color-brand-muted)]">上厕所也能打卡，地图上全是你的战绩。</div>
                </div>
              </div>
            </Link>
            <div className="flow-arrow hidden lg:block" aria-hidden="true" />
            <Link to="/idea-blocks" className="border border-[color:var(--color-brand-line)] px-5 py-5 transition hover:border-[color:var(--color-brand-accent)]">
              <div className="editorial-meta">点子</div>
              <div className="mt-3 text-2xl">{workflowIdea?.title || '私密行为 x 地图打点'}</div>
              <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">平时不好意思提的小事，也能变成可以记录的标记。</div>
            </Link>
            <div className="flow-arrow hidden lg:block" aria-hidden="true" />
            <Link to={`/incubations/${workflowIncubation.slug}`} className="border border-[color:var(--color-brand-line)] px-5 py-5 transition hover:border-[color:var(--color-brand-accent)]">
              <div className="editorial-meta">孵化</div>
              <div className="mt-3 text-2xl">摸鱼战绩地图</div>
              <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">记录上班摸鱼、散步买咖啡的战绩，看谁在职场更"会生活"。</div>
            </Link>
          </div>
        </Surface>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="editorial-kicker">作品精选</div>
            <h2 className="mt-3 text-3xl leading-tight">从真实产品开始</h2>
          </div>
          <Link to="/projects" className="text-sm text-[color:var(--color-brand-muted)] transition hover:text-[color:var(--color-brand-accent)]">
            查看全部作品
          </Link>
        </div>
        <Surface className="overflow-hidden">
          {projects.data.items.slice(0, 3).map((project) => (
            <DirectoryProjectRow key={project.id} project={project} />
          ))}
        </Surface>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="editorial-kicker">点子精选</div>
              <h2 className="mt-3 text-3xl leading-tight">看能复用的点子</h2>
            </div>
            <Link to="/idea-blocks" className="text-sm text-[color:var(--color-brand-muted)] transition hover:text-[color:var(--color-brand-accent)]">
              进入实验室
            </Link>
          </div>
          <div className="mt-5 grid gap-4">
            {ideaBlocks.data.items.slice(0, 3).map((block) => (
              <IdeaBlockCard key={block.id} block={block} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="editorial-kicker">孵化精选</div>
              <h2 className="mt-3 text-3xl leading-tight">看新产品是怎么诞生的</h2>
            </div>
            <Link to="/incubations" className="text-sm text-[color:var(--color-brand-muted)] transition hover:text-[color:var(--color-brand-accent)]">
              查看全部孵化
            </Link>
          </div>
          <div className="mt-5 grid gap-4">
            {incubations.data.items.slice(0, 2).map((incubation) => (
              <IncubationCard key={incubation.id} incubation={incubation} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="editorial-kicker">最近讨论</div>
        <Surface className="overflow-hidden">
          {discussions.data.items.slice(0, 3).map((discussion, index) => (
            <div key={discussion.id} className={index === 0 ? '' : 'border-t border-[color:var(--color-brand-line)]'}>
              <div className="px-5 py-5">
                <DiscussionCard discussion={discussion} />
              </div>
            </div>
          ))}
        </Surface>
      </section>
    </div>
  );
}

function ProjectsPage() {
  const { data, loading } = useAsyncData(() => getProjects(), []);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [sortMode, setSortMode] = useState<'latest' | 'heat' | 'discussion' | 'incubation'>('latest');
  if (loading || !data) return <LoadingState />;

  const categoryStats = data.items.reduce<Record<string, number>>((accumulator, project) => {
    accumulator[project.category] = (accumulator[project.category] || 0) + 1;
    return accumulator;
  }, {});

  const categories = ['全部', ...Object.keys(categoryStats).sort((left, right) => categoryStats[right] - categoryStats[left])];

  const filteredProjects = data.items
    .filter((project) => activeCategory === '全部' || project.category === activeCategory)
    .sort((left, right) => {
      if (sortMode === 'heat') return right.heatScore - left.heatScore;
      if (sortMode === 'discussion') return right.discussionCount - left.discussionCount;
      if (sortMode === 'incubation') return right.incubationCount - left.incubationCount;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  const totalDiscussions = filteredProjects.reduce((sum, project) => sum + project.discussionCount, 0);
  const totalIncubations = filteredProjects.reduce((sum, project) => sum + project.incubationCount, 0);

  return (
    <div className="-mt-10">
      <div className="grid gap-4 lg:grid-cols-[156px_minmax(0,1fr)_220px] lg:items-start">
        <Surface className="self-start p-3 lg:sticky lg:top-24">
          <div className="text-base font-medium">热门分类</div>
          <div className="mt-3 space-y-1 border-t border-[color:var(--color-brand-line)] pt-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition ${
                  activeCategory === category
                    ? 'bg-[#f3f5f8] text-[color:var(--color-brand-accent)]'
                    : 'text-[color:var(--color-brand-muted)] hover:bg-black/[0.02] hover:text-[color:var(--color-brand-ink)]'
                }`}
              >
                <span>{category}</span>
                <span className="font-mono text-xs">{category === '全部' ? data.total : categoryStats[category]}</span>
              </button>
            ))}
          </div>
        </Surface>

        <div className="min-w-0 space-y-3">
          <Surface className="p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  ['latest', '最新'],
                  ['heat', '热度'],
                  ['discussion', '讨论'],
                  ['incubation', '孵化'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSortMode(value as 'latest' | 'heat' | 'discussion' | 'incubation')}
                    className={`px-3.5 py-2 text-sm transition ${
                      sortMode === value
                        ? 'bg-[#f3f5f8] text-[color:var(--color-brand-accent)]'
                        : 'text-[color:var(--color-brand-muted)] hover:bg-black/[0.02] hover:text-[color:var(--color-brand-ink)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 text-sm text-[color:var(--color-brand-muted)]">
                <span>{filteredProjects.length} 个作品</span>
                <span>{totalDiscussions} 条讨论</span>
                <span>{totalIncubations} 个孵化</span>
              </div>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            {filteredProjects.map((project) => (
              <DirectoryProjectRow key={project.id} project={project} />
            ))}
          </Surface>
        </div>

        <div className="space-y-3 lg:sticky lg:top-24">
          <Surface className="p-5">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">当前列表</div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-b border-[color:var(--color-brand-line)] pb-5">
              <div>
                <div className="text-3xl">{filteredProjects.length}</div>
                <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">作品</div>
              </div>
              <div>
                <div className="text-3xl">{totalDiscussions}</div>
                <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">讨论</div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              这一页优先解决“快速扫”和“快速比较”。先用分类收窄范围，再通过热度、讨论和孵化信号判断哪些作品值得点开。
            </p>
          </Surface>

          <Surface className="p-5">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-brand-muted)]">编辑建议</div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              <p>优先看那些讨论多、孵化也多的作品，它们通常更值得研究。</p>
              <p>如果你在找可以继续做的方向，先看讨论数多的条目，再点进去看"点子"和"孵化"标签。</p>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function IdeaBlocksPage() {
  const navigate = useNavigate();
  const ideaBlocks = useAsyncData(() => getIdeaBlocks(), []);
  const projects = useAsyncData(() => getProjects(), []);
  const [activeTag, setActiveTag] = useState('全部');
  const [sortMode, setSortMode] = useState<'category' | 'heat' | 'incubation'>('heat');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<IdeaBlock[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [title, setTitle] = useState('新的项目方向');
  const [oneLiner, setOneLiner] = useState('把多个点子组合起来，看看能不能做成新产品。');
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<IdeaProductRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [saving, setSaving] = useState(false);

  if (ideaBlocks.loading || projects.loading || !ideaBlocks.data || !projects.data) {
    return <LoadingState />;
  }

  const projectBySlug = new Map(projects.data.items.map((project) => [project.slug, project]));
  const itemsWithSignals = ideaBlocks.data.items.map((item) => {
    const relatedProjects = item.sourceProjects
      .map((project) => projectBySlug.get(project.slug))
      .filter((project): project is ProjectListItem => Boolean(project));
    const categoryCounts = relatedProjects.reduce<Record<string, number>>((accumulator, project) => {
      accumulator[project.category] = (accumulator[project.category] || 0) + 1;
      return accumulator;
    }, {});
    const primaryCategory =
      Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || '未分类';
    const averageHeat = relatedProjects.length
      ? Math.round(relatedProjects.reduce((sum, project) => sum + project.heatScore, 0) / relatedProjects.length)
      : 0;

    return {
      ...item,
      primaryCategory,
      averageHeat,
    };
  });
  const tagOptions = [
    '全部',
    ...Array.from(
      new Set(
        itemsWithSignals
          .flatMap((item) => item.tags)
          .filter(Boolean),
      ),
    ),
  ];
  const filteredItems = itemsWithSignals
    .filter((item) => activeTag === '全部' || item.tags.includes(activeTag))
    .sort((left, right) => {
      if (sortMode === 'category') {
        return left.primaryCategory.localeCompare(right.primaryCategory, 'zh-CN');
      }
      if (sortMode === 'incubation') {
        return (right.incubationCount || 0) - (left.incubationCount || 0);
      }
      return right.averageHeat - left.averageHeat;
    });
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const generatedSources = Array.from(new Map(selected.flatMap((block) => block.sourceProjects).map((project) => [project.slug, project])).values());
  function setSelection(blocks: IdeaBlock[]) {
    const nextBlocks = Array.from(new Map(blocks.map((block) => [block.id, block])).values()).slice(0, 3);
    setSelected(nextBlocks);
    setIsComposerOpen(true);
    setAiRecommendations([]);
    if (nextBlocks.length) {
      setTitle(`${nextBlocks.map((block) => block.title).slice(0, 2).join(' + ')} 方向`);
      setOneLiner(`把 ${nextBlocks.map((block) => block.title).join('、')} 组合起来，看看能不能做成新产品。`);
    }
  }

  function appendBlock(block: IdeaBlock) {
    setSelected((current) => {
      if (current.some((item) => item.id === block.id) || current.length >= 3) {
        return current;
      }
      return [...current, block];
    });
    setIsComposerOpen(true);
    setAiRecommendations([]);
  }

  function removeBlock(blockId: string) {
    setSelected((current) => current.filter((item) => item.id !== blockId));
    setAiRecommendations([]);
  }

  function handleRandomCombination() {
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
    const count = Math.min(filteredItems.length, filteredItems.length <= 2 ? filteredItems.length : Math.random() > 0.5 ? 3 : 2);
    setSelection(shuffled.slice(0, count));
  }

  async function handleAiRecommend() {
    if (selected.length < 2) return;

    setLoadingRecommendations(true);
    try {
      const response = await recommendIdeaProducts(selected.map((block) => block.slug));
      const items = response.items?.length
        ? response.items
        : [
            {
              title: `${selected[0]?.title || '共享机制'}工作台`,
              summary: `把 ${selected.slice(0, 2).map((block) => block.title).join(' + ')} 组合成一个更直接的产品，先服务 ${generatedSources[0]?.name || '明确场景'} 的用户。`,
            },
            {
              title: `${generatedSources[0]?.name || '轻量'}助手`,
              summary: `保留 ${selected[0]?.title || '核心机制'}，再把 ${selected[1]?.title || selected[0]?.title || '第二个点子'} 变成更低门槛的入口，适合快速试试。`,
            },
            {
              title: `${selected[selected.length - 1]?.title || '点子'}实验项目`,
              summary: `围绕 ${selected.map((block) => block.title).slice(0, 3).join(' / ')} 做一个更有传播性的 MVP，用内容化包装和讨论驱动先拿到反馈。`,
            },
          ];
      setAiRecommendations(items.slice(0, 3));
    } finally {
      setLoadingRecommendations(false);
    }
  }

  async function handleCreateIncubation() {
    if (selected.length < 2 || selected.length > 3 || !title.trim() || !oneLiner.trim()) return;

    setSaving(true);
    setResultMessage(null);
    try {
      const created = await createIncubation({
        slug: `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`.replace(/^-|-$/g, ''),
        title: title.trim(),
        oneLiner: oneLiner.trim(),
        createdBy: '站内共创者',
        blockSlugs: selected.map((block) => block.slug),
        sourceProjectSlugs: generatedSources.map((project) => project.slug),
      });
      setResultMessage(`已创建：${created.title}`);
      navigate(`/incubations/${created.slug}`);
    } catch {
      setResultMessage('创建失败，请检查输入。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="-mt-10 space-y-4">
      <Surface className="overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="editorial-kicker">Idea Lab</div>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">点子实验室</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--color-brand-muted)]">
              这些点子是我们从真实产品和讨论里挑出来的。你可以选几个放进组合区，看看能不能孵化出新东西。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[color:var(--color-brand-line)] px-4 py-5">
              <div className="text-3xl">{filteredItems.length}</div>
              <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">画廊点子</div>
            </div>
            <div className="border border-[color:var(--color-brand-line)] px-4 py-5">
              <div className="text-3xl">{filteredItems.reduce((sum, item) => sum + (item.incubationCount || 0), 0)}</div>
              <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">总复用次数</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[color:var(--color-brand-line)] pt-5">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setActiveTag(tag);
                setCurrentPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeTag === tag
                  ? 'bg-[#eaf1f8] text-[color:var(--color-brand-accent)]'
                  : 'border border-[color:var(--color-brand-line)] text-[color:var(--color-brand-muted)] hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]'
              }`}
            >
              {renderIdeaTagLabel(tag)}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {[
              ['category', '分类'],
              ['heat', '热度'],
              ['incubation', '孵化个数'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSortMode(value as 'category' | 'heat' | 'incubation');
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 text-sm transition ${
                  sortMode === value
                    ? 'bg-[#f3f5f8] text-[color:var(--color-brand-accent)]'
                    : 'border border-[color:var(--color-brand-line)] text-[color:var(--color-brand-muted)] hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]'
                }`}
              >
                按{label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleRandomCombination}
              className="border border-[color:var(--color-brand-line)] px-4 py-2 text-sm text-[color:var(--color-brand-ink)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
            >
              随机组合 2-3 个
            </button>
          </div>
        </div>
      </Surface>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pagedItems.map((block) => (
            <div key={block.id} className="text-left transition">
              <Surface className="flex h-full flex-col p-5 transition hover:border-[color:var(--color-brand-accent)] hover:bg-[#fcfdff]">
                <div className="flex items-start justify-between gap-4">
                  <div className="editorial-meta text-left">{getIdeaBlockTypeLabel(block.blockType)}</div>
                  <div className="text-xs text-[color:var(--color-brand-muted)]">{block.incubationCount || 0} 次孵化</div>
                </div>
                <h2 className="mt-4 line-clamp-2 text-2xl leading-tight">{block.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[color:var(--color-brand-muted)]">{block.summary}</p>
                {block.noveltyNote ? (
                  <p className="mt-4 line-clamp-2 border-l-2 border-[color:var(--color-brand-line)] pl-4 text-sm leading-7 text-[color:var(--color-brand-ink)]">
                    {block.noveltyNote}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  {block.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-[color:var(--color-brand-line)] px-3 py-1 text-xs text-[color:var(--color-brand-muted)]">
                    {renderIdeaTagLabel(tag)}
                  </span>
                ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[color:var(--color-brand-line)] pt-4 text-sm text-[color:var(--color-brand-muted)]">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">分类</div>
                    <div className="mt-1">{block.primaryCategory}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">热度</div>
                    <div className="mt-1">{block.averageHeat}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">来源</div>
                    <div className="mt-1">{block.sourceProjects.length} 个作品</div>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">孵化</div>
                    <div className="mt-1">{block.incubationCount || 0} 个方向</div>
                  </div>
                </div>
                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={() => appendBlock(block)}
                    disabled={selected.length >= 3 && !selected.some((item) => item.id === block.id)}
                    className="w-full border border-[color:var(--color-brand-ink)] bg-[color:var(--color-brand-ink)] px-3 py-2 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {selected.some((item) => item.id === block.id) ? '已加入' : selected.length >= 3 ? '最多 3 个' : '加入组合'}
                  </button>
                </div>
              </Surface>
            </div>
          ))}
        </div>

        <Surface className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[color:var(--color-brand-muted)]">
              第 {currentPage} / {totalPages} 页，共 {filteredItems.length} 个点子
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="border border-[color:var(--color-brand-line)] px-3 py-2 text-sm text-[color:var(--color-brand-ink)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)] disabled:opacity-40"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm transition ${
                    currentPage === page
                      ? 'bg-[#f3f5f8] text-[color:var(--color-brand-accent)]'
                      : 'border border-[color:var(--color-brand-line)] text-[color:var(--color-brand-muted)] hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="border border-[color:var(--color-brand-line)] px-3 py-2 text-sm text-[color:var(--color-brand-ink)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)] disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        </Surface>
      </div>

      {selected.length ? (
        <Surface className={`sticky bottom-4 z-30 border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-surface)]/96 p-4 backdrop-blur`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="editorial-kicker">组合篮</div>
                  <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">
                    已加入 {selected.length} 个点子。组合区只支持 2-3 个点子。
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-2 text-xs text-[color:var(--color-brand-muted)]">
                    <span>{selected.length} 个点子</span>
                    <span>•</span>
                    <span>{generatedSources.length} 个来源作品</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen((current) => !current)}
                    className="border border-[color:var(--color-brand-line)] px-3 py-2 text-sm text-[color:var(--color-brand-ink)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
                  >
                    {isComposerOpen ? '收起' : '展开'}
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.map((block) => (
                  <div key={block.id} className="flex items-center gap-2 rounded-full border border-[color:var(--color-brand-line)] bg-[#fcfdff] px-3 py-2 text-sm">
                    <span>{block.title}</span>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="text-xs text-[color:var(--color-brand-muted)] transition hover:text-[color:var(--color-brand-ink)]"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {isComposerOpen ? (
              <div className="grid gap-3 lg:w-[420px]">
                <input className="w-full border border-[color:var(--color-brand-line)] bg-white px-3 py-3 text-sm outline-none" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="孵化方向名" />
                <textarea className="min-h-24 w-full border border-[color:var(--color-brand-line)] bg-white px-3 py-3 text-sm outline-none" value={oneLiner} onChange={(event) => setOneLiner(event.target.value)} placeholder="一句话定位" />
                <div className="border border-[color:var(--color-brand-line)] bg-[#fcfdff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">AI 推荐</div>
                    <button
                      type="button"
                      onClick={handleAiRecommend}
                      disabled={loadingRecommendations || selected.length < 2}
                      className="border border-[color:var(--color-brand-line)] px-3 py-2 text-sm text-[color:var(--color-brand-ink)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)] disabled:opacity-40"
                    >
                      {loadingRecommendations ? '生成中…' : '生成 3 个产品'}
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {aiRecommendations.map((item, index) => (
                      <button
                        key={`${item.title}-${index}`}
                        type="button"
                        onClick={() => {
                          setTitle(item.title);
                          setOneLiner(item.summary);
                        }}
                        className="block w-full border border-[color:var(--color-brand-line)] bg-white px-3 py-3 text-left transition hover:border-[color:var(--color-brand-accent)]"
                      >
                        <div className="text-sm font-medium text-[color:var(--color-brand-ink)]">{item.title}</div>
                        <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{item.summary}</div>
                      </button>
                    ))}
                    {!aiRecommendations.length ? (
                      <div className="text-sm leading-6 text-[color:var(--color-brand-muted)]">
                        选中 2-3 个点子后，点击按钮再生成 3 个产品建议。
                      </div>
                    ) : null}
                  </div>
                </div>
                {resultMessage ? <div className="text-sm text-[color:var(--color-brand-muted)]">{resultMessage}</div> : null}
                <button
                  type="button"
                  onClick={handleCreateIncubation}
                  disabled={saving || selected.length < 2 || selected.length > 3}
                  className="w-full border border-[color:var(--color-brand-ink)] bg-[color:var(--color-brand-ink)] px-4 py-3 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? '创建中…' : '保存到 Idea 孵化区'}
                </button>
              </div>
            ) : null}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

function IncubationsPage() {
  const { data, loading } = useAsyncData(() => getIncubations(), []);
  const [activeTag, setActiveTag] = useState('全部');
  if (loading || !data) return <LoadingState />;

  const tagOptions = ['全部', ...Array.from(new Set(data.items.flatMap((item) => item.tags || [])))];
  const filteredItems = data.items.filter((item) => activeTag === '全部' || (item.tags || []).includes(activeTag));
  const discussedItems = [...filteredItems].sort((left, right) => right.discussionCount - left.discussionCount).slice(0, 3);
  const hottestItems = [...filteredItems].sort((left, right) => (right.discussionCount + right.blockCount) - (left.discussionCount + left.blockCount)).slice(0, 3);
  const totalDiscussions = filteredItems.reduce((sum, item) => sum + item.discussionCount, 0);
  const totalRooms = filteredItems.reduce((sum, item) => sum + item.roomCount, 0);

  return (
    <div className="-mt-10">
      <div className="grid gap-4 lg:grid-cols-[156px_minmax(0,1fr)_220px] lg:items-start">
        <Surface className="self-start p-3 lg:sticky lg:top-24">
          <div className="text-base font-medium">方向标签</div>
          <div className="mt-3 space-y-1 border-t border-[color:var(--color-brand-line)] pt-3">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition ${
                  activeTag === tag
                    ? 'bg-[#f3f5f8] text-[color:var(--color-brand-accent)]'
                    : 'text-[color:var(--color-brand-muted)] hover:bg-black/[0.02] hover:text-[color:var(--color-brand-ink)]'
                }`}
              >
                <span>{renderIdeaTagLabel(tag)}</span>
                <span className="font-mono text-xs">{tag === '全部' ? data.total : data.items.filter((item) => (item.tags || []).includes(tag)).length}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-[color:var(--color-brand-line)] pt-4">
            <div className="text-xs tracking-[0.18em] text-[color:var(--color-brand-muted)]">最近在讨论</div>
            <div className="mt-3 space-y-2">
              {discussedItems.length ? (
                discussedItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/incubations/${item.slug}`}
                    className="block border border-[color:var(--color-brand-line)] px-3 py-3 transition hover:border-[color:var(--color-brand-accent)] hover:bg-[#fcfdff]"
                  >
                    <div className="line-clamp-2 text-sm leading-6">{item.title}</div>
                    <div className="mt-2 text-xs text-[color:var(--color-brand-muted)]">{item.discussionCount} 条讨论</div>
                  </Link>
                ))
              ) : (
                <div className="border border-dashed border-[color:var(--color-brand-line)] px-3 py-4 text-sm leading-6 text-[color:var(--color-brand-muted)]">
                  当前标签下还没有进入讨论的方向。
                </div>
              )}
            </div>
          </div>
        </Surface>

        <div className="min-w-0 space-y-3">
          <Surface className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="editorial-kicker">Idea 孵化区</div>
                <div className="mt-2 text-2xl leading-tight">把点子变成能讨论的新产品想法</div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-brand-muted)]">
                  这儿不要零散想法。我们只收那些由两三个点子拼起来的、值得试一试的想法。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="min-w-[86px] border border-[color:var(--color-brand-line)] px-3 py-3">
                  <div className="text-lg">{filteredItems.length}</div>
                  <div className="mt-1 text-xs text-[color:var(--color-brand-muted)]">方向</div>
                </div>
                <div className="min-w-[86px] border border-[color:var(--color-brand-line)] px-3 py-3">
                  <div className="text-lg">{totalDiscussions}</div>
                  <div className="mt-1 text-xs text-[color:var(--color-brand-muted)]">讨论</div>
                </div>
                <div className="min-w-[86px] border border-[color:var(--color-brand-line)] px-3 py-3">
                  <div className="text-lg">{totalRooms}</div>
                  <div className="mt-1 text-xs text-[color:var(--color-brand-muted)]">房间</div>
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            {filteredItems.length ? (
              filteredItems.map((item) => <IncubationDirectoryRow key={item.id} incubation={item} />)
            ) : (
              <div className="px-4 py-8 text-sm leading-7 text-[color:var(--color-brand-muted)]">
                当前标签下还没有孵化项目，换个标签看看，或者先去点子实验室组合一个新方向。
              </div>
            )}
          </Surface>
        </div>

        <div className="space-y-3 lg:sticky lg:top-24">
          <Surface className="p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
              <PenSquare className="h-3.5 w-3.5" />
              发起新方向
            </div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              先去点子实验室选 2-3 个点子，再把它们放到这里，继续讨论和完善。
            </p>
            <Link
              to="/idea-blocks"
              className="mt-4 inline-flex items-center gap-2 border border-[color:var(--color-brand-ink)] bg-[color:var(--color-brand-ink)] px-4 py-2.5 text-sm text-white transition hover:opacity-90"
            >
              去点子实验室
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Surface>

          <Surface className="p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
              <MessageSquareDot className="h-3.5 w-3.5" />
              最近新增评论
            </div>
            <div className="mt-4 text-3xl leading-none">{totalDiscussions}</div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              当前筛选下已有 {filteredItems.length} 个方向正在被讨论。优先看讨论数更高的条目，通常更接近真实问题。
            </p>
          </Surface>

          <Surface className="p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
              <Flame className="h-3.5 w-3.5" />
              高热方向
            </div>
            <div className="mt-4 space-y-2">
              {hottestItems.length ? (
                hottestItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/incubations/${item.slug}`}
                    className="block border border-[color:var(--color-brand-line)] px-3 py-3 transition hover:border-[color:var(--color-brand-accent)] hover:bg-[#fcfdff]"
                  >
                    <div className="text-sm leading-6">{item.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--color-brand-muted)]">
                      <span>{item.discussionCount} 讨论</span>
                      <span>·</span>
                      <span>{item.blockCount} 点子</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="border border-dashed border-[color:var(--color-brand-line)] px-3 py-4 text-sm leading-6 text-[color:var(--color-brand-muted)]">
                  还没有足够热的方向，适合你来发第一轮判断。
                </div>
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
              <Lightbulb className="h-3.5 w-3.5" />
              这页怎么用
            </div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              先挑一个你认同或反对的方向，直接进入详情页留言。好的孵化页，通常不是点子最多，而是问题最具体。
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function IncubationDetailPage() {
  const { slug = '' } = useParams();
  const { data, loading, setData } = useAsyncData(() => getIncubationDetail(slug), [slug]);
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !data) return <LoadingState />;
  const incubationData = data;
  const milestoneItems = getIncubationMilestones({
    blockCount: incubationData.blocks.length,
    discussionCount: incubationData.discussions.length,
    roomCount: incubationData.rooms.length,
  });
  const progress = getIncubationProgress({
    blockCount: incubationData.blocks.length,
    discussionCount: incubationData.discussions.length,
    roomCount: incubationData.rooms.length,
  });
  const totalComments = incubationData.discussions.reduce((sum, discussion) => sum + (discussion.commentCount || discussion.comments.length), 0);

  async function handleCreateDiscussion(event: FormEvent) {
    event.preventDefault();
    if (!discussionTitle.trim() || !discussionContent.trim()) return;

    setBusy(true);
    setError(null);
    try {
      await createDiscussion({
        title: discussionTitle.trim(),
        targetType: 'INCUBATION',
        targetId: incubationData.id,
        authorName: '站内共创者',
        content: discussionContent.trim(),
      });
      const refreshed = await getIncubationDetail(slug);
      setData(refreshed);
      setDiscussionTitle('');
      setDiscussionContent('');
    } catch {
      setError('讨论创建失败。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="-mt-10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="min-w-0 space-y-3">
          <Surface className="p-5">
            <Link to="/incubations" className="editorial-meta editorial-link">
              Idea 孵化区
            </Link>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{incubationData.title}</h1>
            <p className="mt-4 text-base leading-7 text-[color:var(--color-brand-muted)]">{incubationData.oneLiner}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <MetricPill label="状态" value={getIncubationStatusLabel(incubationData.status)} />
              <MetricPill label="来源作品" value={incubationData.sourceProjects.length} />
              <MetricPill label="点子" value={incubationData.blocks.length} />
              <MetricPill label="讨论" value={incubationData.discussions.length} />
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="editorial-kicker">里程碑记录</div>
                <div className="mt-2 text-2xl leading-tight">让方向往前走，而不是只停在讨论区</div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-brand-muted)]">
                  当前进度 {progress.completed}/{progress.total}。这里记录这个方向已经做了哪些尝试，还卡在哪一步。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="min-w-[86px] border border-[color:var(--color-brand-line)] px-3 py-3">
                  <div className="text-lg">{progress.percent}%</div>
                  <div className="mt-1 text-xs text-[color:var(--color-brand-muted)]">进度</div>
                </div>
                <div className="min-w-[86px] border border-[color:var(--color-brand-line)] px-3 py-3">
                  <div className="text-lg">{totalComments}</div>
                  <div className="mt-1 text-xs text-[color:var(--color-brand-muted)]">留言</div>
                </div>
                <div className="min-w-[86px] border border-[color:var(--color-brand-line)] px-3 py-3">
                  <div className="text-lg">{incubationData.rooms.length}</div>
                  <div className="mt-1 text-xs text-[color:var(--color-brand-muted)]">房间</div>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-full bg-black/[0.05]">
              <div className="h-2 bg-[color:var(--color-brand-accent)] transition-all" style={{ width: `${progress.percent}%` }} />
            </div>

            <div className="mt-6 grid gap-3">
              {milestoneItems.map((item, index) => (
                <div key={item.title} className="grid gap-3 border border-[color:var(--color-brand-line)] px-4 py-4 sm:grid-cols-[32px_minmax(0,1fr)] sm:items-start">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border ${
                    item.done
                      ? 'border-[#bfd4f3] bg-[#eef5ff] text-[color:var(--color-brand-accent)]'
                      : 'border-[color:var(--color-brand-line)] bg-[#fafaf8] text-[color:var(--color-brand-muted)]'
                  }`}>
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : index === progress.completed ? <Target className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base">{item.title}</div>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${
                        item.done
                          ? 'bg-[#eef5ff] text-[color:var(--color-brand-accent)]'
                          : 'bg-[#f4f4f2] text-[color:var(--color-brand-muted)]'
                      }`}>
                        {item.done ? '已完成' : '进行中'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="editorial-kicker">组合它的点子模块</div>
            <div className="mt-4 grid gap-3">
              {incubationData.blocks.map((block) => (
                <div key={block.slug} className="border border-[color:var(--color-brand-line)] px-4 py-4">
                  <div className="editorial-meta">{getIdeaBlockTypeLabel(block.blockType)}</div>
                  <div className="mt-2 text-lg">{block.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{block.summary}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="text-3xl leading-none">评论</div>
            <div className="mt-5 flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1f2430] text-lg text-white">人</div>
              <div className="min-w-0 flex-1 space-y-4">
                <input
                  className="w-full border border-[color:var(--color-brand-line)] bg-white px-4 py-3 text-sm outline-none"
                  value={discussionTitle}
                  onChange={(event) => setDiscussionTitle(event.target.value)}
                  placeholder="输入一个讨论标题，例如：这个方向最先该试什么？"
                />
                <textarea
                  className="min-h-24 w-full border border-[color:var(--color-brand-line)] bg-white px-4 py-4 text-sm outline-none"
                  value={discussionContent}
                  onChange={(event) => setDiscussionContent(event.target.value)}
                  placeholder="写下你对这个孵化方向的判断、疑问、尝试方案或风险。"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-[color:var(--color-brand-muted)]">
                    当前孵化页也保留评论区，方便围绕一个方向持续记录进展。
                  </div>
                  <button
                    className="border border-[color:var(--color-brand-ink)] bg-[color:var(--color-brand-ink)] px-5 py-2.5 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
                    disabled={busy || !discussionTitle.trim() || !discussionContent.trim()}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleCreateDiscussion(event as unknown as FormEvent);
                    }}
                    type="button"
                  >
                    {busy ? '发布中…' : '发布'}
                  </button>
                </div>
                {error ? <div className="text-sm text-[#9a3f22]">{error}</div> : null}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="text-2xl">{incubationData.discussions.length} 条评论串</div>
              <div className="flex overflow-hidden border border-[color:var(--color-brand-line)] text-sm">
                <button className="bg-[#4f8de8] px-4 py-2 text-white" type="button">最新</button>
                <button className="px-4 py-2 text-[color:var(--color-brand-muted)]" type="button">热门</button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {incubationData.discussions.length ? (
                incubationData.discussions.map((discussion) => (
                  <div key={discussion.id} className="border-t border-[color:var(--color-brand-line)] pt-5 first:border-t-0 first:pt-0">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8e4f8] text-sm text-[color:var(--color-brand-accent)]">
                        {(discussion.createdBy || '匿').slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-lg">{discussion.createdBy || '匿名用户'}</div>
                          {discussion.lastActivityAt ? <div className="text-sm text-[color:var(--color-brand-muted)]">{formatRelativeDate(discussion.lastActivityAt)}</div> : null}
                        </div>
                        <div className="mt-2 text-sm text-[color:var(--color-brand-muted)]">话题：{discussion.title}</div>
                        {discussion.summary ? <p className="mt-3 text-base leading-7 text-[color:var(--color-brand-ink)]">{discussion.summary}</p> : null}
                        <div className="mt-4 space-y-3">
                          {discussion.comments.map((comment) => (
                            <div key={comment.id} className="bg-black/[0.03] px-4 py-3">
                              <div className="editorial-meta">{comment.authorName}</div>
                              <p className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-[color:var(--color-brand-line)] px-4 py-6 text-sm text-[color:var(--color-brand-muted)]">
                  还没有评论，适合你来发第一条问题。
                </div>
              )}
            </div>
          </Surface>
        </div>

        <div className="space-y-3 lg:sticky lg:top-24">
          <Surface className="p-5">
            <div className="editorial-kicker">当前判断</div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              <p>这是一个由多个机制组合出来的方向，不是单条讨论，也不是已经上线的作品。</p>
              <p>优先看来源作品和评论区，判断它现在缺的是用户反馈还是具体执行。</p>
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="editorial-kicker">当前目标</div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              <div className="flex items-start gap-3">
                <Flag className="mt-1 h-4 w-4 shrink-0 text-[color:var(--color-brand-accent)]" />
                <span>{getIncubationNextStep({
                  id: incubationData.id,
                  slug: incubationData.slug,
                  title: incubationData.title,
                  oneLiner: incubationData.oneLiner,
                  status: incubationData.status,
                  tags: [],
                  discussionCount: incubationData.discussions.length,
                  blockCount: incubationData.blocks.length,
                  roomCount: incubationData.rooms.length,
                })}</span>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquareDot className="mt-1 h-4 w-4 shrink-0 text-[color:var(--color-brand-accent)]" />
                <span>先把争议点讲清楚，再决定要不要进入更重的执行阶段。</span>
              </div>
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="editorial-kicker">来源作品</div>
            <div className="mt-4 space-y-2">
              {incubationData.sourceProjects.map((project) => (
                <Link key={project.slug} to={`/projects/${project.slug}`} className="block border border-[color:var(--color-brand-line)] px-3 py-3 text-sm text-[color:var(--color-brand-muted)] transition hover:text-[color:var(--color-brand-ink)]">
                  {project.name}
                </Link>
              ))}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="editorial-kicker">房间状态</div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              房间前期暂不开放。当前阶段先用评论区记录讨论和结论，等方向更稳定后再开放协作聊天。
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function RoomsPage() {
  return (
    <div className="-mt-10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Surface className="p-7">
          <div className="editorial-kicker">Rooms</div>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">房间前期暂不开放</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--color-brand-muted)]">
            房间最终会是一个只展示自己已加入会话的轻聊天室，但前期先不开放。现阶段交流都放在作品页和孵化页的评论区里。
          </p>
        </Surface>
        <Surface className="p-6">
          <div className="editorial-kicker">当前阶段</div>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
            <p>先把作品、点子、孵化这三层理顺，再开放执行层。</p>
            <p>房间开放后，只会展示你自己已经加入的会话，不做公开聊天室广场。</p>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function RoomDetailPage() {
  return (
    <div className="-mt-10">
      <Surface className="p-7">
        <div className="editorial-kicker">Room</div>
        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">当前房间入口未开放</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--color-brand-muted)]">
          房间后续会改造成只展示自己已加入的轻聊天室。现在先不开放单独的房间详情，相关交流全部放在作品和孵化详情页的评论区里。
        </p>
      </Surface>
    </div>
  );
}

function ProjectDetailPage() {
  const { slug = '' } = useParams();
  const { data, loading, setData } = useAsyncData(() => getProjectDetail(slug), [slug]);
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [selectedIdeaBlockId, setSelectedIdeaBlockId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const screenshotRailRef = useRef<HTMLDivElement | null>(null);

  if (loading || !data) return <LoadingState />;
  const selectedIdeaBlock = data.ideaBlocks.find((block) => block.id === selectedIdeaBlockId) ?? data.ideaBlocks[0] ?? null;

  async function handleDiscussionSubmit(event: FormEvent) {
    event.preventDefault();
    if (!data || !discussionContent.trim()) return;

    const resolvedTitle = discussionTitle.trim() || discussionContent.trim().slice(0, 28);

    setSubmitting(true);
    setSubmissionError(null);
    try {
      const created = await createDiscussion({
        title: resolvedTitle,
        targetType: 'PROJECT',
        targetId: data.id,
        authorName: '站内共创者',
        content: discussionContent.trim(),
      });

      setData((current) =>
        current
          ? {
              ...current,
              discussions: [created, ...current.discussions],
            }
          : current,
      );
      setDiscussionTitle('');
      setDiscussionContent('');
    } catch (requestError) {
      setSubmissionError('当前后端不可用，讨论已在本地模式下保留页面结构。');
    } finally {
      setSubmitting(false);
    }
  }

  function scrollScreenshots(direction: 'left' | 'right') {
    const rail = screenshotRailRef.current;
    if (!rail) return;
    const amount = Math.max(rail.clientWidth * 0.82, 280);
    rail.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
  }

  return (
    <div className="-mt-10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="min-w-0 space-y-3">
          <Surface className="p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex min-w-0 gap-4">
                <ProjectIcon slug={data.slug} name={data.name} className="h-22 w-22" />
                <div className="min-w-0">
                  <Link to="/projects" className="editorial-meta editorial-link">
                    作品库
                  </Link>
                  <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{data.name}</h1>
                  <p className="mt-3 text-base leading-7 text-[color:var(--color-brand-muted)]">{data.tagline}</p>
                </div>
              </div>
              <div className="hidden shrink-0 border-l border-[color:var(--color-brand-line)] pl-5 lg:block">
                <div className="text-sm text-[color:var(--color-brand-muted)]">研究评分</div>
                <div className="mt-2 text-5xl leading-none">{Math.min(10, Math.max(6, Math.round(data.heatScore / 10) + 2))}.0</div>
                <div className="mt-2 text-sm text-[color:var(--color-brand-accent)]">{data.discussions.length} 个话题</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-[color:var(--color-brand-line)] pt-5 sm:grid-cols-5">
              <div>
                <div className="text-3xl">{data.heatScore}</div>
                <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">热度</div>
              </div>
              <div>
                <div className="text-3xl">{data.overview.metrics.discussionCount}</div>
                <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">讨论</div>
              </div>
              <div>
                <div className="text-3xl">{data.overview.metrics.ideaBlockCount}</div>
                <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">点子</div>
              </div>
              <div>
                <div className="text-3xl">{data.overview.metrics.incubationCount}</div>
                <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">孵化</div>
              </div>
              <div>
                <div className="text-3xl">{data.overview.metrics.roomCount}</div>
                <div className="mt-1 text-sm text-[color:var(--color-brand-muted)]">房间</div>
              </div>
            </div>
          </Surface>

          <Surface className="sticky top-18 z-20 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <a href="#overview" className="px-3.5 py-2 text-[color:var(--color-brand-muted)] transition hover:bg-black/[0.02] hover:text-[color:var(--color-brand-ink)]">概览</a>
              <Link to={`/projects/${data.slug}/teardown`} className="px-3.5 py-2 text-[color:var(--color-brand-muted)] transition hover:bg-black/[0.02] hover:text-[color:var(--color-brand-ink)]">拆解</Link>
              <a href="#idea-blocks" className="px-3.5 py-2 text-[color:var(--color-brand-muted)] transition hover:bg-black/[0.02] hover:text-[color:var(--color-brand-ink)]">点子</a>
              <a href="#discussions" className="px-3.5 py-2 text-[color:var(--color-brand-muted)] transition hover:bg-black/[0.02] hover:text-[color:var(--color-brand-ink)]">讨论</a>
            </div>
          </Surface>

          <Surface id="overview" className="p-5">
            <div className="editorial-kicker">概览</div>
            <p className="mt-4 text-base leading-8 text-[color:var(--color-brand-ink)]">{data.overview.saveTimeLabel}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="border-l-2 border-[color:var(--color-brand-line)] pl-4 text-sm leading-7 text-[color:var(--color-brand-ink)]">它成立的核心不是记录，而是把动作转成可累计结果。</div>
              <div className="border-l-2 border-[color:var(--color-brand-line)] pl-4 text-sm leading-7 text-[color:var(--color-brand-ink)]">最强体验瞬间发生在动作完成后即时看到反馈的那一刻。</div>
              <div className="border-l-2 border-[color:var(--color-brand-line)] pl-4 text-sm leading-7 text-[color:var(--color-brand-ink)]">传播点来自反差和可比较性，而不是工具效率本身。</div>
            </div>
            <dl className="mt-6 grid gap-4 border-t border-[color:var(--color-brand-line)] pt-5 md:grid-cols-2">
              <div>
                <dt className="editorial-meta">核心用户</dt>
                <dd className="mt-2 text-sm leading-7 text-[color:var(--color-brand-muted)]">{data.overview.targetPersona}</dd>
              </div>
              <div>
                <dt className="editorial-meta">钩子角度</dt>
                <dd className="mt-2 text-sm leading-7 text-[color:var(--color-brand-muted)]">{data.overview.hookAngle}</dd>
              </div>
            </dl>
          </Surface>

          <Surface className="p-5">
            <div className="editorial-kicker">官方介绍</div>
            <div className="mt-4 space-y-4 text-base leading-8 text-[color:var(--color-brand-ink)]">
              <p>{data.tagline}</p>
              <p className="text-[color:var(--color-brand-muted)]">
                {data.name} 面向 {data.overview.targetPersona}，核心切入点是“{data.overview.hookAngle}”。当前页面展示的是官方信息和站内研究内容的组合视图。
              </p>
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="editorial-kicker">作品截图</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollScreenshots('left')}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-surface)] text-[color:var(--color-brand-muted)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
                  aria-label="向左查看截图"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => scrollScreenshots('right')}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-surface)] text-[color:var(--color-brand-muted)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]"
                  aria-label="向右查看截图"
                >
                  →
                </button>
              </div>
            </div>
            <div
              ref={screenshotRailRef}
              className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
            >
              {data.screenshotUrls.length ? (
                data.screenshotUrls.map((item, index) =>
                  looksLikeImageUrl(item) ? (
                    <a
                      key={`${item}-${index}`}
                      href={item}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-[240px] shrink-0 snap-start overflow-hidden border border-[color:var(--color-brand-line)] bg-[#f6f6f6] p-3 transition hover:border-[color:var(--color-brand-accent)] md:w-[260px] xl:w-[280px]"
                    >
                      <img alt={`${data.name} 截图 ${index + 1}`} className="h-[420px] w-full object-contain" src={item} />
                    </a>
                  ) : (
                    <a
                      key={`${item}-${index}`}
                      href={item}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-40 w-[240px] shrink-0 snap-start items-end border border-[color:var(--color-brand-line)] bg-[#f8f8f8] p-4 transition hover:bg-white md:w-[260px] xl:w-[280px]"
                    >
                      <div>
                        <div className="editorial-meta">Screenshot Source</div>
                        <div className="mt-2 text-lg">查看官方截图或下载页</div>
                        <div className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{item}</div>
                      </div>
                    </a>
                  ),
                )
              ) : (
                <div className="border border-dashed border-[color:var(--color-brand-line)] px-4 py-8 text-sm text-[color:var(--color-brand-muted)]">
                  暂无截图，后续可由管理员补充官方视觉素材。
                </div>
              )}
            </div>
          </Surface>

          <Surface id="idea-blocks" className="p-5">
            <div className="editorial-kicker">点子</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {data.ideaBlocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setSelectedIdeaBlockId(block.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selectedIdeaBlock?.id === block.id
                      ? 'border-[color:var(--color-brand-accent)] bg-[#eef4fb] text-[color:var(--color-brand-accent)]'
                      : 'border-[color:var(--color-brand-line)] bg-[#f3f5f8] text-[color:var(--color-brand-accent)] hover:border-[color:var(--color-brand-accent)] hover:bg-white'
                  }`}
                >
                  {block.title}
                </button>
              ))}
            </div>
            {selectedIdeaBlock ? (
              <div className="mt-4 border border-[color:var(--color-brand-line)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="editorial-meta">{getIdeaBlockTypeLabel(selectedIdeaBlock.blockType)}</div>
                    <div className="mt-2 text-xl">{selectedIdeaBlock.title}</div>
                  </div>
                  <Link to="/idea-blocks" className="border border-[color:var(--color-brand-line)] px-3 py-2 text-sm text-[color:var(--color-brand-ink)] transition hover:border-[color:var(--color-brand-accent)] hover:text-[color:var(--color-brand-accent)]">
                    进入点子实验室
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-brand-muted)]">{selectedIdeaBlock.summary}</p>
                {selectedIdeaBlock.noveltyNote ? <p className="mt-3 border-l-2 border-[color:var(--color-brand-line)] pl-4 text-sm leading-7 text-[color:var(--color-brand-ink)]">{selectedIdeaBlock.noveltyNote}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedIdeaBlock.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[color:var(--color-brand-line)] px-3 py-1 text-xs text-[color:var(--color-brand-muted)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 border-t border-[color:var(--color-brand-line)] pt-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              点子可跨作品与孵化复用，由管理员维护。
            </div>
          </Surface>

          <Surface id="discussions" className="p-5">
            <div className="text-3xl leading-none">评论</div>
            <div className="mt-5 flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1f2430] text-lg text-white">人</div>
              <div className="min-w-0 flex-1 space-y-4">
                <textarea
                  className="min-h-24 w-full border border-[color:var(--color-brand-line)] bg-white px-4 py-4 text-sm outline-none"
                  value={discussionContent}
                  onChange={(event) => setDiscussionContent(event.target.value)}
                  placeholder="写下你的评论：分享这个作品的使用体验、优点/吐槽、适用场景、惊艳之处……"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-sm text-[color:var(--color-brand-muted)]">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="experience" defaultChecked />
                      <span>没用过</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="experience" />
                      <span>用过</span>
                    </label>
                  </div>
                  <button
                    className="border border-[color:var(--color-brand-ink)] bg-[color:var(--color-brand-ink)] px-5 py-2.5 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
                    disabled={submitting || !discussionContent.trim()}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDiscussionSubmit(event as unknown as FormEvent);
                    }}
                    type="button"
                  >
                    {submitting ? '发布中…' : '发布'}
                  </button>
                </div>
                {submissionError ? <div className="text-sm text-[#9a3f22]">{submissionError}</div> : null}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="text-2xl">{data.discussions.length} 条精选评论</div>
              <div className="flex overflow-hidden border border-[color:var(--color-brand-line)] text-sm">
                <button className="bg-[#4f8de8] px-4 py-2 text-white" type="button">最新</button>
                <button className="px-4 py-2 text-[color:var(--color-brand-muted)]" type="button">热门</button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {data.discussions.map((discussion) => (
                <div key={discussion.id} className="border-t border-[color:var(--color-brand-line)] pt-5 first:border-t-0 first:pt-0">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8e4f8] text-sm text-[color:var(--color-brand-accent)]">
                      {(discussion.createdBy || '匿').slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg">{discussion.createdBy || '匿名用户'}</div>
                        <div className="text-sm text-[color:var(--color-brand-muted)]">{formatRelativeDate(discussion.lastActivityAt)}</div>
                      </div>
                      <div className="mt-2 text-sm text-[color:var(--color-brand-muted)]">话题：{discussion.title}</div>
                      {discussion.summary ? <p className="mt-3 text-base leading-7 text-[color:var(--color-brand-ink)]">{discussion.summary}</p> : null}
                      <div className="mt-4 space-y-3">
                        {discussion.comments.map((comment) => (
                          <div key={comment.id} className="bg-black/[0.03] px-4 py-3">
                            <div className="editorial-meta">{comment.authorName}</div>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="space-y-3 lg:sticky lg:top-24">
          <Surface className="p-5">
            <div className="editorial-kicker">孵化产物</div>
            <div className="mt-4 space-y-3">
              {data.incubations.length ? (
                data.incubations.map((incubation) => (
                  <Link key={incubation.id} to={`/incubations/${incubation.slug}`} className="block border border-[color:var(--color-brand-line)] px-4 py-4 transition hover:bg-black/[0.015]">
                    <div className="text-base">{incubation.title}</div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{incubation.oneLiner}</p>
                    <div className="mt-3 text-xs text-[color:var(--color-brand-muted)]">{incubation.blockCount} 个点子 · {incubation.discussionCount} 条讨论</div>
                  </Link>
                ))
              ) : (
                <div className="border border-dashed border-[color:var(--color-brand-line)] px-4 py-6 text-sm text-[color:var(--color-brand-muted)]">还没有新的孵化产物。</div>
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="editorial-kicker">房间状态</div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              房间前期暂不开放。当前阶段先用评论区记录讨论和结论，后续再开放仅对已加入成员可见的聊天室。
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function ProjectTeardownPage() {
  const { slug = '' } = useParams();
  const { data, loading } = useAsyncData(() => getProjectDetail(slug), [slug]);

  if (loading || !data) return <LoadingState />;

  return (
    <div className="-mt-10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="min-w-0 space-y-3">
          <Surface className="p-5">
            <Link to={`/projects/${data.slug}`} className="editorial-meta editorial-link">
              返回作品详情
            </Link>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{data.name} · 拆解</h1>
            <p className="mt-4 text-base leading-7 text-[color:var(--color-brand-muted)]">{data.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <MetricPill label="分类" value={data.category} />
              <MetricPill label="热度" value={data.heatScore} />
              <MetricPill label="讨论" value={data.overview.metrics.discussionCount} />
              <MetricPill label="点子" value={data.overview.metrics.ideaBlockCount} />
            </div>
            <p className="mt-5 border-t border-[color:var(--color-brand-line)] pt-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">
              拆解页保留作品基础信息和评论上下文，只把结构化研究内容单独拿出来深读。
            </p>
          </Surface>

          <Surface className="p-5">
            {data.teardown ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['痛点摘要', data.teardown.painSummary],
                  ['触发场景', data.teardown.triggerScene],
                  ['核心承诺', data.teardown.corePromise],
                  ['核心循环', data.teardown.coreLoop],
                  ['冷启动', data.teardown.coldStartStrategy],
                  ['变现逻辑', data.teardown.pricingLogic],
                  ['竞争差异', data.teardown.competitorDelta],
                  ['风险备注', data.teardown.riskNotes],
                ].map(([label, value]) => (
                  <div key={label} className="border border-[color:var(--color-brand-line)] p-4">
                    <div className="editorial-meta">{label}</div>
                    <div className="mt-3 text-sm leading-6 text-[color:var(--color-brand-muted)]">{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[color:var(--color-brand-muted)]">暂无拆解。</div>
            )}
          </Surface>

          <Surface className="p-5">
            <div className="text-3xl leading-none">评论</div>
            <div className="mt-6 space-y-5">
              {data.discussions.map((discussion) => (
                <div key={discussion.id} className="border-t border-[color:var(--color-brand-line)] pt-5 first:border-t-0 first:pt-0">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8e4f8] text-sm text-[color:var(--color-brand-accent)]">
                      {(discussion.createdBy || '匿').slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg">{discussion.createdBy || '匿名用户'}</div>
                        <div className="text-sm text-[color:var(--color-brand-muted)]">{formatRelativeDate(discussion.lastActivityAt)}</div>
                      </div>
                      <div className="mt-2 text-sm text-[color:var(--color-brand-muted)]">话题：{discussion.title}</div>
                      {discussion.summary ? <p className="mt-3 text-base leading-7 text-[color:var(--color-brand-ink)]">{discussion.summary}</p> : null}
                      <div className="mt-4 space-y-3">
                        {discussion.comments.map((comment) => (
                          <div key={comment.id} className="bg-black/[0.03] px-4 py-3">
                            <div className="editorial-meta">{comment.authorName}</div>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--color-brand-muted)]">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="space-y-3 lg:sticky lg:top-24">
          <Surface className="p-5">
            <div className="editorial-kicker">拆解说明</div>
            <p className="mt-4 text-sm leading-7 text-[color:var(--color-brand-muted)]">这里保留结构化研究项，适合深读和后续扩展成更完整的研究模板。</p>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function AdminRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <AdminPage />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="/*" element={
          <Shell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectDetailPage />} />
              <Route path="/projects/:slug/teardown" element={<ProjectTeardownPage />} />
              <Route path="/discussions" element={<Navigate to="/projects" replace />} />
              <Route path="/idea-blocks" element={<IdeaBlocksPage />} />
              <Route path="/incubations" element={<IncubationsPage />} />
              <Route path="/incubations/:slug" element={<IncubationDetailPage />} />
              <Route path="/compose" element={<Navigate to="/idea-blocks" replace />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/rooms/:slug" element={<RoomDetailPage />} />
            </Routes>
          </Shell>
        } />
      </Routes>
    </BrowserRouter>
  );
}
