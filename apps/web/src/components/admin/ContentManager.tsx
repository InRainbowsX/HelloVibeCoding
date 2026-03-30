import { useState, useEffect } from 'react';
import { Search, Edit2, CheckCircle, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { 
  listAdminApps, 
  listAdminDiscussions, 
  updateAppContent, 
  updateDiscussionContent, 
  bulkUpdateAppStatus,
  getAdminAppDetail,
  updateTeardown,
  updateAssetBundle,
  type AppContent, 
  type DiscussionContent,
  type AppDetail,
  type TeardownContent,
  type AssetBundleContent
} from '../../lib/admin-api';

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
  const [editingDetail, setEditingDetail] = useState<AppDetail | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<'basic' | 'teardown' | 'assets' | 'relations'>('basic');

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

  async function loadAppDetail(id: string) {
    try {
      const detail = await getAdminAppDetail(id);
      setEditingDetail(detail);
    } catch (error) {
      console.error('Failed to load app detail:', error);
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

  async function handleEditClick(item: AppContent) {
    setEditingItem(item);
    setActiveSection('basic');
    await loadAppDetail(item.id);
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">研究评分</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">统计</th>
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
                  <td className="px-4 py-3 text-sm">{(app.heatScore / 10).toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex gap-2">
                      <span title="讨论">💬{app.discussionCount || 0}</span>
                      <span title="点子">💡{app.ideaBlockCount || 0}</span>
                      <span title="孵化">🥚{app.incubationCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={app.contentStatus}
                      onChange={(e) => handleStatusChange(app, e.target.value as ContentStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[app.contentStatus] || 'bg-gray-100'}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(app)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="编辑完整信息"
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
                      className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[disc.contentStatus] || 'bg-gray-100'}`}
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
      {editingItem && 'slug' in editingItem && (
        <AppEditModal
          item={editingItem}
          detail={editingDetail}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onClose={() => {
            setEditingItem(null);
            setEditingDetail(null);
          }}
          onSave={async (data, section) => {
            try {
              if (section === 'basic') {
                await updateAppContent(editingItem.id, data);
                setApps(apps.map(a => a.id === editingItem.id ? { ...a, ...data } : a));
              } else if (section === 'teardown' && data.teardown) {
                await updateTeardown(editingItem.id, data.teardown);
              } else if (section === 'assets' && data.assetBundle) {
                await updateAssetBundle(editingItem.id, data.assetBundle);
              }
              await loadAppDetail(editingItem.id);
            } catch (error) {
              alert('保存失败');
            }
          }}
        />
      )}
    </div>
  );
}

interface AppEditModalProps {
  item: AppContent;
  detail: AppDetail | null;
  activeSection: 'basic' | 'teardown' | 'assets' | 'relations';
  setActiveSection: (section: 'basic' | 'teardown' | 'assets' | 'relations') => void;
  onClose: () => void;
  onSave: (data: any, section: string) => Promise<void>;
}

function AppEditModal({ item, detail, activeSection, setActiveSection, onClose, onSave }: AppEditModalProps) {
  const [basicData, setBasicData] = useState(item);
  const [teardownData, setTeardownData] = useState<Partial<TeardownContent>>(detail?.teardown || {});
  const [assetData, setAssetData] = useState<Partial<AssetBundleContent>>(detail?.assetBundle || {});
  const [saving, setSaving] = useState(false);

  // Update local state when detail loads
  useEffect(() => {
    if (detail) {
      setBasicData(detail);
      setTeardownData(detail.teardown || {});
      setAssetData(detail.assetBundle || {});
    }
  }, [detail]);

  const sections = [
    { id: 'basic', label: '基础信息', icon: '📋' },
    { id: 'teardown', label: '8格拆解', icon: '🔍' },
    { id: 'assets', label: '构建资源', icon: '📦' },
    { id: 'relations', label: '关联数据', icon: '🔗' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto m-4">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">编辑作品: {item.name}</h2>
            <p className="text-sm text-gray-500 mt-1">slug: {item.slug}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="flex border-b">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">名称</label>
                  <input
                    type="text"
                    value={basicData.name}
                    onChange={(e) => setBasicData({ ...basicData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">分类</label>
                  <input
                    type="text"
                    value={basicData.category}
                    onChange={(e) => setBasicData({ ...basicData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">标签线 (Tagline)</label>
                <input
                  type="text"
                  value={basicData.tagline || ''}
                  onChange={(e) => setBasicData({ ...basicData, tagline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">一句话描述 (SaveTimeLabel)</label>
                <input
                  type="text"
                  value={basicData.saveTimeLabel}
                  onChange={(e) => setBasicData({ ...basicData, saveTimeLabel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">目标用户</label>
                  <input
                    type="text"
                    value={basicData.targetPersona}
                    onChange={(e) => setBasicData({ ...basicData, targetPersona: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">钩子角度</label>
                  <input
                    type="text"
                    value={basicData.hookAngle}
                    onChange={(e) => setBasicData({ ...basicData, hookAngle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">研究评分 (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={(basicData.heatScore / 10).toFixed(1)}
                    onChange={(e) =>
                      setBasicData({
                        ...basicData,
                        heatScore: Math.max(0, Math.min(100, Math.round((Number(e.target.value) || 0) * 10))),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">难度 (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={basicData.difficulty}
                    onChange={(e) => setBasicData({ ...basicData, difficulty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">定价模式</label>
                  <select
                    value={basicData.pricing}
                    onChange={(e) => setBasicData({ ...basicData, pricing: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FREE">免费</option>
                    <option value="FREEMIUM">Freemium</option>
                    <option value="PAID">付费</option>
                    <option value="USAGE_BASED">按量</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">信任信号 (逗号分隔)</label>
                <input
                  type="text"
                  value={basicData.trustSignals?.join(', ') || ''}
                  onChange={(e) => setBasicData({ ...basicData, trustSignals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900">来源入口</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-500">作品详情页会展示官网、App Store、Google Play 这类外部入口。</p>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">主入口文案</label>
                      <input
                        type="text"
                        value={basicData.primaryLabel || ''}
                        onChange={(e) => setBasicData({ ...basicData, primaryLabel: e.target.value })}
                        placeholder="例如：打开官网 / App Store"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">主入口链接</label>
                      <input
                        type="url"
                        value={basicData.primaryUrl || ''}
                        onChange={(e) => setBasicData({ ...basicData, primaryUrl: e.target.value })}
                        placeholder="https://"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">第二入口文案</label>
                      <input
                        type="text"
                        value={basicData.secondaryLabel || ''}
                        onChange={(e) => setBasicData({ ...basicData, secondaryLabel: e.target.value })}
                        placeholder="可选"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">第二入口链接</label>
                      <input
                        type="url"
                        value={basicData.secondaryUrl || ''}
                        onChange={(e) => setBasicData({ ...basicData, secondaryUrl: e.target.value })}
                        placeholder="https://"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'teardown' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">痛点摘要</label>
                  <textarea
                    rows={2}
                    value={teardownData.painSummary || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, painSummary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">痛点评分</label>
                  <input
                    type="text"
                    value={teardownData.painScore || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, painScore: e.target.value })}
                    placeholder="高频 / 低门槛 / 高传播"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">触发场景</label>
                  <textarea
                    rows={2}
                    value={teardownData.triggerScene || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, triggerScene: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">核心承诺</label>
                  <textarea
                    rows={2}
                    value={teardownData.corePromise || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, corePromise: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">核心循环</label>
                <textarea
                  rows={2}
                  value={teardownData.coreLoop || ''}
                  onChange={(e) => setTeardownData({ ...teardownData, coreLoop: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">关键约束 (逗号分隔)</label>
                <input
                  type="text"
                  value={teardownData.keyConstraints?.join(', ') || ''}
                  onChange={(e) => setTeardownData({ ...teardownData, keyConstraints: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MVP 范围</label>
                <textarea
                  rows={2}
                  value={teardownData.mvpScope || ''}
                  onChange={(e) => setTeardownData({ ...teardownData, mvpScope: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">冷启动策略</label>
                  <textarea
                    rows={2}
                    value={teardownData.coldStartStrategy || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, coldStartStrategy: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">定价逻辑</label>
                  <textarea
                    rows={2}
                    value={teardownData.pricingLogic || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, pricingLogic: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">竞争差异</label>
                  <textarea
                    rows={2}
                    value={teardownData.competitorDelta || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, competitorDelta: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">风险备注</label>
                  <textarea
                    rows={2}
                    value={teardownData.riskNotes || ''}
                    onChange={(e) => setTeardownData({ ...teardownData, riskNotes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">扩展步骤 (逗号分隔)</label>
                <input
                  type="text"
                  value={teardownData.expansionSteps?.join(', ') || ''}
                  onChange={(e) => setTeardownData({ ...teardownData, expansionSteps: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">反向点子 (逗号分隔)</label>
                <input
                  type="text"
                  value={teardownData.reverseIdeas?.join(', ') || ''}
                  onChange={(e) => setTeardownData({ ...teardownData, reverseIdeas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeSection === 'assets' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assetData.hasAgentsTemplate}
                    onChange={(e) => setAssetData({ ...assetData, hasAgentsTemplate: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">有 Agents 模板</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assetData.hasSpecTemplate}
                    onChange={(e) => setAssetData({ ...assetData, hasSpecTemplate: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">有 Spec 模板</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assetData.hasPromptPack}
                    onChange={(e) => setAssetData({ ...assetData, hasPromptPack: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">有 Prompt Pack</span>
                </label>
              </div>
              {assetData.hasAgentsTemplate && (
                <div>
                  <label className="block text-sm font-medium mb-1">Agents 模板内容 (Markdown)</label>
                  <textarea
                    rows={6}
                    value={assetData.agentsTemplate || ''}
                    onChange={(e) => setAssetData({ ...assetData, agentsTemplate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              )}
              {assetData.hasSpecTemplate && (
                <div>
                  <label className="block text-sm font-medium mb-1">Spec 模板内容 (Markdown)</label>
                  <textarea
                    rows={6}
                    value={assetData.specTemplate || ''}
                    onChange={(e) => setAssetData({ ...assetData, specTemplate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              )}
              {assetData.hasPromptPack && (
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt Pack 内容</label>
                  <textarea
                    rows={6}
                    value={assetData.promptPack || ''}
                    onChange={(e) => setAssetData({ ...assetData, promptPack: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {activeSection === 'relations' && detail && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">关联的讨论 ({detail.discussions?.length || 0})</h3>
                <div className="space-y-2">
                  {detail.discussions?.map(disc => (
                    <div key={disc.id} className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium">{disc.title}</p>
                      <p className="text-gray-500 mt-1">💬 {disc.replyCount} 回复 · 👍 {disc.likesCount}</p>
                    </div>
                  )) || <p className="text-gray-500 text-sm">暂无讨论</p>}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3">关联的点子块 ({detail.ideaBlockSources?.length || 0})</h3>
                <div className="space-y-2">
                  {detail.ideaBlockSources?.map(source => (
                    <div key={source.id} className="bg-gray-50 p-3 rounded text-sm">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{source.ideaBlock.blockType}</span>
                      <p className="font-medium mt-1">{source.ideaBlock.title}</p>
                      <p className="text-gray-500 line-clamp-1">{source.ideaBlock.summary}</p>
                    </div>
                  )) || <p className="text-gray-500 text-sm">暂无点子块</p>}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-3">关联的孵化 ({detail.incubationLinks?.length || 0})</h3>
                <div className="space-y-2">
                  {detail.incubationLinks?.map(link => (
                    <div key={link.id} className="bg-gray-50 p-3 rounded text-sm">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{link.incubation.status}</span>
                      <p className="font-medium mt-1">{link.incubation.title}</p>
                      <p className="text-gray-500 line-clamp-1">{link.incubation.oneLiner}</p>
                    </div>
                  )) || <p className="text-gray-500 text-sm">暂无孵化</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {activeSection === 'basic' && '编辑基础展示信息'}
            {activeSection === 'teardown' && '编辑8格商业拆解'}
            {activeSection === 'assets' && '编辑构建资源模板'}
            {activeSection === 'relations' && '查看关联数据（只读）'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              关闭
            </button>
            {activeSection !== 'relations' && (
              <button
                onClick={async () => {
                  setSaving(true);
                  const data = activeSection === 'basic' ? basicData : 
                               activeSection === 'teardown' ? { teardown: teardownData } :
                               { assetBundle: assetData };
                  await onSave(data, activeSection);
                  setSaving(false);
                }}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
