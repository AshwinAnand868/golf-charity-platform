'use client';

import { useAuthStore } from '@/store/authStore';
import { ArrowRight, Eye, EyeOff, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function RegisterContent() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const searchParams = useSearchParams(); // ✅ now safe
  const plan = searchParams.get('plan') || 'monthly';
  const passwordStrength = (p: string) => {
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-brand-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Let\'s set up your subscription.');
      router.push('/subscribe');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        toast.error(errors[0].msg);
      } else {
        toast.error(err.response?.data?.error || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-dark-950">
      <div className="absolute inset-0 bg-gradient-radial from-brand-500/5 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center group-hover:bg-brand-400 transition-colors">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-white">
            Golf<span className="text-brand-400">Gives</span>
          </span>
        </Link>

        <div className="card border-white/10">
          <h1 className="font-display text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-8">
            Join thousands of golfers making a difference
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="John Smith"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-11"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{strengthLabels[strength]}</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <p className="text-sm text-brand-300 font-medium mb-2">
                ✓ Selected plan: <span className="capitalize">{plan}</span>
              </p>
              <p className="text-xs text-slate-400">
                You&apos;ll be redirected to complete payment after registration.
              </p>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
