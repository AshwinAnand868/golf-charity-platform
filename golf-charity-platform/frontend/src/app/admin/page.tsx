'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import { Users, Trophy, Heart, DollarSign, ChevronRight, Settings, BarChart3, Shield } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeSubscribers: number;
  totalCharities: number;
  totalPrizePool: number;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!user || user.role !== 'admin') return null;

  const adminLinks = [
    { href: '/admin/users', icon: Users, label: 'User Management', desc: 'View, edit, and manage all subscribers', color: 'blue' },
    { href: '/admin/draws', icon: Trophy, label: 'Draw Management', desc: 'Run simulations, configure & publish draws', color: 'gold' },
    { href: '/admin/charities', icon: Heart, label: 'Charity Management', desc: 'Add, edit, feature, and remove charities', color: 'red' },
    { href: '/admin/winners', icon: Shield, label: 'Winner Verification', desc: 'Review proofs and manage payouts', color: 'green' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    gold: 'bg-gold-500/10 text-gold-400',
    red: 'bg-red-500/10 text-red-400',
    green: 'bg-brand-500/10 text-brand-400',
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="badge-green mb-3">Admin Panel</div>
              <h1 className="font-display text-3xl font-bold text-white">Platform Control</h1>
              <p className="text-slate-400 mt-1">Manage all aspects of the GolfGives platform</p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Active Subscribers', value: stats.activeSubscribers, icon: BarChart3, color: 'text-brand-400' },
                { label: 'Charities', value: stats.totalCharities, icon: Heart, color: 'text-red-400' },
                { label: 'Total Prize Pool', value: `£${stats.totalPrizePool?.toFixed(0) || '0'}`, icon: Trophy, color: 'text-gold-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card">
                  <div className={`text-xs font-medium ${color} mb-3 flex items-center gap-1.5`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </div>
                  <div className="font-display text-3xl font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Admin nav */}
          <div className="grid md:grid-cols-2 gap-6">
            {adminLinks.map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href} className="card-hover group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white mb-1">{label}</h3>
                <p className="text-sm text-slate-400 mb-4">{desc}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                  Manage <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
