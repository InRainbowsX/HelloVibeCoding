import { useState, useEffect } from 'react';
import { Search, UserPlus, Bot, User, Trash2, RefreshCw } from 'lucide-react';
import { listAdminUsers, createSimulatedUsers, deleteUser, type AdminUser } from '../../lib/admin-api';

export function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [simulatedFilter, setSimulatedFilter] = useState<boolean | 'all'>('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [simulatedFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await listAdminUsers({
        isSimulated: simulatedFilter === 'all' ? undefined : simulatedFilter,
        page: 1,
        pageSize: 50,
      });
      setUsers(data.items);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = search === '' || 
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.displayName.toLowerCase().includes(search.toLowerCase()) ||
      user.bio?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  async function handleGenerateSimulatedUsers() {
    const count = prompt('要生成多少个模拟用户？', '10');
    if (!count) return;
    
    setGenerating(true);
    try {
      const result = await createSimulatedUsers(parseInt(count, 10));
      alert(`成功生成 ${result.count} 个模拟用户！`);
      await loadUsers();
    } catch (error) {
      console.error('Failed to generate users:', error);
      alert('生成失败');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteUser(userId: string, displayName: string) {
    if (!confirm(`确定要删除用户 "${displayName}" 吗？此操作将同时删除该用户的所有评论。`)) return;
    
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('删除失败');
    }
  }

  const simulatedCount = users.filter(u => u.isSimulated).length;
  const realCount = users.filter(u => !u.isSimulated).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <button
          onClick={loadUsers}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总用户</p>
          <p className="text-2xl font-semibold">{users.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">真实用户</p>
          <p className="text-2xl font-semibold text-green-600">{realCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">模拟用户</p>
          <p className="text-2xl font-semibold text-blue-600">{simulatedCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">活跃用户</p>
          <p className="text-2xl font-semibold">
            {users.filter(u => u.commentCount > 0).length}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">模拟用户生成</h3>
        <p className="text-sm text-blue-700 mb-3">
          生成具有不同角色定位的模拟用户（独立开发者、产品经理、设计师、创业者等），每个用户都有独特的头像、简介和说话风格。
        </p>
        <button
          onClick={handleGenerateSimulatedUsers}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {generating ? '生成中...' : '生成模拟用户'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户名或简介..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={String(simulatedFilter)}
          onChange={(e) => setSimulatedFilter(e.target.value === 'all' ? 'all' : e.target.value === 'true')}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部用户</option>
          <option value="true">仅模拟</option>
          <option value="false">仅真实</option>
        </select>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.displayName}</h3>
                      {user.isSimulated ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          <Bot className="w-3 h-3" />
                          模拟
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <User className="w-3 h-3" />
                          真实
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                    {user.persona && (
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{user.persona}</p>
                    )}
                  </div>
                </div>
                {user.isSimulated && (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.displayName)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {user.bio && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{user.bio}</p>
              )}
              
              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-gray-500">
                <span>{user.commentCount} 评论</span>
                <span>{user.discussionCount} 讨论</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white border rounded-lg">
          没有找到匹配的用户
        </div>
      )}
    </div>
  );
}
