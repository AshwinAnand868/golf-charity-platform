'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, Trophy, Heart, LayoutDashboard, Settings, LogOut, User } from 'lucide-react';
import { clsx } from 'clsx';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/charity', label: 'Charities', icon: Heart },
    { href: '/draw', label: 'Monthly Draw', icon: Trophy },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center group-hover:bg-brand-400 transition-colors">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Golf<span className="text-brand-400">Gives</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(href)
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center border border-brand-500/30">
                    <span className="text-brand-400 text-sm font-bold">{user.name[0].toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-slate-300 font-medium">{user.name.split(' ')[0]}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <div className={clsx(
                        'mt-1.5 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                        user.subscription.status === 'active' ? 'bg-brand-500/15 text-brand-400' : 'bg-red-500/15 text-red-400'
                      )}>
                        {user.subscription.status === 'active' ? '● Active' : '● Inactive'}
                      </div>
                    </div>
                    <div className="py-1">
                      <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                          <Settings className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={() => { logout(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/8 bg-dark-900/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-medium">
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5">
                    <Settings className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth/login" className="btn-secondary w-full" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/auth/register" className="btn-primary w-full" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
