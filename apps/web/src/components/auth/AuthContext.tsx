import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  getStoredUser, 
  setStoredUser, 
  removeStoredUser,
  getToken,
  removeToken,
  getMe,
  type User,
  type AuthResponse 
} from '../../lib/auth-api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：从 localStorage 恢复用户状态
  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getToken();
    
    if (storedUser && token) {
      setUser(storedUser);
      // 可选：验证 token 是否有效并刷新用户信息
      refreshUser().catch(() => {
        // Token 无效，登出
        logout();
      });
    }
    
    setIsLoading(false);
  }, []);

  function login(data: AuthResponse) {
    setUser(data.user);
    setStoredUser(data.user);
  }

  function logout() {
    setUser(null);
    removeStoredUser();
    removeToken();
  }

  async function refreshUser() {
    try {
      const freshUser = await getMe();
      setUser(freshUser);
      setStoredUser(freshUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
