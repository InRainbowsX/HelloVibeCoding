import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, type AuthResponse } from '../../lib/auth-api';

interface RegisterPageProps {
  onLogin?: (data: AuthResponse) => void;
}

export function RegisterPage({ onLogin }: RegisterPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await register(
        username, 
        password, 
        displayName.trim() || username
      );
      onLogin?.(data);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-brand-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[color:var(--color-brand-surface)] border border-[color:var(--color-brand-line)] p-8">
          <h1 className="text-2xl font-bold text-center mb-2">创建账号</h1>
          <p className="text-sm text-[color:var(--color-brand-muted)] text-center mb-8">
            加入我们，发现和创造新产品
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
                placeholder="设置用户名（唯一标识）"
                className="w-full px-3 py-2 border border-[color:var(--color-brand-line)] bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                显示名称 <span className="text-[color:var(--color-brand-muted)] font-normal">（可选）</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="别人看到的名字（默认使用用户名）"
                className="w-full px-3 py-2 border border-[color:var(--color-brand-line)] bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置密码（至少6位）"
                className="w-full px-3 py-2 border border-[color:var(--color-brand-line)] bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-3 py-2 border border-[color:var(--color-brand-line)] bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[color:var(--color-brand-ink)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[color:var(--color-brand-muted)]">
            已有账号？{' '}
            <Link 
              to="/login" 
              className="text-[color:var(--color-brand-accent)] hover:underline"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
