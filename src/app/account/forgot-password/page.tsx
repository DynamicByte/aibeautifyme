'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    
    // Simulate API call - will be replaced with Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsLoading(false);
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

        {/* Form */}
        <div className="bg-surface-1 border border-border rounded-xl p-6">
          {isSubmitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-1 mb-2">Check Your Email</h2>
              <p className="text-text-3 text-sm mb-6">
                If an account exists for <span className="text-text-1">{email}</span>, you will receive password reset instructions shortly.
              </p>
              <Link
                href="/account/login"
                className="inline-block px-6 py-2 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-600 transition"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-text-1 mb-2">Forgot Password?</h2>
              <p className="text-text-3 text-sm mb-6">
                Enter your email address and we&apos;ll send you instructions to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 transition"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-text-3 mt-6">
          <Link href="/account/login" className="text-purple-400 hover:text-purple-300">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
