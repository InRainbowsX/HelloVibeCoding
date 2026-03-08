import { AppBreakdown, Pattern, Discussion } from './types';

export const APPS: AppBreakdown[] = [
  {
    id: 'linear',
    name: 'Linear',
    logo: 'https://linear.app/favicon.ico',
    tagline: 'The issue tracker you’ll actually enjoy using.',
    category: 'Productivity',
    revenueModel: 'SaaS / Per User',
    techStack: ['React', 'Node.js', 'PostgreSQL', 'GraphQL'],
    metrics: {
      arr: '$20M+',
      founded: '2019',
      team: '50+',
      valuation: '$400M'
    },
    narrative: 'Linear has redefined the issue tracking space with its focus on speed, keyboard shortcuts, and a minimalist aesthetic. Their growth is a masterclass in product-led growth and community building.',
    patterns: [],
    screenshots: [
      {
        id: 's1',
        url: 'https://picsum.photos/seed/linear1/1200/800',
        caption: 'Main Dashboard View',
        hotspots: [
          { x: 20, y: 30, title: 'Command Menu', description: 'Quick access to all actions via Cmd+K.' },
          { x: 70, y: 50, title: 'Issue List', description: 'Highly performant list with real-time updates.' }
        ]
      }
    ]
  },
  {
    id: 'notion',
    name: 'Notion',
    logo: 'https://www.notion.so/images/favicon.ico',
    tagline: 'Your wiki, docs & projects. Together.',
    category: 'Collaboration',
    revenueModel: 'Freemium / Enterprise',
    techStack: ['React', 'Next.js', 'PostgreSQL'],
    metrics: {
      arr: '$100M+',
      founded: '2013',
      team: '500+',
      valuation: '$10B'
    },
    narrative: 'Notion created a new category of "all-in-one" workspace. Their block-based architecture allows for unparalleled flexibility.',
    patterns: [],
    screenshots: []
  }
];

export const PATTERNS: Pattern[] = [
  {
    id: 'p1',
    title: 'Linear Onboarding Flow',
    description: 'A seamless, keyboard-first onboarding experience that gets users to value quickly.',
    category: 'Onboarding',
    imageUrl: 'https://picsum.photos/seed/pattern1/800/600',
    appId: 'linear',
    appName: 'Linear'
  },
  {
    id: 'p2',
    title: 'Notion Pricing Table',
    description: 'Clear differentiation between plans with a focus on team collaboration.',
    category: 'Pricing',
    imageUrl: 'https://picsum.photos/seed/pattern2/800/600',
    appId: 'notion',
    appName: 'Notion'
  },
  {
    id: 'p3',
    title: 'Slack Empty State',
    description: 'Playful and informative empty states that encourage user action.',
    category: 'Empty State',
    imageUrl: 'https://picsum.photos/seed/pattern3/800/600',
    appId: 'slack',
    appName: 'Slack'
  }
];

export const DISCUSSIONS: Discussion[] = [
  {
    id: 'd1',
    title: 'How Linear handles high-velocity issue tracking',
    author: 'DesignGuru',
    avatar: 'https://i.pravatar.cc/150?u=d1',
    replies: 24,
    likes: 156,
    category: 'Product Design',
    timestamp: '2 hours ago'
  },
  {
    id: 'd2',
    title: 'Is the "all-in-one" workspace trend fading?',
    author: 'SaaSMaster',
    avatar: 'https://i.pravatar.cc/150?u=d2',
    replies: 45,
    likes: 89,
    category: 'Market Strategy',
    timestamp: '5 hours ago'
  }
];
