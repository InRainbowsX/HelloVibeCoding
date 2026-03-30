import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, type AuthResponse } from '../../lib/auth-api';
import { setAuthFlashMessage } from '../../lib/auth-flash';
import { runLoginSuccessFlow } from '../../lib/login-success';
import { useAuth } from './AuthContext';

interface LoginPageProps {
  onLogin?: (data: AuthResponse) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const { login: syncAuthState } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await login(username, password);
      runLoginSuccessFlow(data, {
        syncAuthState,
        onLogin,
      });
      setAuthFlashMessage(`登录成功，欢迎回来 ${data.user.displayName}`);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-brand-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[color:var(--color-brand-surface)] border border-[color:var(--color-brand-line)] p-8">
          <h1 className="text-2xl font-bold text-center mb-2">欢迎回来</h1>
          <p className="text-sm text-[color:var(--color-brand-muted)] text-center mb-8">
            登录后参与讨论、创建孵化项目
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                className="w-full px-3 py-2 border border-[color:var(--color-brand-line)] bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full px-3 py-2 border border-[color:var(--color-brand-line)] bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[color:var(--color-brand-ink)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[color:var(--color-brand-muted)]">
            还没有账号？{' '}
            <Link 
              to="/register" 
              className="text-[color:var(--color-brand-accent)] hover:underline"
            >
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
