export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'novel' | 'cocreate' | 'unclaimed' | 'released';
  votes: number;
  author: string;
  created_at: string;
}

export interface Message {
  id: number;
  idea_id: string;
  user: string;
  content: string;
  created_at: string;
}

export interface AppBuild {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  icon: string;
  created_at: string;
}

export const CATEGORIES = [
  { id: 'school', name: '校园 School', icon: 'GraduationCap' },
  { id: 'food', name: '美食 Food', icon: 'Utensils' },
  { id: 'commute', name: '通勤 Commute', icon: 'Bus' },
  { id: 'work', name: '工作 Work', icon: 'Briefcase' },
  { id: 'home', name: '居家 Home', icon: 'Home' },
  { id: 'health', name: '健康 Health', icon: 'HeartPulse' },
  { id: 'social', name: '社交 Social', icon: 'MessageSquare' },
  { id: 'hobby', name: '爱好 Hobby', icon: 'Gamepad2' },
  { id: 'other', name: '其他 Other', icon: 'Folder' },
];
