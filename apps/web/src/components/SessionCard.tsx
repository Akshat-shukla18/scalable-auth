import React from "react";
import { SessionDto } from "@scalable-auth/shared";
import { Laptop, Smartphone, Globe, Trash2, CheckCircle2 } from "lucide-react";

interface SessionCardProps {
  session: SessionDto;
  onRevoke: (sessionId: string) => Promise<void>;
  isRevoking: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onRevoke, isRevoking }) => {
  const isMobile = /mobile|android|iphone|ipad/i.test(session.userAgent || "");
  const formattedDate = new Date(session.lastUsedAt).toLocaleString();

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      session.isCurrent
        ? "bg-blue-950/20 border-blue-500/30 shadow-lg shadow-blue-500/5"
        : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-lg ${session.isCurrent ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-400"}`}>
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-slate-200">
                {session.userAgent || "Unknown Client / API Session"}
              </h4>
              {session.isCurrent && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  This Device
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center space-x-3 text-xs text-slate-400">
              <span className="flex items-center">
                <Globe className="w-3 h-3 mr-1 text-slate-500" />
                IP: {session.ipAddress || "127.0.0.1"}
              </span>
              <span>•</span>
              <span>Last active: {formattedDate}</span>
            </div>
          </div>
        </div>

        {!session.isCurrent && (
          <button
            onClick={() => onRevoke(session.id)}
            disabled={isRevoking}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Revoke session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
