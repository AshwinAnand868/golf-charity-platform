'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Trophy, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const user = useAuthStore.getState().user;
      router.push(user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-dark-950">
      <div className="absolute inset-0 bg-gradient-radial from-brand-500/5 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center group-hover:bg-brand-400 transition-colors">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-white">
            Golf<span className="text-brand-400">Gives</span>
          </span>
        </Link>

        <div className="card border-white/10">
          <h1 className="font-display text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button type="button" className="text-xs text-brand-400 hover:text-brand-300">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 mt-2">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one free
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-500 font-medium mb-2">🧪 Demo credentials</p>
            <div className="space-y-1 text-xs text-slate-400">
              <p><span className="text-slate-300">Player:</span> player@golfcharity.com / Player@1234</p>
              <p><span className="text-slate-300">Admin:</span> admin@golfcharity.com / Admin@1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
