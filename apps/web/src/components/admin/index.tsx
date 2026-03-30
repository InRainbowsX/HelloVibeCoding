import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Users, 
  Lightbulb,
  LogOut
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AdminDashboard } from './Dashboard';
import { ContentManager } from './ContentManager';
import { CommentManager } from './CommentManager';
import { UserManager } from './UserManager';
import { IdeaLabManager } from './IdeaLabManager';
import { useAuth } from '../auth/AuthContext';

type TabType = 'dashboard' | 'content' | 'idea-lab' | 'comments' | 'users';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '概览', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'content', label: '内容管理', icon: <FileText className="w-4 h-4" /> },
  { id: 'idea-lab', label: '点子实验室', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'comments', label: '评论管理', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'users', label: '用户管理', icon: <Users className="w-4 h-4" /> },
];

export function AdminPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">正在校验权限...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-bold mb-3">无管理权限</h1>
          <p className="text-sm text-gray-500">当前账号已登录，但没有后台访问权限。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="font-semibold text-lg">Admin</span>
            </div>
            <button
              onClick={() => {
                logout();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white border rounded-lg overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Quick Info */}
            <div className="mt-4 bg-white border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">使用提示</h3>
              <ul className="text-xs text-gray-500 space-y-2">
                <li>• 内容管理支持批量操作</li>
                <li>• 评论可一键生成模拟数据</li>
                <li>• 模拟用户有不同角色定位</li>
                <li>• 所有操作均有审计记录</li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white border rounded-lg p-6">
              {activeTab === 'dashboard' && <AdminDashboard />}
              {activeTab === 'content' && <ContentManager />}
              {activeTab === 'idea-lab' && <IdeaLabManager />}
              {activeTab === 'comments' && <CommentManager />}
              {activeTab === 'users' && <UserManager />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
