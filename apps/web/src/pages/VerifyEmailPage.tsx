import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { OtpInput } from "../components/OtpInput";
import { Mail, CheckCircle2, RefreshCw, AlertCircle, Inbox } from "lucide-react";

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pendingVerificationEmail, setPendingVerificationEmail } = useAuth();

  const [email, setEmail] = useState(() => {
    return searchParams.get("email") || pendingVerificationEmail || "";
  });

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Peek mock mailbox for dev convenience
  const checkDevMailbox = async () => {
    if (!email) return;
    try {
      const res = await api.get(`/api/dev/mailbox/latest-code?email=${encodeURIComponent(email)}`);
      if (res.data.success && res.data.data.code) {
        setDevOtp(res.data.data.code);
      }
    } catch {
      // Dev routes might not be available in production
    }
  };

  useEffect(() => {
    checkDevMailbox();
  }, [email]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6 || !email) return;

    setError(null);
    setSuccess(null);
    setIsVerifying(true);

    try {
      const res = await api.post("/api/auth/verify-email", { email, code });
      if (res.data.success) {
        setSuccess("Email verified successfully! Redirecting to login...");
        setPendingVerificationEmail(null);
        setTimeout(() => {
          navigate("/login?verified=1");
        }, 1500);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Invalid or expired verification code.";
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending || !email) return;
    setError(null);
    setIsResending(true);

    try {
      const res = await api.post("/api/auth/resend-code", { email });
      if (res.data.success) {
        setSuccess("A new verification code has been dispatched to your email.");
        setCountdown(60);
        setTimeout(() => checkDevMailbox(), 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl mb-3 text-blue-400">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Verify your email</h2>
          <p className="text-sm text-slate-400 mt-1">
            We sent a 6-digit verification code to
          </p>
          <div className="mt-2 text-sm font-semibold text-blue-400 bg-blue-500/10 py-1 px-3 rounded-lg inline-block">
            {email || "your email address"}
          </div>
        </div>

        {/* Mock dev mailbox helper banner */}
        {devOtp && (
          <div className="mb-6 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span><strong>Dev Mailbox Code:</strong> <code className="font-mono font-bold text-white bg-indigo-900/50 px-1.5 py-0.5 rounded">{devOtp}</code></span>
            </div>
            <button
              type="button"
              onClick={() => setCode(devOtp)}
              className="text-xs text-indigo-400 hover:text-white underline ml-2"
            >
              Fill Code
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          {!email && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 text-center mb-3">
              Enter the 6-digit code
            </label>
            <OtpInput value={code} onChange={setCode} disabled={isVerifying} />
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || isVerifying}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all"
          >
            {isVerifying ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-1">
          <span>Didn't receive the email?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isResending ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
};
