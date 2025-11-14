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
      sessionStorage.setItem("authToken", data.token);
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

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
          {/* Logo/Brand */}
          <div className="text-center mb-10">
            <h1 className="text-4xl mb-3">be4real</h1>
            <p className="text-gray-600 text-lg">Welcome back</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}

          {/* Login Form */}
          {!showCodeInput ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm mb-2 text-gray-700">
                  Username or Email
                </label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="username or you@example.com"
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
            </form>
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
