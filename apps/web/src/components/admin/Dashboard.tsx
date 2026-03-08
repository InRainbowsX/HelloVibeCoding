import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';
import { getContentStats, getReviewQueue, type ContentStats, type ReviewQueue } from '../../lib/admin-api';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`border ${colorClasses[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="opacity-60">{icon}</div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsData, queueData] = await Promise.all([
        getContentStats(),
        getReviewQueue(),
      ]);
      setStats(statsData);
      setQueue(queueData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>加载失败: {error}</span>
        </div>
        <button 
          onClick={loadData}
          className="mt-2 text-sm underline hover:no-underline"
        >
          重试
        </button>
      </div>
    );
  }

  const pendingApps = stats?.apps?.PENDING_REVIEW || 0;
  const pendingDiscussions = stats?.discussions?.PENDING_REVIEW || 0;
  const pendingComments = stats?.comments?.PENDING || 0;
  const simulatedComments = stats?.simulatedComments || 0;
  const totalPublished = (stats?.apps?.PUBLISHED || 0) + (stats?.discussions?.PUBLISHED || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">管理后台</h1>
        <p className="text-gray-500 mt-1">内容审核、用户管理和数据分析</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待审核作品"
          value={pendingApps}
          icon={<FileText className="w-6 h-6" />}
          color="yellow"
          subtitle={queue?.apps.length ? `${queue.apps.length} 条在队列中` : undefined}
        />
        <StatCard
          title="待审核讨论"
          value={pendingDiscussions}
          icon={<MessageSquare className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="待审核评论"
          value={pendingComments}
          icon={<Clock className="w-6 h-6" />}
          color="purple"
          subtitle={simulatedComments ? `${simulatedComments} 条模拟评论` : undefined}
        />
        <StatCard
          title="已发布内容"
          value={totalPublished}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
      </div>

      {/* Review Queue */}
      {queue && queue.totalCount > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h2 className="font-semibold">审核队列 ({queue.totalCount})</h2>
          </div>
          
          <div className="space-y-4">
            {queue.apps.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">待审核作品</h3>
                <div className="space-y-2">
                  {queue.apps.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <span className="font-medium">{app.name}</span>
                        {app.pattern && (
                          <span className="text-sm text-gray-500 ml-2">({app.pattern.name})</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {queue.apps.length > 3 && (
                    <p className="text-sm text-gray-500">还有 {queue.apps.length - 3} 个...</p>
                  )}
                </div>
              </div>
            )}

            {queue.comments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">待审核评论</h3>
                <div className="space-y-2">
                  {queue.comments.slice(0, 3).map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{comment.author?.displayName || '匿名'}</span>
                        <span>·</span>
                        <span>{comment.discussion.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium mb-2">快速操作</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="text-blue-600 hover:underline">生成模拟用户</a>
              <span className="text-gray-500"> - 创建测试账号</span>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:underline">生成模拟评论</a>
              <span className="text-gray-500"> - 填充讨论区</span>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:underline">查看审计日志</a>
              <span className="text-gray-500"> - 操作记录</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium mb-2">内容统计</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">总作品数</span>
              <span className="font-medium">
                {(stats?.apps?.PUBLISHED || 0) + (stats?.apps?.DRAFT || 0) + (stats?.apps?.PENDING_REVIEW || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">总讨论数</span>
              <span className="font-medium">
                {(stats?.discussions?.PUBLISHED || 0) + (stats?.discussions?.PENDING_REVIEW || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">总评论数</span>
              <span className="font-medium">
                {(stats?.comments?.APPROVED || 0) + (stats?.comments?.PENDING || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium mb-2">系统状态</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>API 服务正常</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>数据库连接正常</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>模拟数据: {simulatedComments} 条</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
