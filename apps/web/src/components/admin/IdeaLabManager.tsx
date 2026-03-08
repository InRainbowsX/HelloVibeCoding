import { useState, useEffect } from 'react';
import { Search, Edit2, Plus, Trash2, Lightbulb, FlaskConical } from 'lucide-react';
import { 
  listAdminIdeaBlocks,
  listAdminIncubations,
  updateIdeaBlock,
  updateIncubation,
  deleteIdeaBlock,
  deleteIncubation,
  createIdeaBlock,
  type IdeaBlockContent,
  type IncubationContent
} from '../../lib/admin-api';

type TabType = 'idea-blocks' | 'incubations';

const blockTypeLabels: Record<string, string> = {
  FORMULA: '公式',
  FEATURE: '功能',
  WORKFLOW: '流程',
  CHANNEL: '渠道',
};

const incubationStatusLabels: Record<string, string> = {
  OPEN: '开放中',
  VALIDATING: '验证中',
  BUILDING: '制作中',
  ARCHIVED: '已归档',
};

const incubationStatusColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  VALIDATING: 'bg-yellow-100 text-yellow-700',
  BUILDING: 'bg-blue-100 text-blue-700',
  ARCHIVED: 'bg-gray-100 text-gray-700',
};

export function IdeaLabManager() {
  const [activeTab, setActiveTab] = useState<TabType>('idea-blocks');
  const [ideaBlocks, setIdeaBlocks] = useState<IdeaBlockContent[]>([]);
  const [incubations, setIncubations] = useState<IncubationContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<IdeaBlockContent | IncubationContent | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'idea-blocks') {
        const data = await listAdminIdeaBlocks();
        setIdeaBlocks(data.items);
      } else {
        const data = await listAdminIncubations();
        setIncubations(data.items);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredIdeaBlocks = ideaBlocks.filter(block => {
    const matchesSearch = search === '' || 
      block.title.toLowerCase().includes(search.toLowerCase()) ||
      block.summary.toLowerCase().includes(search.toLowerCase()) ||
      block.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const filteredIncubations = incubations.filter(inc => {
    const matchesSearch = search === '' || 
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.oneLiner.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  async function handleDelete(item: IdeaBlockContent | IncubationContent) {
    if (!confirm(`确定要删除 "${'title' in item ? item.title : (item as IncubationContent).title}" 吗？此操作不可恢复。`)) return;
    
    try {
      if ('blockType' in item) {
        await deleteIdeaBlock(item.id);
        setIdeaBlocks(ideaBlocks.filter(b => b.id !== item.id));
      } else {
        await deleteIncubation(item.id);
        setIncubations(incubations.filter(i => i.id !== item.id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('删除失败');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">点子实验室管理</h1>
        <div className="flex gap-2">
          {activeTab === 'idea-blocks' && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              新建点子块
            </button>
          )}
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            刷新
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('idea-blocks')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'idea-blocks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            点子块
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{ideaBlocks.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('incubations')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'incubations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            孵化项目
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{incubations.length}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={activeTab === 'idea-blocks' ? "搜索点子标题、描述或标签..." : "搜索孵化项目..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : activeTab === 'idea-blocks' ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">点子块</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">标签</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">统计</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredIdeaBlocks.map((block) => (
                <tr key={block.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{block.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{block.summary}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {blockTypeLabels[block.blockType] || block.blockType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {block.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex gap-2">
                      <span>📦{block.sourceCount || 0}</span>
                      <span>🥚{block.incubationCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem(block)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(block)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredIdeaBlocks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              没有找到匹配的点子块
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">孵化项目</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">统计</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredIncubations.map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{inc.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{inc.oneLiner}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={inc.status}
                      onChange={async (e) => {
                        try {
                          await updateIncubation(inc.id, { status: e.target.value as any });
                          setIncubations(incubations.map(i => i.id === inc.id ? { ...i, status: e.target.value as any } : i));
                        } catch (error) {
                          alert('更新失败');
                        }
                      }}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${incubationStatusColors[inc.status]}`}
                    >
                      {Object.entries(incubationStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex gap-2">
                      <span>💡{inc.blockCount || 0}</span>
                      <span>💬{inc.discussionCount || 0}</span>
                      <span>🏠{inc.roomCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem(inc)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inc)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredIncubations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              没有找到匹配的孵化项目
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && 'blockType' in editingItem && (
        <IdeaBlockEditModal
          block={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (data) => {
            try {
              await updateIdeaBlock(editingItem.id, data);
              setIdeaBlocks(ideaBlocks.map(b => b.id === editingItem.id ? { ...b, ...data } : b));
              setEditingItem(null);
            } catch (error) {
              alert('保存失败');
            }
          }}
        />
      )}

      {editingItem && 'oneLiner' in editingItem && (
        <IncubationEditModal
          incubation={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (data) => {
            try {
              await updateIncubation(editingItem.id, data);
              setIncubations(incubations.map(i => i.id === editingItem.id ? { ...i, ...data } : i));
              setEditingItem(null);
            } catch (error) {
              alert('保存失败');
            }
          }}
        />
      )}

      {/* Create Modal */}
      {isCreating && (
        <IdeaBlockCreateModal
          onClose={() => setIsCreating(false)}
          onSave={async (data) => {
            try {
              const created = await createIdeaBlock(data);
              setIdeaBlocks([created, ...ideaBlocks]);
              setIsCreating(false);
            } catch (error) {
              alert('创建失败');
            }
          }}
        />
      )}
    </div>
  );
}

// ==================== Modals ====================

interface IdeaBlockEditModalProps {
  block: IdeaBlockContent;
  onClose: () => void;
  onSave: (data: Partial<IdeaBlockContent>) => Promise<void>;
}

function IdeaBlockEditModal({ block, onClose, onSave }: IdeaBlockEditModalProps) {
  const [data, setData] = useState(block);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">编辑点子块</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={data.slug}
                onChange={(e) => setData({ ...data, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <select
                value={data.blockType}
                onChange={(e) => setData({ ...data, blockType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FORMULA">公式</option>
                <option value="FEATURE">功能</option>
                <option value="WORKFLOW">流程</option>
                <option value="CHANNEL">渠道</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">标题</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              rows={3}
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">创新点说明</label>
            <textarea
              rows={2}
              value={data.noveltyNote || ''}
              onChange={(e) => setData({ ...data, noveltyNote: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
            <input
              type="text"
              value={data.tags.join(', ')}
              onChange={(e) => setData({ ...data, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button
            onClick={async () => { setSaving(true); await onSave(data); setSaving(false); }}
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

interface IncubationEditModalProps {
  incubation: IncubationContent;
  onClose: () => void;
  onSave: (data: Partial<IncubationContent>) => Promise<void>;
}

function IncubationEditModal({ incubation, onClose, onSave }: IncubationEditModalProps) {
  const [data, setData] = useState(incubation);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">编辑孵化项目</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">一句话描述</label>
            <input
              type="text"
              value={data.oneLiner}
              onChange={(e) => setData({ ...data, oneLiner: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">状态</label>
            <select
              value={data.status}
              onChange={(e) => setData({ ...data, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="OPEN">开放中</option>
              <option value="VALIDATING">验证中</option>
              <option value="BUILDING">制作中</option>
              <option value="ARCHIVED">已归档</option>
            </select>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <p>Slug: {data.slug}</p>
            <p className="mt-1">包含 {data.blockCount} 个点子块，{data.discussionCount} 条讨论，{data.roomCount} 个房间</p>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button
            onClick={async () => { setSaving(true); await onSave(data); setSaving(false); }}
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

interface IdeaBlockCreateModalProps {
  onClose: () => void;
  onSave: (data: Partial<IdeaBlockContent>) => Promise<void>;
}

function IdeaBlockCreateModal({ onClose, onSave }: IdeaBlockCreateModalProps) {
  const [data, setData] = useState<Partial<IdeaBlockContent>>({
    slug: '',
    title: '',
    summary: '',
    blockType: 'FEATURE',
    tags: [],
    noveltyNote: '',
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">新建点子块</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <input
                type="text"
                value={data.slug}
                onChange={(e) => setData({ ...data, slug: e.target.value })}
                placeholder="例如：instant-score-feedback"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <select
                value={data.blockType}
                onChange={(e) => setData({ ...data, blockType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FORMULA">公式</option>
                <option value="FEATURE">功能</option>
                <option value="WORKFLOW">流程</option>
                <option value="CHANNEL">渠道</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">标题 *</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="例如：记录动作立即变战绩反馈"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述 *</label>
            <textarea
              rows={3}
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
              placeholder="简要描述这个点子是什么..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">创新点说明</label>
            <textarea
              rows={2}
              value={data.noveltyNote}
              onChange={(e) => setData({ ...data, noveltyNote: e.target.value })}
              placeholder="为什么这个点子值得注意？"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
            <input
              type="text"
              value={data.tags?.join(', ')}
              onChange={(e) => setData({ ...data, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="例如：地图, 记录, 反馈"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button
            onClick={async () => { 
              if (!data.slug || !data.title || !data.summary) {
                alert('请填写必填项');
                return;
              }
              setSaving(true); 
              await onSave(data); 
              setSaving(false); 
            }}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
