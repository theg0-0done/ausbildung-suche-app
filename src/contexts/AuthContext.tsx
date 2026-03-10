import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authApi } from "../userApi";

export interface User {
  id: number;
  email: string;
  displayName: string;
  location?: string;
  birthday?: string;
  bereich?: string;
  jobart?: string;
  theme?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("auth_token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check token validity on mount
    const checkAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      // If we already have a user in memory (e.g. just logged in via login function),
      // we don't need to fetch getMe again immediately.
      if (user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authApi.getMe();
        setUser(data.user);
      } catch (err) {
        // Token invalid or expired
        console.error("Session expired or invalid:", err);
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token, user]); // Added user to dependencies so it can check if already set

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    setUser(userData);
    setIsLoading(false); // Ensure loading is false right after manual login
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
