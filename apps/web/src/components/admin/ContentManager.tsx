import { useState, useEffect } from 'react';
import { Search, Filter, Edit2, CheckCircle, XCircle, Eye, MoreHorizontal } from 'lucide-react';
import { listAdminApps, listAdminDiscussions, updateAppContent, updateDiscussionContent, bulkUpdateAppStatus, type AppContent, type DiscussionContent } from '../../lib/admin-api';

type ContentType = 'apps' | 'discussions';
type ContentStatus = 'PUBLISHED' | 'PENDING_REVIEW' | 'DRAFT' | 'REJECTED';

const statusLabels: Record<string, string> = {
  PUBLISHED: '已发布',
  PENDING_REVIEW: '待审核',
  DRAFT: '草稿',
  REJECTED: '已拒绝',
};

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  DRAFT: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export function ContentManager() {
  const [activeTab, setActiveTab] = useState<ContentType>('apps');
  const [apps, setApps] = useState<AppContent[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [editingItem, setEditingItem] = useState<AppContent | DiscussionContent | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'apps') {
        const data = await listAdminApps();
        setApps(data.items);
      } else {
        const data = await listAdminDiscussions();
        setDiscussions(data.items);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredApps = apps.filter(app => {
    const matchesSearch = search === '' || 
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.tagline?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.contentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDiscussions = discussions.filter(disc => {
    const matchesSearch = search === '' || 
      disc.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || disc.contentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleStatusChange(item: AppContent | DiscussionContent, newStatus: ContentStatus) {
    try {
      if ('slug' in item) {
        await updateAppContent(item.id, { contentStatus: newStatus as string });
        setApps(apps.map(a => a.id === item.id ? { ...a, contentStatus: newStatus } : a));
      } else {
        await updateDiscussionContent(item.id, { contentStatus: newStatus as string });
        setDiscussions(discussions.map(d => d.id === item.id ? { ...d, contentStatus: newStatus } : d));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('更新状态失败');
    }
  }

  async function handleBulkStatusChange(newStatus: ContentStatus) {
    if (selectedItems.size === 0) return;
    
    try {
      await bulkUpdateAppStatus(Array.from(selectedItems), newStatus);
      setApps(apps.map(a => selectedItems.has(a.id) ? { ...a, contentStatus: newStatus } : a));
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to bulk update:', error);
      alert('批量更新失败');
    }
  }

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">内容管理</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {(['apps', 'discussions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'apps' ? '作品管理' : '讨论管理'}
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {tab === 'apps' ? apps.length : discussions.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContentStatus | 'all')}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="PUBLISHED">已发布</option>
          <option value="PENDING_REVIEW">待审核</option>
          <option value="DRAFT">草稿</option>
          <option value="REJECTED">已拒绝</option>
        </select>

        {activeTab === 'apps' && selectedItems.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange('PUBLISHED')}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              批量通过
            </button>
            <button
              onClick={() => handleBulkStatusChange('REJECTED')}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              批量拒绝
            </button>
          </div>
        )}
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : activeTab === 'apps' ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredApps.length && filteredApps.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(filteredApps.map(a => a.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">作品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">分类</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">热度</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(app.id)}
                      onChange={() => toggleSelection(app.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium">
                        {app.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{app.tagline}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{app.category}</td>
                  <td className="px-4 py-3 text-sm">{app.heatScore}</td>
                  <td className="px-4 py-3">
                    <select
                      value={app.contentStatus}
                      onChange={(e) => handleStatusChange(app, e.target.value as ContentStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[app.contentStatus]}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingItem(app)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <a
                        href={`/projects/${app.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-100 rounded"
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              没有找到匹配的作品
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">讨论</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">关联作品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">回复数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDiscussions.map((disc) => (
                <tr key={disc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{disc.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{disc.summary}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {disc.app?.name || disc.incubation?.title || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{disc.replyCount}</td>
                  <td className="px-4 py-3">
                    <select
                      value={disc.contentStatus}
                      onChange={(e) => handleStatusChange(disc, e.target.value as ContentStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[disc.contentStatus]}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingItem(disc)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDiscussions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              没有找到匹配的讨论
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (data) => {
            try {
              if ('slug' in editingItem) {
                await updateAppContent(editingItem.id, data);
                setApps(apps.map(a => a.id === editingItem.id ? { ...a, ...data } : a));
              } else {
                await updateDiscussionContent(editingItem.id, data);
                setDiscussions(discussions.map(d => d.id === editingItem.id ? { ...d, ...data } : d));
              }
              setEditingItem(null);
            } catch (error) {
              alert('保存失败');
            }
          }}
        />
      )}
    </div>
  );
}

interface EditModalProps {
  item: AppContent | DiscussionContent;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function EditModal({ item, onClose, onSave }: EditModalProps) {
  const [data, setData] = useState(item);
  const [saving, setSaving] = useState(false);

  const isApp = 'slug' in item;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">编辑{isApp ? '作品' : '讨论'}</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {isApp ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <input
                  type="text"
                  value={(data as AppContent).name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">标签线</label>
                <input
                  type="text"
                  value={(data as AppContent).tagline || ''}
                  onChange={(e) => setData({ ...data, tagline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">分类</label>
                  <input
                    type="text"
                    value={(data as AppContent).category}
                    onChange={(e) => setData({ ...data, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">热度</label>
                  <input
                    type="number"
                    value={(data as AppContent).heatScore}
                    onChange={(e) => setData({ ...data, heatScore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">目标用户</label>
                <input
                  type="text"
                  value={(data as AppContent).targetPersona}
                  onChange={(e) => setData({ ...data, targetPersona: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">钩子角度</label>
                <input
                  type="text"
                  value={(data as AppContent).hookAngle}
                  onChange={(e) => setData({ ...data, hookAngle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">标题</label>
                <input
                  type="text"
                  value={(data as DiscussionContent).title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">摘要</label>
                <textarea
                  value={(data as DiscussionContent).summary || ''}
                  onChange={(e) => setData({ ...data, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">点赞数</label>
                <input
                  type="number"
                  value={(data as DiscussionContent).likesCount}
                  onChange={(e) => setData({ ...data, likesCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave(data);
              setSaving(false);
            }}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
