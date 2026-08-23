import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserDto, AuthResponseData } from "@scalable-auth/shared";
import { api, setAccessToken, getAccessToken } from "../api/client";

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponseData) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(() => {
    return localStorage.getItem("pending_verification_email");
  });

  const handleSetPendingEmail = (email: string | null) => {
    setPendingVerificationEmail(email);
    if (email) {
      localStorage.setItem("pending_verification_email", email);
    } else {
      localStorage.removeItem("pending_verification_email");
    }
  };

  const login = (authData: AuthResponseData) => {
    setUser(authData.user);
    setAccessToken(authData.tokens.accessToken);
    handleSetPendingEmail(null);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const logoutAll = async () => {
    try {
      await api.post("/api/auth/logout-all");
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get("/api/auth/me");
      if (res.data.success) {
        setUser(res.data.data.user);
      }
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  };

  // Attempt initial session restore on mount via HttpOnly refresh cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post("/api/auth/refresh");
        if (res.data.success) {
          setUser(res.data.data.user);
          setAccessToken(res.data.data.tokens.accessToken);
        }
      } catch {
        // No active session cookie
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        logoutAll,
        refreshUser,
        pendingVerificationEmail,
        setPendingVerificationEmail: handleSetPendingEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
