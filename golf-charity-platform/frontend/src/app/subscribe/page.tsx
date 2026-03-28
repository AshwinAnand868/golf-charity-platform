'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, Trophy, Zap } from 'lucide-react';

export default function SubscribePage() {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth/login');
    return null;
  }

  if (user.subscription.status === 'active') {
    if (typeof window !== 'undefined') router.push('/dashboard');
    return null;
  }

  const plans = [
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: '£19.99',
      period: 'per month',
      features: ['Monthly draw entry', 'Score tracking', 'Charity contributions', 'Full dashboard'],
    },
    {
      id: 'yearly' as const,
      name: 'Yearly',
      price: '£199.99',
      period: 'per year',
      savings: 'Save £40',
      features: ['Everything in Monthly', '2 months free', 'Priority support', 'Exclusive badge'],
    },
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/subscriptions/create-checkout', { plan: selectedPlan });
      window.location.href = data.url;
    } catch (err: any) {
      toast.error('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="w-16 h-16 bg-brand-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Choose Your Plan</h1>
          <p className="text-slate-400">Start playing for good today. Cancel any time.</p>
        </div>

        <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-6 mb-10">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`card text-left transition-all duration-200 relative ${
                selectedPlan === plan.id
                  ? 'border-brand-500/50 bg-brand-500/8 shadow-[0_0_30px_rgba(34,197,94,0.1)]'
                  : 'hover:border-white/20'
              }`}
            >
              {plan.savings && (
                <div className="badge-gold mb-4 w-fit">{plan.savings}</div>
              )}
              {selectedPlan === plan.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="font-display text-xl font-bold text-white mb-1">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="font-display text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="max-w-sm mx-auto">
          <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full py-4 text-lg glow">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to Stripe...
              </span>
            ) : (
              <><Zap className="w-5 h-5" /> Subscribe & Start Playing</>
            )}
          </button>
          <p className="text-center text-xs text-slate-500 mt-4">
            Secure payment via Stripe. Cancel any time from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
