import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app start
    const checkAuth = () => {
      console.log('AuthContext: Checking authentication...');
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        console.log('AuthContext: Tokens found -', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasStoredUser: !!storedUser
        });

        if (accessToken && refreshToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log('AuthContext: Restored user session:', userData.email);
          } catch (parseError) {
            console.error('AuthContext: Error parsing stored user data:', parseError);
            // Clear invalid stored data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('AuthContext: No existing authentication found');
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Error checking authentication:', error);
        setUser(null);
      } finally {
        console.log('AuthContext: Setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
