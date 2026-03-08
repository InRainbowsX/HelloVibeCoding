// Admin API client for the management system

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getAdminToken(): string {
  return localStorage.getItem('adminToken') || '';
}

export interface ContentStats {
  apps: Record<string, number>;
  discussions: Record<string, number>;
  comments: Record<string, number>;
  simulatedComments: number;
}

export interface ReviewQueue {
  apps: Array<{
    id: string;
    name: string;
    slug: string;
    contentStatus: string;
    createdAt: string;
    pattern?: { id: string; name: string } | null;
  }>;
  discussions: Array<{
    id: string;
    title: string;
    contentStatus: string;
    createdAt: string;
    app?: { id: string; name: string; slug: string } | null;
    incubation?: { id: string; title: string; slug: string } | null;
  }>;
  comments: Array<{
    id: string;
    content: string;
    status: string;
    createdAt: string;
    discussion: { id: string; title: string };
    author?: { id: string; username: string; displayName: string } | null;
  }>;
  totalCount: number;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  isSimulated: boolean;
  persona?: string | null;
  createdAt: string;
  commentCount: number;
  discussionCount: number;
}

export interface AdminComment {
  id: string;
  content: string;
  authorName: string;
  status: string;
  isSimulated: boolean;
  createdAt: string;
  discussion: {
    id: string;
    title: string;
    targetType: string;
  };
  author?: {
    id: string;
    username: string;
    displayName: string;
    isSimulated: boolean;
  } | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  createdAt: string;
  admin: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface AppContent {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  saveTimeLabel: string;
  category: string;
  pricing: string;
  channels: string[];
  targetPersona: string;
  hookAngle: string;
  trustSignals: string[];
  heatScore: number;
  difficulty: number;
  contentStatus: string;
  screenshotUrls: string[];
  pattern?: { id: string; name: string; slug: string } | null;
  teardown?: TeardownContent | null;
  assetBundle?: AssetBundleContent | null;
  discussionCount?: number;
  ideaBlockCount?: number;
  incubationCount?: number;
  roomCount?: number;
}

export interface TeardownContent {
  id: string;
  painSummary: string;
  painScore: string;
  triggerScene: string;
  corePromise: string;
  coreLoop: string;
  keyConstraints: string[];
  mvpScope: string;
  dataInput?: string | null;
  dataOutput?: string | null;
  faultTolerance?: string | null;
  coldStartStrategy: string;
  pricingLogic: string;
  competitorDelta: string;
  riskNotes: string;
  expansionSteps: string[];
  reverseIdeas: string[];
}

export interface AssetBundleContent {
  id: string;
  hasAgentsTemplate: boolean;
  hasSpecTemplate: boolean;
  hasPromptPack: boolean;
  agentsTemplate?: string | null;
  specTemplate?: string | null;
  promptPack?: string | null;
}

export interface AppDetail extends AppContent {
  discussions: Array<{
    id: string;
    title: string;
    summary?: string | null;
    likesCount: number;
    replyCount: number;
    createdAt: string;
  }>;
  incubationLinks: Array<{
    id: string;
    incubation: {
      id: string;
      slug: string;
      title: string;
      oneLiner: string;
      status: string;
    };
  }>;
  ideaBlockSources: Array<{
    id: string;
    ideaBlock: {
      id: string;
      slug: string;
      title: string;
      blockType: string;
      summary: string;
    };
  }>;
  rooms: Array<{
    id: string;
    slug: string;
    name: string;
    goal: string;
    status: string;
  }>;
}

export interface DiscussionContent {
  id: string;
  title: string;
  summary?: string | null;
  likesCount: number;
  replyCount: number;
  contentStatus: string;
  createdAt: string;
  app?: { id: string; name: string; slug: string } | null;
  incubation?: { id: string; title: string; slug: string } | null;
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': getAdminToken(),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Admin request failed: ${response.status} - ${error}`);
  }

  return response.json() as Promise<T>;
}

// ==================== Content Stats & Review Queue ====================

export function getContentStats() {
  return adminRequest<ContentStats>('/admin/content-stats');
}

export function getReviewQueue() {
  return adminRequest<ReviewQueue>('/admin/review-queue');
}

// ==================== App Management ====================

export function listAdminApps() {
  return adminRequest<{ items: AppContent[]; total: number }>('/admin/apps');
}

export function getAdminAppDetail(id: string) {
  return adminRequest<AppDetail>(`/admin/apps/${id}`);
}

export function updateAppContent(id: string, data: Partial<AppContent>) {
  return adminRequest<AppContent>(`/admin/apps/${id}/content`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function updateTeardown(appId: string, data: Partial<TeardownContent>) {
  return adminRequest<TeardownContent>(`/admin/apps/${appId}/teardown`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function updateAssetBundle(appId: string, data: Partial<AssetBundleContent>) {
  return adminRequest<AssetBundleContent>(`/admin/apps/${appId}/asset-bundle`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function bulkUpdateAppStatus(ids: string[], status: string, reason?: string) {
  return adminRequest<{ count: number }>('/admin/apps/bulk-status', {
    method: 'POST',
    body: JSON.stringify({ ids, status, reason }),
  });
}

// ==================== Discussion Management ====================

export function listAdminDiscussions() {
  return adminRequest<{ items: DiscussionContent[] }>('/admin/discussions');
}

export function updateDiscussionContent(id: string, data: Partial<DiscussionContent>) {
  return adminRequest<DiscussionContent>(`/admin/discussions/${id}/content`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ==================== Comment Management ====================

export function listAdminComments(options?: { 
  status?: string; 
  isSimulated?: boolean; 
  page?: number; 
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.isSimulated !== undefined) params.set('isSimulated', String(options.isSimulated));
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('pageSize', String(options.pageSize));
  
  return adminRequest<{ items: AdminComment[]; total: number; page: number; pageSize: number }>(
    `/admin/comments?${params.toString()}`
  );
}

export function updateCommentStatus(id: string, status: string, reason?: string) {
  return adminRequest<AdminComment>(`/admin/comments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
}

export function bulkUpdateCommentStatus(ids: string[], status: string, reason?: string) {
  return adminRequest<{ count: number }>('/admin/comments/bulk-status', {
    method: 'POST',
    body: JSON.stringify({ ids, status, reason }),
  });
}

export function deleteComment(id: string, reason?: string) {
  return adminRequest<{ success: boolean }>(`/admin/comments/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

// ==================== User Management ====================

export function listAdminUsers(options?: {
  isSimulated?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (options?.isSimulated !== undefined) params.set('isSimulated', String(options.isSimulated));
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('pageSize', String(options.pageSize));
  if (options?.search) params.set('search', options.search);
  
  return adminRequest<{ items: AdminUser[]; total: number; page: number; pageSize: number }>(
    `/admin/users?${params.toString()}`
  );
}

export function getAdminUser(id: string) {
  return adminRequest<AdminUser>(`/admin/users/${id}`);
}

export function createUser(data: {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}) {
  return adminRequest<AdminUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUser(id: string, data: Partial<AdminUser>) {
  return adminRequest<AdminUser>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string) {
  return adminRequest<{ success: boolean }>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Simulated Data ====================

export function createSimulatedUsers(count?: number) {
  return adminRequest<{ count: number; users: Array<{ id: string; username: string; displayName: string }> }>(
    '/admin/simulated/users',
    {
      method: 'POST',
      body: JSON.stringify({ count }),
    }
  );
}

export function generateSimulatedComments(options?: {
  discussionIds?: string[];
  countPerDiscussion?: number;
  userIds?: string[];
}) {
  return adminRequest<{ count: number; comments: Array<{ id: string; discussionId: string; authorName: string }> }>(
    '/admin/simulated/comments',
    {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }
  );
}

export function clearSimulatedComments() {
  return adminRequest<{ deleted: number }>('/admin/simulated/comments', {
    method: 'DELETE',
  });
}

// ==================== Idea Blocks ====================

export interface IdeaBlockContent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  blockType: 'FORMULA' | 'FEATURE' | 'WORKFLOW' | 'CHANNEL';
  tags: string[];
  noveltyNote?: string | null;
  sourceCount?: number;
  incubationCount?: number;
  sources?: Array<{
    id: string;
    app: { id: string; name: string; slug: string };
  }>;
}

export function listAdminIdeaBlocks() {
  return adminRequest<{ items: IdeaBlockContent[]; total: number }>('/admin/idea-blocks');
}

export function createIdeaBlock(data: Partial<IdeaBlockContent>) {
  return adminRequest<IdeaBlockContent>('/admin/idea-blocks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateIdeaBlock(id: string, data: Partial<IdeaBlockContent>) {
  return adminRequest<IdeaBlockContent>(`/admin/idea-blocks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteIdeaBlock(id: string) {
  return adminRequest<{ success: boolean }>(`/admin/idea-blocks/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Incubations ====================

export interface IncubationContent {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  status: 'OPEN' | 'VALIDATING' | 'BUILDING' | 'ARCHIVED';
  tags?: string[];
  blockCount?: number;
  sourceProjectCount?: number;
  discussionCount?: number;
  roomCount?: number;
  blocks?: Array<{
    id: string;
    ideaBlock: { id: string; title: string; slug: string };
  }>;
  sourceProjects?: Array<{
    id: string;
    app: { id: string; name: string; slug: string };
  }>;
}

export function listAdminIncubations() {
  return adminRequest<{ items: IncubationContent[]; total: number }>('/admin/incubations');
}

export function updateIncubation(id: string, data: Partial<IncubationContent>) {
  return adminRequest<IncubationContent>(`/admin/incubations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteIncubation(id: string) {
  return adminRequest<{ success: boolean }>(`/admin/incubations/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Audit Logs ====================

export function getAuditLogs(page?: number, pageSize?: number) {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));
  
  return adminRequest<{ items: AuditLog[]; total: number; page: number; pageSize: number }>(
    `/admin/audit-logs?${params.toString()}`
  );
}

// ==================== Submissions ====================

export function listSubmissions(status?: string) {
  const params = status ? `?status=${status}` : '';
  return adminRequest<Array<{
    id: string;
    productName: string;
    websiteUrl: string;
    contactEmail: string;
    status: string;
    createdAt: string;
  }>>(`/admin/submissions${params}`);
}

export function reviewSubmission(id: string, data: { status: 'APPROVED' | 'REJECTED'; slug?: string }) {
  return adminRequest<{ submission: unknown; createdApp: unknown | null }>(
    `/admin/submissions/${id}/review`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}
