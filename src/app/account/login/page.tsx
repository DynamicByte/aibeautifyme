'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.refresh();
        router.push('/account');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <img src="/youth_renew.png" alt="Youth Renew" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-text-1 font-brand">AI Beautify Me</h1>
              <p className="text-xs text-text-3">Member Portal</p>
            </div>
          </Link>
        </div>

        {/* Login Form */}
        <div className="bg-surface-1 border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-1 mb-2">Welcome Back</h2>
          <p className="text-text-3 text-sm mb-6">Sign in to access your skincare dashboard</p>

          {error && (
            <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-1 mb-2">
                Username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-1 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 transition"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center mt-4">
              <Link href="/account/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                Forgot Password?
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-3">
              Demo credentials: <span className="text-text-1">user</span> / <span className="text-text-1">123456</span>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-text-3 mt-6">
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            ← Back to Store
          </Link>
        </p>
      </div>
    </div>
  );
}
