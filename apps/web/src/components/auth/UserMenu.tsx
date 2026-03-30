import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { User, LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setIsOpen(false);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          to="/login"
          className="text-sm text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-ink)] transition-colors"
        >
          登录
        </Link>
        <Link 
          to="/register"
          className="text-sm px-3 py-1.5 bg-[color:var(--color-brand-ink)] text-white hover:opacity-90 transition-opacity"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-full border border-[color:var(--color-brand-line)] bg-[color:var(--color-brand-surface)] px-2.5 py-1.5 transition-colors hover:border-[color:var(--color-brand-accent)]"
      >
        <div className="h-9 w-9 rounded-full bg-[color:var(--color-brand-accent)] text-white flex items-center justify-center text-sm font-medium overflow-hidden">
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.displayName} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user?.displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="hidden min-w-0 text-left sm:block">
          <div className="max-w-[120px] truncate text-sm font-medium text-[color:var(--color-brand-ink)]">{user?.displayName}</div>
          <div className="max-w-[120px] truncate text-[11px] text-[color:var(--color-brand-muted)]">@{user?.username}</div>
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-[color:var(--color-brand-surface)] border border-[color:var(--color-brand-line)] shadow-lg z-50">
            <div className="p-3 border-b border-[color:var(--color-brand-line)]">
              <p className="font-medium text-sm">{user?.displayName}</p>
              <p className="text-xs text-[color:var(--color-brand-muted)]">@{user?.username}</p>
            </div>
            
            <div className="py-1">
              {user?.role === 'ADMIN' ? (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-left text-sm text-[color:var(--color-brand-ink)] hover:bg-black/5"
                >
                  进入后台
                </Link>
              ) : null}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
