'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Trophy, Heart, TrendingUp, Calendar, ChevronRight, AlertCircle, Star } from 'lucide-react';

interface DrawInfo {
  activeSubscribers: number;
  estimatedPool: number;
  draw: {
    status: string;
    drawnNumbers: number[];
    month: number;
    year: number;
  } | null;
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore();
  const router = useRouter();
  const [drawInfo, setDrawInfo] = useState<DrawInfo | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.subscription.status !== 'active') { router.push('/subscribe'); return; }
    refreshUser();
    api.get('/draws/current').then((r) => setDrawInfo(r.data)).catch(() => {});
  }, []);

  if (!user) return null;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="font-display text-3xl font-bold text-white">
              Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 mt-1">
              {format(new Date(), 'EEEE, MMMM do yyyy')} · Your dashboard
            </p>
          </div>

          {/* Status Banner */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="card bg-brand-500/10 border-brand-500/20">
              <div className="text-xs text-slate-400 mb-1">Subscription</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="font-semibold text-brand-400 capitalize">{user.subscription.status}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {user.subscription.plan && `${user.subscription.plan} plan`}
              </div>
            </div>

            <div className="card">
              <div className="text-xs text-slate-400 mb-1">Next Draw</div>
              <div className="font-semibold text-white">
                {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {drawInfo?.estimatedPool ? `~£${drawInfo.estimatedPool.toFixed(0)} pool` : 'Pool calculating...'}
              </div>
            </div>

            <div className="card">
              <div className="text-xs text-slate-400 mb-1">Your Charity</div>
              <div className="font-semibold text-white truncate">
                {(user.selectedCharity as any)?.name || 'Not selected'}
              </div>
              <div className="text-xs text-brand-400 mt-1">{user.charityPercentage}% contribution</div>
            </div>

            <div className="card">
              <div className="text-xs text-slate-400 mb-1">Renews</div>
              <div className="font-semibold text-white">
                {user.subscription.currentPeriodEnd
                  ? format(new Date(user.subscription.currentPeriodEnd), 'dd MMM yyyy')
                  : '—'}
              </div>
              {user.subscription.cancelAtPeriodEnd && (
                <div className="text-xs text-yellow-400 mt-1">Cancels at period end</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Link href="/dashboard/scores" className="card-hover group">
              <div className="w-11 h-11 bg-brand-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <TrendingUp className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">My Scores</h3>
              <p className="text-sm text-slate-400">Enter and manage your last 5 Stableford scores</p>
              <div className="flex items-center gap-1 text-brand-400 text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                Manage scores <ChevronRight className="w-4 h-4" />
              </div>
            </Link>

            <Link href="/dashboard/charity" className="card-hover group">
              <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">My Charity</h3>
              <p className="text-sm text-slate-400">Change your charity and adjust your contribution</p>
              <div className="flex items-center gap-1 text-red-400 text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                Update charity <ChevronRight className="w-4 h-4" />
              </div>
            </Link>

            <Link href="/dashboard/draws" className="card-hover group">
              <div className="w-11 h-11 bg-gold-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-500/20 transition-colors">
                <Trophy className="w-5 h-5 text-gold-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Draw Results</h3>
              <p className="text-sm text-slate-400">View past draws and your winnings history</p>
              <div className="flex items-center gap-1 text-gold-400 text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                View draws <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </div>

          {/* Current draw numbers (if published) */}
          {drawInfo?.draw?.status === 'published' && drawInfo.draw.drawnNumbers.length > 0 && (
            <div className="card border-gold-500/20 bg-gold-500/5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-gold-400" />
                <h3 className="font-semibold text-white">
                  This Month&apos;s Drawn Numbers — {monthNames[drawInfo.draw.month - 1]} {drawInfo.draw.year}
                </h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                {drawInfo.draw.drawnNumbers.map((n) => (
                  <div key={n} className="w-12 h-12 rounded-full bg-gold-500/20 border-2 border-gold-500/40 flex items-center justify-center font-display font-bold text-gold-300 text-lg">
                    {n}
                  </div>
                ))}
              </div>
              <Link href="/dashboard/draws" className="inline-flex items-center gap-1 text-gold-400 text-sm font-medium mt-4 hover:gap-2 transition-all">
                Check if you won <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* No charity selected warning */}
          {!user.selectedCharity && (
            <div className="card border-yellow-500/20 bg-yellow-500/5 flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">No charity selected</p>
                <p className="text-xs text-slate-400 mt-1">Choose a charity so your contributions go to a cause you care about.</p>
                <Link href="/dashboard/charity" className="inline-flex items-center gap-1 text-yellow-400 text-sm font-medium mt-2 hover:underline">
                  Choose a charity <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
