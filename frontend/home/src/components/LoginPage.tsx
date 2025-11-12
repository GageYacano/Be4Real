import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      setShowCodeInput(true);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Verifying code:", code);
    // Handle login logic here
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex" style={{ width: '1440px', height: '1024px' }}>
      {/* Left side - Hero Image */}
      <div className="w-3/5 relative overflow-hidden bg-black">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"
          alt="Friends enjoying authentic moments"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute bottom-16 left-16 text-white max-w-lg">
          <h2 className="text-5xl mb-6">Share Your Real Life.</h2>
          <p className="text-xl opacity-90">
            No filters. No likes. Just you and your friends, being real.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-2/5 flex items-center justify-center bg-white p-12">
        <div className="w-full max-w-sm">
          {/* Logo/Brand */}
          <div className="text-center mb-10">
            <h1 className="text-4xl mb-3">be4real</h1>
            <p className="text-gray-600 text-lg">Welcome back</p>
          </div>

          {/* Login Form */}
          {!showCodeInput ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm mb-2 text-gray-700">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Continue with Apple
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Continue with Google
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
                  We sent a code to {phoneNumber}
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
              >
                Verify & Log In
              </Button>

              <button
                type="button"
                className="w-full text-sm text-gray-600 hover:text-black"
              >
                Didn't receive a code? Resend
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Don't have an account?{" "}
              <button className="text-black hover:underline">Sign up</button>
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
    </div>
  );
}
