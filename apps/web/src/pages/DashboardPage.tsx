import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { SessionCard } from "../components/SessionCard";
import { SessionDto } from "@scalable-auth/shared";
import { ShieldCheck, User, Key, RefreshCw, Smartphone, LogOut, Terminal, CheckCircle2 } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user, logout, logoutAll } = useAuth();
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Protected API Playground State
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [tokenRefreshedMsg, setTokenRefreshedMsg] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/api/sessions");
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await api.delete(`/api/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to revoke session", err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleTestProtectedApi = async () => {
    setApiLoading(true);
    const start = performance.now();
    try {
      const res = await api.get("/api/auth/me");
      setApiLatency(Math.round(performance.now() - start));
      setApiResponse(res.data);
    } catch (err: any) {
      setApiLatency(Math.round(performance.now() - start));
      setApiResponse(err.response?.data || { error: err.message });
    } finally {
      setApiLoading(false);
    }
  };

  const handleForceTokenRefresh = async () => {
    setApiLoading(true);
    try {
      const res = await api.post("/api/auth/refresh");
      setTokenRefreshedMsg(`Access token refreshed! New expiry in ${res.data.data.tokens.expiresIn}s`);
      setTimeout(() => setTokenRefreshedMsg(null), 4000);
      fetchSessions();
    } catch (err: any) {
      setApiResponse(err.response?.data || { error: "Refresh failed" });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">{user?.name}</h1>
              {user?.emailVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={logoutAll}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs sm:text-sm font-medium rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout All Devices</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Protected API Tester */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Terminal className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Protected API Explorer</h2>
            </div>
            <span className="text-xs text-slate-400">Stateless JWT Bearer Auth</span>
          </div>

          <p className="text-xs text-slate-400">
            Test sending authenticated requests to protected endpoints. The Axios client automatically injects the short-lived access token and auto-refreshes if it expires.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTestProtectedApi}
              disabled={apiLoading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center space-x-2"
            >
              <Terminal className="w-4 h-4" />
              <span>GET /api/auth/me</span>
            </button>

            <button
              onClick={handleForceTokenRefresh}
              disabled={apiLoading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${apiLoading ? "animate-spin" : ""}`} />
              <span>Rotate Refresh Token</span>
            </button>
          </div>

          {tokenRefreshedMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{tokenRefreshedMsg}</span>
            </div>
          )}

          {apiResponse && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Response Payload:</span>
                {apiLatency && <span className="font-mono text-emerald-400">{apiLatency}ms</span>}
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-60">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Active Device Sessions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Active Sessions</h2>
            </div>
            <button
              onClick={fetchSessions}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Refresh sessions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Sessions are tracked in PostgreSQL with cryptographically hashed refresh tokens. Revoking a session will immediately prevent further token rotations.
          </p>

          {isLoadingSessions ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No active sessions found</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onRevoke={handleRevokeSession}
                  isRevoking={revokingId === session.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
