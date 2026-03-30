import { getStoredUser, getToken } from './auth-api';

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
  likeCount: number;
  favoriteCount: number;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
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
  likeCount: number;
  favoriteCount: number;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
}

export interface IdeaBlockDetail extends IdeaBlock {
  incubations: Array<{ slug: string; title: string }>;
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
  likeCount: number;
  favoriteCount: number;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
}

export interface IncubationDetail {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  status: string;
  tags: string[];
  likeCount: number;
  favoriteCount: number;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
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
  entryLinks: Array<{ label: string; url: string }>;
  category: string;
  pricing: string;
  heatScore: number;
  likeCount: number;
  favoriteCount: number;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
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

export interface EngagementState {
  likeCount: number;
  favoriteCount: number;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
}

const fallbackProjectDetail: ProjectDetail = {
  id: 'project-poop-map',
  slug: 'poop-map',
  name: 'Poop Map',
  tagline: '把上厕所变成一张个人地图战绩。',
  category: '居家生活',
  pricing: 'USAGE_BASED',
  entryLinks: [{ label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=net.poopmap' }],
  heatScore: 82,
  likeCount: 18,
  favoriteCount: 9,
  viewerHasLiked: false,
  viewerHasFavorited: false,
  screenshotUrls: ['https://play.google.com/store/apps/details?id=net.poopmap'],
  overview: {
    saveTimeLabel:
      'Poop Map 把一次简单记录变成一张会不断累积的地图战绩。你只要点一下，就能留下新的地点和次数，再把这张战绩图分享给朋友看。它把原本私密又无聊的小事，包装成了一个有点反差、但很容易上头的收集游戏。',
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
      likeCount: 14,
      favoriteCount: 6,
      viewerHasLiked: false,
      viewerHasFavorited: false,
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
      likeCount: 10,
      favoriteCount: 5,
      viewerHasLiked: false,
      viewerHasFavorited: false,
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
      likeCount: 9,
      favoriteCount: 4,
      viewerHasLiked: false,
      viewerHasFavorited: false,
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

const fallbackJigsawPlanetDetail: ProjectDetail = {
  id: 'project-jigsaw-planet',
  slug: 'jigsaw-planet',
  name: 'Jigsaw Planet',
  tagline: '把一张普通图片立刻变成可玩的在线拼图，还能继续被搜索、分享和反复挑战。',
  category: '轻娱乐',
  pricing: 'FREE',
  entryLinks: [{ label: '打开官网', url: 'https://www.jigsawplanet.com/' }],
  heatScore: 71,
  likeCount: 11,
  favoriteCount: 7,
  viewerHasLiked: false,
  viewerHasFavorited: false,
  screenshotUrls: [
    '/assets/projects/jigsaw-planet/screenshot-1.png',
    '/assets/projects/jigsaw-planet/screenshot-2.png',
    '/assets/projects/jigsaw-planet/screenshot-3.png',
  ],
  overview: {
    saveTimeLabel:
      'Jigsaw Planet 让任何一张图片都能直接变成一局在线拼图，不需要重新发明内容本身。用户可以上传自己的图片生成拼图，也可以继续浏览、搜索和挑战别人做好的内容。它把静态图片变成了可玩、可分享、还能被反复消费的轻互动内容。',
    targetPersona: '喜欢轻解谜和图片内容的休闲用户，以及想把自己的图片变成可玩内容的人',
    hookAngle: '重点不是做拼图本身，而是把任何图片都变成一局能被分享和重复消费的内容。',
    trustSignals: ['官网长期运营', '首页持续推荐和 Explore 分发', '支持创建、分享、嵌入'],
    metrics: {
      discussionCount: 1,
      ideaBlockCount: 2,
      incubationCount: 1,
      roomCount: 1,
    },
  },
  teardown: {
    painSummary: '普通图片看一眼就划走，缺少一个能让用户多停留几分钟的轻互动壳。',
    painScore: '大供给 / 大停留空间 / 低解释成本',
    triggerScene: '用户刷到一张好图，除了保存和转发，其实还愿意多玩一下、挑战一下。',
    corePromise: '把任意图片变成一局打开就能玩的拼图，同时让这张图继续被搜索、分享和反复挑战。',
    coreLoop: '看到图片 -> 点开开玩 -> 拼完或玩一会儿 -> 顺手分享 / 继续刷下一张 -> 想把自己的图也做成拼图。',
    keyConstraints: ['图片供给要持续', '开始游玩不能有学习成本', '分发层要一直有新图可刷'],
    mvpScope: '拼图游玩页、首页推荐流、搜索和基础创建入口。',
    coldStartStrategy: '先靠社区图片供给和搜索入口做内容池，再用分享链接把单张拼图往外带。',
    pricingLogic: '免费开放玩法，用广告和站内流量变现更合理。',
    competitorDelta: '不是图库，也不是单机拼图 App，而是把图片内容平台和轻玩法绑在一起。',
    riskNotes: '如果首页分发和搜索不够活，用户会把它当成一次性小游戏；如果创建门槛太高，供给会断。',
    expansionSteps: ['海报变互动页', '品牌图挑战版', '课堂图片解谜版'],
    reverseIdeas: ['普通图片变可玩内容', '用户供内容，平台供玩法模板', '一张图反复被消费'],
  },
  buildAssets: {
    hasAgentsTemplate: true,
    hasSpecTemplate: true,
    hasPromptPack: false,
  },
  discussions: [
    {
      id: 'thread-jigsaw-1',
      title: 'Jigsaw Planet 真正成立的，是拼图玩法本身，还是“给任何图片套一个可玩的壳”？',
      summary: '讨论它到底是一个拼图站，还是一个把图片内容变成可互动消费的模板平台。',
      createdBy: 'Ming',
      likesCount: 8,
      replyCount: 2,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: 'comment-jigsaw-1',
          authorName: 'Ming',
          content: '我更在意的不是拼图，而是它让一张普通图片从“看一下”变成“玩一下”的能力。',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ],
  ideaBlocks: [
    {
      id: 'block-jigsaw-1',
      slug: 'turn-images-into-playable-content',
      title: '普通图片直接变成可玩内容',
      summary: '不重新发明内容本身，而是给现成图片套上一层轻互动壳，把浏览改成参与。',
      blockType: 'FEATURE',
      tags: ['图片', '互动', '可玩内容'],
      noveltyNote: '真正值钱的是让静态内容变厚，而不是单独发明一个新游戏。',
      sourceProjects: [{ slug: 'jigsaw-planet', name: 'Jigsaw Planet' }],
      incubationCount: 1,
      likeCount: 8,
      favoriteCount: 4,
      viewerHasLiked: false,
      viewerHasFavorited: false,
    },
    {
      id: 'block-jigsaw-2',
      slug: 'ugc-content-with-play-template',
      title: '用户供内容，平台供玩法模板',
      summary: '平台守住统一玩法和分发入口，内容池则交给用户上传持续扩张。',
      blockType: 'WORKFLOW',
      tags: ['用户上传', '玩法模板', '内容供给'],
      noveltyNote: '当玩法模板足够稳定时，供给问题可以交给社区自己解决。',
      sourceProjects: [{ slug: 'jigsaw-planet', name: 'Jigsaw Planet' }],
      incubationCount: 1,
      likeCount: 7,
      favoriteCount: 5,
      viewerHasLiked: false,
      viewerHasFavorited: false,
    },
  ],
  incubations: [
    {
      id: 'inc-jigsaw-1',
      slug: 'playable-image-template',
      title: '图片玩法模板',
      oneLiner: '把海报、摄影和内容卡套进统一互动壳里，让静态图片从“看一下”变成“玩一下”。',
      status: 'OPEN',
      tags: ['图片', '互动', '模板'],
      discussionCount: 0,
      blockCount: 2,
      roomCount: 1,
      likeCount: 6,
      favoriteCount: 4,
      viewerHasLiked: false,
      viewerHasFavorited: false,
      blocks: [
        { id: 'block-jigsaw-1', slug: 'turn-images-into-playable-content', title: '普通图片直接变成可玩内容' },
        { id: 'block-jigsaw-2', slug: 'ugc-content-with-play-template', title: '用户供内容，平台供玩法模板' },
      ],
    },
  ],
  rooms: [
    {
      id: 'room-jigsaw-1',
      slug: 'playable-image-template-v0',
      name: '图片玩法模板 v0',
      goal: '先验证图片上传、统一玩法壳和分享入口，能不能让静态图多出一层互动价值。',
      status: 'OPEN',
      memberCount: 2,
      latestMessage: '先别扩玩法，先把一张图从上传到分享这条链路跑通。',
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
    likeCount: fallbackProjectDetail.likeCount,
    favoriteCount: fallbackProjectDetail.favoriteCount,
    viewerHasLiked: false,
    viewerHasFavorited: false,
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
    likeCount: 12,
    favoriteCount: 5,
    viewerHasLiked: false,
    viewerHasFavorited: false,
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
    likeCount: 9,
    favoriteCount: 4,
    viewerHasLiked: false,
    viewerHasFavorited: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: fallbackJigsawPlanetDetail.id,
    slug: fallbackJigsawPlanetDetail.slug,
    name: fallbackJigsawPlanetDetail.name,
    tagline: fallbackJigsawPlanetDetail.tagline,
    category: fallbackJigsawPlanetDetail.category,
    pricing: fallbackJigsawPlanetDetail.pricing,
    heatScore: fallbackJigsawPlanetDetail.heatScore,
    discussionCount: fallbackJigsawPlanetDetail.overview.metrics.discussionCount,
    ideaBlockCount: fallbackJigsawPlanetDetail.overview.metrics.ideaBlockCount,
    incubationCount: fallbackJigsawPlanetDetail.overview.metrics.incubationCount,
    roomCount: fallbackJigsawPlanetDetail.overview.metrics.roomCount,
    likeCount: fallbackJigsawPlanetDetail.likeCount,
    favoriteCount: fallbackJigsawPlanetDetail.favoriteCount,
    viewerHasLiked: false,
    viewerHasFavorited: false,
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
    likeCount: 8,
    favoriteCount: 3,
    viewerHasLiked: false,
    viewerHasFavorited: false,
  },
  ...fallbackJigsawPlanetDetail.ideaBlocks,
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
    likeCount: 9,
    favoriteCount: 4,
    viewerHasLiked: false,
    viewerHasFavorited: false,
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
    likeCount: 7,
    favoriteCount: 2,
    viewerHasLiked: false,
    viewerHasFavorited: false,
  },
  {
    id: 'inc-jigsaw-1',
    slug: 'playable-image-template',
    title: '图片玩法模板',
    oneLiner: '把海报、摄影和内容卡套进统一互动壳里，让静态图片从“看一下”变成“玩一下”。',
    status: 'OPEN',
    tags: ['图片', '互动', '模板'],
    discussionCount: 0,
    blockCount: 2,
    roomCount: 1,
    sourceProjectCount: 1,
    likeCount: 6,
    favoriteCount: 4,
    viewerHasLiked: false,
    viewerHasFavorited: false,
  },
];

const fallbackIncubationDetails: IncubationDetail[] = [
  {
    id: 'inc-1',
    slug: 'slack-off-map',
    title: '摸鱼战绩地图',
    oneLiner: '把上班偷闲、散步和咖啡出逃做成可记录、可比较的职场生存战绩。',
    status: 'VALIDATING',
    tags: ['职场', '地图', '轻社交'],
    likeCount: 9,
    favoriteCount: 4,
    viewerHasLiked: false,
    viewerHasFavorited: false,
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
    tags: ['效率', '组件', '倒计时'],
    likeCount: 7,
    favoriteCount: 2,
    viewerHasLiked: false,
    viewerHasFavorited: false,
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
  {
    id: 'inc-jigsaw-1',
    slug: 'playable-image-template',
    title: '图片玩法模板',
    oneLiner: '把海报、摄影和内容卡套进统一互动壳里，让静态图片从“看一下”变成“玩一下”。',
    status: 'OPEN',
    tags: ['图片', '互动', '模板'],
    likeCount: 6,
    favoriteCount: 4,
    viewerHasLiked: false,
    viewerHasFavorited: false,
    sourceProjects: [{ slug: 'jigsaw-planet', name: 'Jigsaw Planet' }],
    blocks: [
      {
        slug: 'turn-images-into-playable-content',
        title: '普通图片直接变成可玩内容',
        summary: '不重新发明内容本身，而是给现成图片套上一层轻互动壳，把浏览改成参与。',
        blockType: 'FEATURE',
      },
      {
        slug: 'ugc-content-with-play-template',
        title: '用户供内容，平台供玩法模板',
        summary: '平台守住统一玩法和分发入口，内容池则交给用户上传持续扩张。',
        blockType: 'WORKFLOW',
      },
    ],
    discussions: [],
    rooms: [
      {
        id: 'room-jigsaw-1',
        slug: 'playable-image-template-v0',
        name: '图片玩法模板 v0',
        goal: '先验证图片上传、统一玩法壳和分享入口，能不能让静态图多出一层互动价值。',
      },
    ],
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
  {
    id: 'room-jigsaw-1',
    slug: 'playable-image-template-v0',
    name: '图片玩法模板 v0',
    goal: '先验证图片上传、统一玩法壳和分享入口，能不能让静态图多出一层互动价值。',
    status: 'OPEN',
    targetType: 'INCUBATION',
    target: { slug: 'playable-image-template', name: '图片玩法模板' },
    memberCount: 2,
    latestMessage: '先别扩玩法，先把一张图从上传到分享这条链路跑通。',
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
  {
    id: 'room-jigsaw-1',
    slug: 'playable-image-template-v0',
    name: '图片玩法模板 v0',
    goal: '先验证图片上传、统一玩法壳和分享入口，能不能让静态图多出一层互动价值。',
    status: 'OPEN',
    targetType: 'INCUBATION',
    target: { slug: 'playable-image-template', name: '图片玩法模板' },
    memberCount: 2,
    messages: [
      {
        id: 'room-msg-jigsaw-1',
        userId: 'owner',
        userName: 'Luna',
        content: '先别扩玩法，先把一张图从上传到分享这条链路跑通。',
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
    {
      ...fallbackJigsawPlanetDetail.discussions[0],
      targetType: 'PROJECT',
      target: { slug: 'jigsaw-planet', name: 'Jigsaw Planet' },
    },
  ],
  total: 3,
  page: 1,
  pageSize: 20,
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const storedUser = getStoredUser();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(token && storedUser?.id ? { 'X-Viewer-Id': storedUser.id } : {}),
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
  const directFallbackDetails: Record<string, ProjectDetail> = {
    [fallbackProjectDetail.slug]: fallbackProjectDetail,
    [fallbackJigsawPlanetDetail.slug]: fallbackJigsawPlanetDetail,
  };

  if (directFallbackDetails[slug]) {
    return withFallback(() => requestJson<ProjectDetail>(`/projects/${slug}`), directFallbackDetails[slug]);
  }

  const project = fallbackProjects.find((item) => item.slug === slug);
  const fallback = project
    ? {
        ...fallbackProjectDetail,
        id: project.id,
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        entryLinks: [],
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

export function getIdeaBlockDetail(slug: string) {
  const fallback = fallbackIdeaBlocks.find((item) => item.slug === slug) || fallbackIdeaBlocks[0];
  return withFallback(() => requestJson<IdeaBlockDetail>(`/idea-blocks/${slug}`), {
    ...fallback,
    incubations: [],
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

export function toggleProjectLike(slug: string, active?: boolean) {
  return requestJson<EngagementState>(`/projects/${slug}/like`, {
    method: 'POST',
    body: JSON.stringify(active === undefined ? {} : { active }),
  });
}

export function toggleProjectFavorite(slug: string, active?: boolean) {
  return requestJson<EngagementState>(`/projects/${slug}/favorite`, {
    method: 'POST',
    body: JSON.stringify(active === undefined ? {} : { active }),
  });
}

export function toggleIdeaBlockLike(slug: string, active?: boolean) {
  return requestJson<EngagementState>(`/idea-blocks/${slug}/like`, {
    method: 'POST',
    body: JSON.stringify(active === undefined ? {} : { active }),
  });
}

export function toggleIdeaBlockFavorite(slug: string, active?: boolean) {
  return requestJson<EngagementState>(`/idea-blocks/${slug}/favorite`, {
    method: 'POST',
    body: JSON.stringify(active === undefined ? {} : { active }),
  });
}

export function toggleIncubationLike(slug: string, active?: boolean) {
  return requestJson<EngagementState>(`/incubations/${slug}/like`, {
    method: 'POST',
    body: JSON.stringify(active === undefined ? {} : { active }),
  });
}

export function toggleIncubationFavorite(slug: string, active?: boolean) {
  return requestJson<EngagementState>(`/incubations/${slug}/favorite`, {
    method: 'POST',
    body: JSON.stringify(active === undefined ? {} : { active }),
  });
}
