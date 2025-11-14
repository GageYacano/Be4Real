import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
  onRegisterSuccess?: (token: string) => void;
}

const SERVER_URL = "http://bef4real.life/api";
const LOCAL_URL = "http://localhost:3000"; 

export function RegisterPage({ onSwitchToLogin, onRegisterSuccess }: RegisterPageProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    agreedToTerms: false,
    password: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      // Basic validation for password/email/username
      if (!formData.username || !formData.email || !formData.password) {
        setError("Please fill username, email and password");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      // Call register
      try {
        setLoading(true);
        const res = await fetch(`${LOCAL_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message ?? "Registration failed");
        // Success -> trigger verification code email, then show verification step
        try {
          await fetch(`${LOCAL_URL}/auth/send-verification`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email.trim() }),
          });
        } catch {}
        setStep(3);
      } catch (err: any) {
        setError(err.message ?? "Registration failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await fetch(`${LOCAL_URL}/auth/verify-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim(), code: verificationCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Verification failed");
      localStorage.setItem("authToken", data.token);
      if (onRegisterSuccess) {
        onRegisterSuccess(data.token);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  async function handleResend() {
    setError(null);
    try {
      await fetch(`${LOCAL_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim() }),
      });
    } catch {}
  }

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
          <h2 className="text-2xl mb-2 text-gray-800">Welcome to be4real</h2>
          <p className="text-gray-600 text-lg">Create your account</p>
        </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-black' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-black' : 'bg-gray-200'}`} />
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={handleContinue} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm mb-2 text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm mb-2 text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-black transition-colors"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                Continue
              </Button>
            </form>
          )}

          {/* Step 2: Terms */}
          {step === 2 && (
            <form onSubmit={handleContinue} className="space-y-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 hover:text-black mb-2 flex items-center gap-2"
              >
                ← Back
              </button>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreedToTerms", checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to allow be4real to take random photos using my device camera and share them with my friends
                </label>
              </div>

              <Button
                type="submit"
                disabled={!formData.agreedToTerms || loading}
                className="w-full h-11 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create account"}
              </Button>
            </form>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <form onSubmit={handleVerify} className="space-y-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm text-gray-600 hover:text-black mb-2 flex items-center gap-2"
              >
                ← Back
              </button>

              <div>
                <p className="text-sm text-gray-600 mb-4">
                  We sent a verification code to {formData.email}
                </p>
                <label htmlFor="code" className="block text-sm mb-2 text-gray-700">
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
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
                {loading ? "Verifying..." : "Verify & Continue"}
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
              Already have an account?{" "}
              <button 
                onClick={onSwitchToLogin}
                className="text-black hover:underline"
              >
                Log in
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
