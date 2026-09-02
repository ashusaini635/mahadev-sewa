"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [phone, setPhone] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid username or password. Please try again.");
    } else {
      router.push("/");
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotErr("");
    setForgotMsg("");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotErr(data.error || "Failed to submit request");
      } else {
        setForgotMsg("✅ Request received! Committee Admin will reset your password and inform you via WhatsApp or Call.");
        setPhone("");
      }
    } catch {
      setForgotErr("Something went wrong. Please check your connection.");
    }
    setForgotLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕉️</div>
          <h1 className="text-2xl font-bold text-orange-800">Mahadev Seva</h1>
          <p className="text-gray-500 text-sm mt-1">Committee Fund Tracker</p>
        </div>

        {!showForgot ? (
          /* Sign In Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 bg-white"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setError("");
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 bg-white"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          /* Forgot Password View */
          <form onSubmit={handleForgot} className="space-y-5">
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-800">Forgot Password</h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your registered mobile number. We will notify the admin to reset your password and send it to you.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 bg-white"
                placeholder="e.g. 9876543210"
                required
                autoFocus
              />
            </div>

            {forgotErr && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                ❌ {forgotErr}
              </div>
            )}

            {forgotMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
                {forgotMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {forgotLoading ? "Sending Request..." : "Request Password Reset"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setForgotErr("");
                setForgotMsg("");
              }}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          🚩 Har Har Mahadev 🚩
        </p>
      </div>
    </div>
  );
}


