import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Trash2, Bot, User } from 'lucide-react';
import { 
  listAdminComments, 
  updateCommentStatus, 
  deleteComment,
  clearSimulatedComments,
  generateSimulatedComments,
  type AdminComment 
} from '../../lib/admin-api';

type CommentStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'SPAM';

const statusLabels: Record<string, string> = {
  APPROVED: '已通过',
  PENDING: '待审核',
  REJECTED: '已拒绝',
  SPAM: '垃圾',
};

const statusColors: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  SPAM: 'bg-gray-100 text-gray-700',
};

export function CommentManager() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommentStatus | 'all'>('all');
  const [simulatedFilter, setSimulatedFilter] = useState<boolean | 'all'>('all');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadComments();
  }, [statusFilter, simulatedFilter]);

  async function loadComments() {
    setLoading(true);
    try {
      const data = await listAdminComments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        isSimulated: simulatedFilter === 'all' ? undefined : simulatedFilter,
        page: 1,
        pageSize: 50,
      });
      setComments(data.items);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredComments = comments.filter(comment => {
    const matchesSearch = search === '' || 
      comment.content.toLowerCase().includes(search.toLowerCase()) ||
      comment.authorName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  async function handleStatusChange(commentId: string, newStatus: CommentStatus) {
    try {
      await updateCommentStatus(commentId, newStatus);
      setComments(comments.map(c => c.id === commentId ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('更新状态失败');
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('确定要删除这条评论吗？')) return;
    
    try {
      await deleteComment(commentId, '管理员删除');
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('删除失败');
    }
  }

  async function handleGenerateSimulated() {
    if (!confirm('生成模拟评论将创建真实有趣的讨论内容。继续？')) return;
    
    setGenerating(true);
    try {
      const result = await generateSimulatedComments({ countPerDiscussion: 3 });
      alert(`成功生成 ${result.count} 条模拟评论！`);
      await loadComments();
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('生成失败，请确保已创建模拟用户');
    } finally {
      setGenerating(false);
    }
  }

  async function handleClearSimulated() {
    if (!confirm('确定要清除所有模拟评论吗？此操作不可恢复。')) return;
    
    try {
      const result = await clearSimulatedComments();
      alert(`已清除 ${result.deleted} 条模拟评论`);
      await loadComments();
    } catch (error) {
      console.error('Failed to clear:', error);
      alert('清除失败');
    }
  }

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedComments(newSelected);
  }

  async function handleBulkAction(action: 'approve' | 'reject' | 'delete') {
    if (selectedComments.size === 0) return;
    
    const ids = Array.from(selectedComments);
    
    try {
      if (action === 'delete') {
        for (const id of ids) {
          await deleteComment(id, '批量删除');
        }
        setComments(comments.filter(c => !selectedComments.has(c.id)));
      } else {
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
        for (const id of ids) {
          await updateCommentStatus(id, status);
        }
        setComments(comments.map(c => selectedComments.has(c.id) ? { ...c, status } : c));
      }
      setSelectedComments(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('批量操作失败');
    }
  }

  const simulatedCount = comments.filter(c => c.isSimulated).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">评论管理</h1>
        <button
          onClick={loadComments}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总评论</p>
          <p className="text-2xl font-semibold">{comments.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">待审核</p>
          <p className="text-2xl font-semibold text-yellow-600">
            {comments.filter(c => c.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已通过</p>
          <p className="text-2xl font-semibold text-green-600">
            {comments.filter(c => c.status === 'APPROVED').length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">模拟评论</p>
          <p className="text-2xl font-semibold text-blue-600">{simulatedCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">模拟数据生成</h3>
        <p className="text-sm text-blue-700 mb-3">
          生成真实有趣的模拟评论来填充讨论区。这些评论会根据不同用户画像（独立开发者、产品经理、设计师等）生成符合角色的内容。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSimulated}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {generating ? '生成中...' : '生成模拟评论'}
          </button>
          <button
            onClick={handleClearSimulated}
            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
          >
            清除模拟评论
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索评论内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CommentStatus | 'all')}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已拒绝</option>
          <option value="SPAM">垃圾</option>
        </select>

        <select
          value={String(simulatedFilter)}
          onChange={(e) => setSimulatedFilter(e.target.value === 'all' ? 'all' : e.target.value === 'true')}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部来源</option>
          <option value="true">仅模拟</option>
          <option value="false">仅真实</option>
        </select>

        {selectedComments.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              批量通过
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              批量拒绝
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              批量删除
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedComments(new Set(filteredComments.map(c => c.id)));
                      } else {
                        setSelectedComments(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">评论内容</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">作者</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">讨论</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredComments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedComments.has(comment.id)}
                      onChange={() => toggleSelection(comment.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm line-clamp-2 max-w-md">{comment.content}</p>
                    {comment.isSimulated && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <Bot className="w-3 h-3" />
                        模拟
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {comment.author?.isSimulated ? (
                        <Bot className="w-4 h-4 text-blue-500" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm">{comment.authorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="line-clamp-1 max-w-[200px]">{comment.discussion.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={comment.status}
                      onChange={(e) => handleStatusChange(comment.id, e.target.value as CommentStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[comment.status]}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {comment.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleStatusChange(comment.id, 'APPROVED')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="通过"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {comment.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleStatusChange(comment.id, 'REJECTED')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="拒绝"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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
          {filteredComments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              没有找到匹配的评论
            </div>
          )}
        </div>
      )}
    </div>
  );
}
