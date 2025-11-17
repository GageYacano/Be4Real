import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const SERVER_URL = "http://bef4real.life/api";
const LOCAL_URL = "http://localhost:3000"; 

interface LoginPageProps {
  onSwitchToRegister?: () => void;
  onLoginSuccess?: (token: string) => void;
}

export function LoginPage({ onSwitchToRegister, onLoginSuccess }: LoginPageProps) {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetStage, setResetStage] = useState<"request" | "confirm">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${LOCAL_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data?.needsVerification) {
          setShowCodeInput(true);
          return;
        }
        throw new Error(data?.message ?? "Login failed");
      }
      localStorage.setItem("authToken", data.token);
      if (onLoginSuccess) {
        onLoginSuccess(data.token);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const verifyEmail = identifier.trim();
      if (!/@/.test(verifyEmail)) {
        throw new Error("Please enter the email associated with your account.");
      }

      const res = await fetch(`${LOCAL_URL}/auth/verify-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Verification failed");
      sessionStorage.setItem("authToken", data.token);
      if (onLoginSuccess) {
        onLoginSuccess(data.token);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      const resendEmail = identifier.trim();
      if (!/@/.test(resendEmail)) {
        throw new Error("Please enter your email to resend the verification code.");
      }
      await fetch(`${LOCAL_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
    } catch (err: any) {
      setError(err?.message ?? "Unable to resend verification code");
    }
  }

  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const targetEmail = (resetEmail || identifier).trim();
    if (!/@/.test(targetEmail)) {
      setError("Please enter a valid email to reset your password.");
      return;
    }
    try {
      setResetLoading(true);
      await fetch(`${LOCAL_URL}/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      setResetEmail(targetEmail);
      setResetStage("confirm");
    } catch (err: any) {
      setError(err?.message ?? "Unable to send reset code");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!resetEmail || !resetCode || !resetPassword) {
      setError("Please fill email, code, and new password.");
      return;
    }
    try {
      setResetLoading(true);
      const res = await fetch(`${LOCAL_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          newPassword: resetPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Unable to reset password");
      setShowReset(false);
      setResetStage("request");
      setResetCode("");
      setResetPassword("");
      setError("Password reset! Please sign in with your new password.");
    } catch (err: any) {
      setError(err?.message ?? "Unable to reset password");
    } finally {
      setResetLoading(false);
    }
  }

  const resetForm =
    resetStage === "request" ? (
      <form onSubmit={handleSendResetCode} className="space-y-6">
        <div>
          <label htmlFor="reset-email" className="block text-sm mb-2 text-gray-700">
            Email
          </label>
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          disabled={resetLoading}
        >
          {resetLoading ? "Sending..." : "Send reset code"}
        </Button>
      </form>
    ) : (
      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label htmlFor="reset-code" className="block text-sm mb-2 text-gray-700">
            Verification Code
          </label>
          <Input
            id="reset-code"
            type="text"
            placeholder="000000"
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors text-center tracking-widest"
            maxLength={6}
            required
          />
        </div>
        <div>
          <label htmlFor="reset-password" className="block text-sm mb-2 text-gray-700">
            New Password
          </label>
          <Input
            id="reset-password"
            type="password"
            placeholder="••••••••"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          disabled={resetLoading}
        >
          {resetLoading ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    );

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
          {/* Logo/Brand */}
          <div className="text-center mb-10">
            <h1 className="text-4xl mb-3 font-extrabold tracking-tight uppercase flex items-center gap-0 justify-center">
              <span className="inline-block">BE</span>
              <span className="inline-flex items-center justify-center mx-1 w-14 h-14 bg-black text-white text-5xl font-extrabold rounded-full">4</span>
              <span className="inline-block">REAL.</span>
            </h1>
            <p className="text-gray-600 text-lg">Welcome back</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}

          {/* Login Form */}
          {!showCodeInput && !showReset ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm mb-2 text-gray-700">
                  Email
                </label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm mb-2 text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <button
                type="button"
                className="text-sm text-gray-600 hover:text-black"
                onClick={() => {
                  setShowReset(true);
                  setResetStage("request");
                  setResetEmail(identifier);
                  setError(null);
                }}
              >
                Forgot password?
              </button>
            </form>
          ) : showReset ? (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setShowReset(false);
                  setResetStage("request");
                  setResetEmail("");
                  setResetCode("");
                  setResetPassword("");
                  setError(null);
                }}
                className="text-sm text-gray-600 hover:text-black flex items-center gap-2"
              >
                ← Back to login
              </button>
              {resetForm}
            </div>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setShowCodeInput(false)}
                  className="text-sm text-gray-600 hover:text-black mb-4 flex items-center gap-2"
                >
                  ← Back
                </button>
                <p className="text-sm text-gray-600 mb-4">
                  We sent a code to {identifier}
                </p>
                <label htmlFor="code" className="block text-sm mb-2 text-gray-700">
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors text-center tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Log In"}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-gray-600 hover:text-black"
                onClick={handleResend}
              >
                Didn't receive a code? Resend
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Don't have an account?{" "}
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onSwitchToRegister) {
                    onSwitchToRegister();
                  }
                }}
                className="text-black hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
            <div className="mt-4 flex justify-center gap-6">
              <a href="#" className="hover:text-black">
                Privacy
              </a>
              <a href="#" className="hover:text-black">
                Terms
              </a>
              <a href="#" className="hover:text-black">
                Help
              </a>
            </div>
          </div>
      </div>
    </div>
  );
}
