export interface AppBreakdown {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  category: string;
  revenueModel: string;
  techStack: string[];
  metrics: {
    arr: string;
    founded: string;
    team: string;
    valuation?: string;
  };
  narrative: string;
  patterns: Pattern[];
  screenshots: Screenshot[];
}

export interface Pattern {
  id: string;
  title: string;
  description: string;
  category: 'Onboarding' | 'Pricing' | 'Navigation' | 'Empty State' | 'Dashboard' | 'Settings';
  imageUrl: string;
  appId: string;
  appName: string;
}

export interface Screenshot {
  id: string;
  url: string;
  caption: string;
  hotspots: Hotspot[];
}

export interface Hotspot {
  x: number;
  y: number;
  title: string;
  description: string;
}

export interface Discussion {
  id: string;
  title: string;
  author: string;
  avatar: string;
  replies: number;
  likes: number;
  category: string;
  timestamp: string;
}
