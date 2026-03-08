// Auth API client

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  isSimulated: boolean;
  createdAt: string;
  commentCount?: number;
  discussionCount?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Token 管理
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// 用户信息管理
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

export function setStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeStoredUser() {
  localStorage.removeItem(USER_KEY);
}

// 带认证的请求
async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token 过期或无效，清除登录状态
      logout();
    }
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// 注册
export async function register(username: string, password: string, displayName: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, displayName }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Registration failed');
  }

  const data = await response.json() as AuthResponse;
  
  // 保存登录状态
  setToken(data.token);
  setStoredUser(data.user);
  
  return data;
}

// 登录
export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Login failed');
  }

  const data = await response.json() as AuthResponse;
  
  // 保存登录状态
  setToken(data.token);
  setStoredUser(data.user);
  
  return data;
}

// 获取当前用户
export async function getMe(): Promise<User> {
  return authRequest<User>('/auth/me');
}

// 登出
export function logout() {
  removeToken();
  removeStoredUser();
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return !!getToken();
}
