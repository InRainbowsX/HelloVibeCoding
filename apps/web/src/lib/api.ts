const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface ProjectListItem {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  category: string;
  pricing: string;
  heatScore: number;
  discussionCount: number;
  ideaBlockCount: number;
  incubationCount: number;
  roomCount: number;
  createdAt: string;
}

export interface DiscussionComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface DiscussionThread {
  id: string;
  title: string;
  summary?: string | null;
  createdBy?: string | null;
  likesCount: number;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
  comments: DiscussionComment[];
}

export interface IdeaBlock {
  id: string;
  slug: string;
  title: string;
  summary: string;
  blockType: string;
  tags: string[];
  noveltyNote?: string | null;
  sourceProjects: Array<{ slug: string; name: string }>;
  incubationCount?: number;
}

export interface IncubationListItem {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  status: string;
  tags: string[];
  discussionCount: number;
  blockCount: number;
  roomCount: number;
  sourceProjectCount?: number;
}

export interface IncubationDetail {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  status: string;
  sourceProjects: Array<{ slug: string; name: string }>;
  blocks: Array<{
    slug: string;
    title: string;
    summary: string;
    blockType: string;
  }>;
  discussions: Array<{
    id: string;
    title: string;
    createdBy?: string | null;
    summary?: string | null;
    commentCount: number;
    lastActivityAt?: string;
    comments: DiscussionComment[];
  }>;
  rooms: Array<{
    id: string;
    slug: string;
    name: string;
    goal: string;
  }>;
}

export interface RoomListItem {
  id: string;
  slug: string;
  name: string;
  goal: string;
  status: string;
  targetType: string;
  target: { slug: string; name: string } | null;
  memberCount: number;
  latestMessage: string | null;
}

export interface RoomDetail {
  id: string;
  slug: string;
  name: string;
  goal: string;
  status: string;
  targetType: string;
  target: { slug: string; name: string } | null;
  memberCount: number;
  messages: Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
  }>;
}

export interface ProjectDetail {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  category: string;
  pricing: string;
  heatScore: number;
  screenshotUrls: string[];
  overview: {
    saveTimeLabel: string;
    targetPersona: string;
    hookAngle: string;
    trustSignals: string[];
    metrics: {
      discussionCount: number;
      ideaBlockCount: number;
      incubationCount: number;
      roomCount: number;
    };
  };
  teardown: {
    painSummary: string;
    painScore: string;
    triggerScene: string;
    corePromise: string;
    coreLoop: string;
    keyConstraints: string[];
    mvpScope: string;
    coldStartStrategy: string;
    pricingLogic: string;
    competitorDelta: string;
    riskNotes: string;
    expansionSteps: string[];
    reverseIdeas: string[];
  } | null;
  buildAssets?: {
    hasAgentsTemplate: boolean;
    hasSpecTemplate: boolean;
    hasPromptPack: boolean;
  } | null;
  discussions: DiscussionThread[];
  ideaBlocks: IdeaBlock[];
  incubations: Array<IncubationListItem & { blocks: Array<{ id: string; slug: string; title: string }> }>;
  rooms: Array<{
    id: string;
    slug: string;
    name: string;
    goal: string;
    status: string;
    memberCount: number;
    latestMessage: string | null;
  }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface CreateDiscussionPayload {
  title: string;
  targetType: 'PROJECT' | 'INCUBATION';
  targetId: string;
  authorName: string;
  content: string;
}

export interface CreateIncubationPayload {
  slug: string;
  title: string;
  oneLiner: string;
  createdBy: string;
  blockSlugs: string[];
  sourceProjectSlugs: string[];
}

export interface CreateRoomPayload {
  slug: string;
  name: string;
  goal: string;
  targetType: 'PROJECT' | 'INCUBATION';
  targetId: string;
  createdBy: string;
}

export interface CreateRoomMessagePayload {
  userId: string;
  userName: string;
  content: string;
}

export interface IdeaProductRecommendation {
  title: string;
  summary: string;
}

const fallbackProjectDetail: ProjectDetail = {
  id: 'project-poop-map',
  slug: 'poop-map',
  name: 'Poop Map',
  tagline: '把上厕所变成一张个人地图战绩。',
  category: '居家生活',
  pricing: 'USAGE_BASED',
  heatScore: 82,
  screenshotUrls: ['https://play.google.com/store/apps/details?id=net.poopmap'],
  overview: {
    saveTimeLabel: '用一个按钮记录私密小事，并立刻转成可分享的战绩。',
    targetPersona: '喜欢反差梗、爱记录和愿意分享的小圈子用户',
    hookAngle: '把私密行为包装成可收集、可比较的地图战绩。',
    trustSignals: ['可在线体验'],
    metrics: {
      discussionCount: 2,
      ideaBlockCount: 3,
      incubationCount: 1,
      roomCount: 1,
    },
  },
  teardown: {
    painSummary: '原本私密且无聊的动作，没有被游戏化和社交化的表达方式。',
    painScore: '高频 / 低门槛 / 高传播',
    triggerScene: '用户想把一件尴尬小事变得好笑又可分享。',
    corePromise: '一键打点，把私密行为变成公开可炫耀的地图战绩。',
    coreLoop: '发生行为 -> 一键记录 -> 战绩增长 -> 分享或围观好友 -> 下次继续打点。',
    keyConstraints: ['极简记录', '即时反馈', '反差传播'],
    mvpScope: '地图打点、战绩统计、简单分享。',
    coldStartStrategy: '靠反差梗和社交传播引爆首批用户。',
    pricingLogic: '广告 + 内购的轻量化变现。',
    competitorDelta: '不是健康工具，而是地图战绩和反差社交。',
    riskNotes: '题材反差强，审核和平台敏感度高。',
    expansionSteps: ['好友关注', '点赞提醒', '挑战榜'],
    reverseIdeas: ['身体状态打点', '城市收集挑战', '反差轻社交'],
  },
  buildAssets: {
    hasAgentsTemplate: true,
    hasSpecTemplate: true,
    hasPromptPack: false,
  },
  discussions: [
    {
      id: 'thread-poop-1',
      title: 'Poop Map 真正抓人的不是厕所，而是战绩收集吗？',
      summary: '讨论它的核心到底是反差题材，还是即时反馈和地图收集。',
      createdBy: 'Ming',
      likesCount: 12,
      replyCount: 3,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: 'comment-poop-1',
          authorName: 'Ming',
          content: '我更看重战绩累计和地图反馈，题材只是让人点开第一下。',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ],
  ideaBlocks: [
    {
      id: 'block-1',
      slug: 'private-behavior-map',
      title: '私密行为 x 地图打点',
      summary: '把原本不会被公开表达的小动作，变成能被标记和回看的地图记录。',
      blockType: 'FORMULA',
      tags: ['地图', '记录', '反差'],
      noveltyNote: '核心不是记录，而是包装成可观察结果。',
      sourceProjects: [{ slug: 'poop-map', name: 'Poop Map' }],
      incubationCount: 1,
    },
    {
      id: 'block-2',
      slug: 'instant-score-feedback',
      title: '记录动作立即变战绩反馈',
      summary: '用户动作完成后立刻看到累计结果，让人想继续收集。',
      blockType: 'FEATURE',
      tags: ['反馈', '战绩'],
      noveltyNote: '即时反馈比复杂统计更容易制造上头瞬间。',
      sourceProjects: [{ slug: 'poop-map', name: 'Poop Map' }],
      incubationCount: 2,
    },
  ],
  incubations: [
    {
      id: 'inc-1',
      slug: 'slack-off-map',
      title: '摸鱼战绩地图',
      oneLiner: '把上班偷闲、散步和咖啡出逃做成可记录、可比较的职场生存战绩。',
      status: 'VALIDATING',
      tags: ['地图', '职场', '挑战'],
      discussionCount: 1,
      blockCount: 3,
      roomCount: 1,
      blocks: [
        { id: 'block-1', slug: 'private-behavior-map', title: '私密行为 x 地图打点' },
        { id: 'block-2', slug: 'instant-score-feedback', title: '记录动作立即变战绩反馈' },
      ],
    },
  ],
  rooms: [
    {
      id: 'room-1',
      slug: 'slack-off-map-v0',
      name: '摸鱼战绩地图 v0',
      goal: '先试试记录动作、地图展示和轻排行能不能跑通。',
      status: 'OPEN',
      memberCount: 3,
      latestMessage: '先把首页和记录动作压到一屏。',
    },
  ],
};

const fallbackProjects: ProjectListItem[] = [
  {
    id: fallbackProjectDetail.id,
    slug: fallbackProjectDetail.slug,
    name: fallbackProjectDetail.name,
    tagline: fallbackProjectDetail.tagline,
    category: fallbackProjectDetail.category,
    pricing: fallbackProjectDetail.pricing,
    heatScore: fallbackProjectDetail.heatScore,
    discussionCount: fallbackProjectDetail.overview.metrics.discussionCount,
    ideaBlockCount: fallbackProjectDetail.overview.metrics.ideaBlockCount,
    incubationCount: fallbackProjectDetail.overview.metrics.incubationCount,
    roomCount: fallbackProjectDetail.overview.metrics.roomCount,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'project-countdown',
    slug: 'countdown-reminders-and-timer',
    name: 'Countdown! Reminders and Timer',
    tagline: '把重要日子做成锁屏和桌面的倒计时墙。',
    category: '职场',
    pricing: 'PAID',
    heatScore: 68,
    discussionCount: 1,
    ideaBlockCount: 2,
    incubationCount: 1,
    roomCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'project-atvtools',
    slug: 'atvtools',
    name: 'atvTools',
    tagline: '把 ADB 工具箱装进手机，用 iPhone 管 Android TV。',
    category: '居家生活',
    pricing: 'PAID',
    heatScore: 57,
    discussionCount: 0,
    ideaBlockCount: 1,
    incubationCount: 0,
    roomCount: 1,
    createdAt: new Date().toISOString(),
  },
];

const fallbackIdeaBlocks: IdeaBlock[] = [
  ...fallbackProjectDetail.ideaBlocks,
  {
    id: 'block-3',
    slug: 'system-surface-exposure',
    title: '把结果前移到系统入口',
    summary: '不用打开 App 就能看到结果，直接把关键信息放到锁屏和桌面。',
    blockType: 'WORKFLOW',
    tags: ['锁屏', '组件', '高频曝光'],
    noveltyNote: '入口被前移后，产品从工具变成日常背景层。',
    sourceProjects: [{ slug: 'countdown-reminders-and-timer', name: 'Countdown! Reminders and Timer' }],
    incubationCount: 1,
  },
];

const fallbackIncubations: IncubationListItem[] = [
  {
    id: 'inc-1',
    slug: 'slack-off-map',
    title: '摸鱼战绩地图',
    oneLiner: '把上班偷闲、散步和咖啡出逃做成可记录、可比较的职场生存战绩。',
    status: 'VALIDATING',
    tags: ['地图', '职场', '挑战'],
    discussionCount: 1,
    blockCount: 3,
    roomCount: 1,
    sourceProjectCount: 1,
  },
  {
    id: 'inc-2',
    slug: 'meeting-countdown-wall',
    title: '会议倒计时墙',
    oneLiner: '把会议倒计时放到锁屏和桌面，减少会议拖延。',
    status: 'OPEN',
    tags: ['锁屏', '会议', '倒计时'],
    discussionCount: 0,
    blockCount: 2,
    roomCount: 0,
    sourceProjectCount: 2,
  },
];

const fallbackIncubationDetails: IncubationDetail[] = [
  {
    id: 'inc-1',
    slug: 'slack-off-map',
    title: '摸鱼战绩地图',
    oneLiner: '把上班偷闲、散步和咖啡出逃做成可记录、可比较的职场生存战绩。',
    status: 'VALIDATING',
    sourceProjects: [{ slug: 'poop-map', name: 'Poop Map' }],
    blocks: [
      {
        slug: 'private-behavior-map',
        title: '私密行为 x 地图打点',
        summary: '把原本不会被公开表达的小动作，变成能被标记和回看的地图记录。',
        blockType: 'FORMULA',
      },
      {
        slug: 'instant-score-feedback',
        title: '记录动作立即变战绩反馈',
        summary: '用户动作完成后立刻看到累计结果，让人想继续收集。',
        blockType: 'FEATURE',
      },
      {
        slug: 'light-challenge-loop',
        title: '轻挑战排行榜',
        summary: '用次数、排行榜和轻量比较形成持续回来看的理由。',
        blockType: 'CHANNEL',
      },
    ],
    discussions: [
      {
        id: 'thread-2',
        title: '摸鱼战绩地图会不会比 Poop Map 更容易本土传播？',
        createdBy: 'Aria',
        summary: '围绕一个孵化方向讨论场景接受度和表达方式。',
        commentCount: 2,
        lastActivityAt: new Date().toISOString(),
        comments: [
          {
            id: 'inc-comment-1',
            authorName: 'Aria',
            content: '这个方向比原始题材更容易让普通人理解，也更容易做本土化包装。',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'inc-comment-2',
            authorName: 'Ming',
            content: '先别急着做排行，试试记录动作和地图反馈本身能不能成立。',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ],
    rooms: [
      {
        id: 'room-1',
        slug: 'slack-off-map-v0',
        name: '摸鱼战绩地图 v0',
        goal: '先试试记录动作、地图展示和轻排行能不能跑通。',
      },
    ],
  },
  {
    id: 'inc-2',
    slug: 'meeting-countdown-wall',
    title: '会议倒计时墙',
    oneLiner: '把会议倒计时放到锁屏和桌面，减少会议拖延。',
    status: 'OPEN',
    sourceProjects: [
      { slug: 'countdown-reminders-and-timer', name: 'Countdown! Reminders and Timer' },
      { slug: 'liteschedule', name: 'LiteSchedule' },
    ],
    blocks: [
      {
        slug: 'system-surface-exposure',
        title: '把结果前移到系统入口',
        summary: '不用打开 App 就能看到结果，直接把关键信息放到锁屏和桌面。',
        blockType: 'WORKFLOW',
      },
      {
        slug: 'instant-score-feedback',
        title: '记录动作立即变战绩反馈',
        summary: '用户动作完成后立刻看到累计结果，让人想继续收集。',
        blockType: 'FEATURE',
      },
    ],
    discussions: [],
    rooms: [],
  },
];

const fallbackRooms: RoomListItem[] = [
  {
    id: 'room-1',
    slug: 'slack-off-map-v0',
    name: '摸鱼战绩地图 v0',
    goal: '先试试记录动作、地图展示和轻排行能不能跑通。',
    status: 'OPEN',
    targetType: 'INCUBATION',
    target: { slug: 'slack-off-map', name: '摸鱼战绩地图' },
    memberCount: 3,
    latestMessage: '先把首页和记录动作压到一屏。',
  },
  {
    id: 'room-2',
    slug: 'tv-helper-lite',
    name: '更轻的电视助手',
    goal: '把常用的五个电视维护功能做成一屏按钮，让第一次用的人也能上手。',
    status: 'OPEN',
    targetType: 'PROJECT',
    target: { slug: 'atvtools', name: 'atvTools' },
    memberCount: 2,
    latestMessage: '首次配对引导还需要更简单。',
  },
];

const fallbackRoomDetails: RoomDetail[] = [
  {
    id: 'room-1',
    slug: 'slack-off-map-v0',
    name: '摸鱼战绩地图 v0',
    goal: '先试试记录动作、地图展示和轻排行能不能跑通。',
    status: 'OPEN',
    targetType: 'INCUBATION',
    target: { slug: 'slack-off-map', name: '摸鱼战绩地图' },
    memberCount: 3,
    messages: [
      {
        id: 'room-msg-1',
        userId: 'owner',
        userName: 'Aria',
        content: '先把首页和记录动作压到一屏。',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'room-2',
    slug: 'tv-helper-lite',
    name: '更轻的电视助手',
    goal: '把常用的五个电视维护功能做成一屏按钮，让第一次用的人也能上手。',
    status: 'OPEN',
    targetType: 'PROJECT',
    target: { slug: 'atvtools', name: 'atvTools' },
    memberCount: 2,
    messages: [
      {
        id: 'room-msg-2',
        userId: 'owner',
        userName: 'Ming',
        content: '首次配对引导还需要更简单。',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

const fallbackDiscussions: PaginatedResult<DiscussionThread & { target?: { slug: string; name: string } | null; targetType?: string }> = {
  items: [
    {
      ...fallbackProjectDetail.discussions[0],
      targetType: 'PROJECT',
      target: { slug: 'poop-map', name: 'Poop Map' },
    },
    {
      id: 'thread-2',
      title: '摸鱼战绩地图会不会比 Poop Map 更容易本土传播？',
      summary: '围绕一个孵化方向讨论场景接受度和表达方式。',
      createdBy: 'Aria',
      likesCount: 5,
      replyCount: 2,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      comments: [],
      targetType: 'INCUBATION',
      target: { slug: 'slack-off-map', name: '摸鱼战绩地图' },
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function withFallback<T>(requester: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await requester();
  } catch {
    return fallback;
  }
}

export function getProjects() {
  return withFallback(() => requestJson<PaginatedResult<ProjectListItem>>('/projects?page=1&pageSize=24'), {
    items: fallbackProjects,
    total: fallbackProjects.length,
    page: 1,
    pageSize: 24,
  });
}

export function getProjectDetail(slug: string) {
  if (slug === fallbackProjectDetail.slug) {
    return withFallback(() => requestJson<ProjectDetail>(`/projects/${slug}`), fallbackProjectDetail);
  }

  const project = fallbackProjects.find((item) => item.slug === slug);
  const fallback = project
    ? {
        ...fallbackProjectDetail,
        id: project.id,
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        category: project.category,
        pricing: project.pricing,
        heatScore: project.heatScore,
        overview: {
          ...fallbackProjectDetail.overview,
          metrics: {
            discussionCount: project.discussionCount,
            ideaBlockCount: project.ideaBlockCount,
            incubationCount: project.incubationCount,
            roomCount: project.roomCount,
          },
        },
      }
    : fallbackProjectDetail;

  return withFallback(() => requestJson<ProjectDetail>(`/projects/${slug}`), fallback);
}

export function getDiscussions() {
  return withFallback(
    () =>
      requestJson<PaginatedResult<DiscussionThread & { target?: { slug: string; name: string } | null; targetType?: string }>>(
        '/discussions?page=1&pageSize=20',
      ),
    fallbackDiscussions,
  );
}

export function getIdeaBlocks() {
  return withFallback(() => requestJson<PaginatedResult<IdeaBlock>>('/idea-blocks?page=1&pageSize=24'), {
    items: fallbackIdeaBlocks,
    total: fallbackIdeaBlocks.length,
    page: 1,
    pageSize: 24,
  });
}

export function getIncubations() {
  return withFallback(() => requestJson<PaginatedResult<IncubationListItem>>('/incubations?page=1&pageSize=24'), {
    items: fallbackIncubations,
    total: fallbackIncubations.length,
    page: 1,
    pageSize: 24,
  });
}

export function getIncubationDetail(slug: string) {
  const fallback = fallbackIncubationDetails.find((item) => item.slug === slug) || fallbackIncubationDetails[0];
  return withFallback(() => requestJson<IncubationDetail>(`/incubations/${slug}`), fallback);
}

export function getRooms() {
  return withFallback(() => requestJson<{ items: RoomListItem[]; total: number }>('/rooms'), {
    items: fallbackRooms,
    total: fallbackRooms.length,
  });
}

export function getRoomDetail(slug: string) {
  const fallback = fallbackRoomDetails.find((item) => item.slug === slug) || fallbackRoomDetails[0];
  return withFallback(() => requestJson<RoomDetail>(`/rooms/${slug}`), fallback);
}

export function createDiscussion(payload: CreateDiscussionPayload) {
  return requestJson<DiscussionThread>('/discussions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createIncubation(payload: CreateIncubationPayload) {
  return requestJson<IncubationDetail>('/incubations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createRoom(payload: CreateRoomPayload) {
  return requestJson<{
    id: string;
    slug: string;
    name: string;
    goal: string;
    status: string;
    targetType: string;
    target: { slug: string; name: string } | null;
  }>('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createRoomMessage(slug: string, payload: CreateRoomMessagePayload) {
  return requestJson<{ id: string; userId: string; userName: string; content: string; createdAt: string }>(`/rooms/${slug}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function recommendIdeaProducts(blockSlugs: string[]) {
  return withFallback(
    () =>
      requestJson<{ items: IdeaProductRecommendation[] }>('/idea-blocks/recommendations', {
        method: 'POST',
        body: JSON.stringify({ blockSlugs }),
      }),
    { items: [] },
  );
}
