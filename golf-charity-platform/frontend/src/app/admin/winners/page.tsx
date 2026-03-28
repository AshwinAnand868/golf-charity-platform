'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, DollarSign, ExternalLink, Trophy, Shield } from 'lucide-react';

interface Winner {
  _id: string;
  user: { _id: string; name: string; email: string };
  matchType: string;
  prizeAmount: number;
  paymentStatus: string;
  verificationStatus: string;
  proofUrl: string;
  drawId: string;
  month: number;
  year: number;
  submittedAt?: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminWinnersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const { data } = await api.get('/admin/winners');
      setWinners(data.winners);
    } catch { toast.error('Failed to fetch winners'); }
    finally { setLoading(false); }
  };

  const verify = async (drawId: string, userId: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/draws/winners/${drawId}/${userId}/verify`, { action });
      toast.success(`Winner ${action}d!`);
      fetchWinners();
    } catch { toast.error(`Failed to ${action} winner`); }
  };

  const markPaid = async (drawId: string, userId: string) => {
    try {
      await api.post(`/draws/winners/${drawId}/${userId}/payout`);
      toast.success('Marked as paid!');
      fetchWinners();
    } catch { toast.error('Failed to mark as paid'); }
  };

  const filtered = winners.filter((w) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return w.verificationStatus === 'pending';
    if (filter === 'approved') return w.verificationStatus === 'approved';
    if (filter === 'unpaid') return w.verificationStatus === 'approved' && w.paymentStatus !== 'paid';
    return true;
  });

  const tabs = [
    { id: 'all', label: 'All Winners', count: winners.length },
    { id: 'pending', label: 'Pending Review', count: winners.filter(w => w.verificationStatus === 'pending').length },
    { id: 'approved', label: 'Approved', count: winners.filter(w => w.verificationStatus === 'approved').length },
    { id: 'unpaid', label: 'Unpaid', count: winners.filter(w => w.verificationStatus === 'approved' && w.paymentStatus !== 'paid').length },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Admin Panel
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white">Winner Verification</h1>
            <p className="text-slate-400 mt-1">Review proof submissions and manage prize payouts</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto mb-8 pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  filter === t.id ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === t.id ? 'bg-brand-500/30' : 'bg-white/10'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Winners list */}
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="card animate-pulse h-32" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">No winners here</h3>
              <p className="text-slate-400 text-sm">Winners appear after draws are published</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((w, i) => (
                <div key={i} className="card">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-gold-400" />
                        <span className="font-semibold text-white">{w.user?.name}</span>
                        <span className="text-slate-500 text-sm">{w.user?.email}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {MONTHS[(w.month || 1) - 1]} {w.year} · {w.matchType} · 
                        <span className="text-brand-400 font-medium"> £{(w.prizeAmount / 100).toFixed(2)}</span>
                      </div>

                      {/* Status badges */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={
                          w.verificationStatus === 'approved' ? 'badge-green' :
                          w.verificationStatus === 'pending' ? 'badge-gold' :
                          w.verificationStatus === 'rejected' ? 'badge-red' : 'badge-gray'
                        }>
                          {w.verificationStatus}
                        </span>
                        {w.paymentStatus === 'paid' && <span className="badge-green">✓ Paid</span>}
                        {w.paymentStatus === 'pending' && w.verificationStatus === 'approved' && (
                          <span className="badge-gold">Payout Pending</span>
                        )}
                      </div>

                      {/* Proof link */}
                      {w.proofUrl && (
                        <a href={w.proofUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2">
                          <ExternalLink className="w-3 h-3" /> View Proof
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {w.verificationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => verify(w.drawId, w.user._id, 'approve')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 rounded-lg text-sm font-medium transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => verify(w.drawId, w.user._id, 'reject')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg text-sm font-medium transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                      {w.verificationStatus === 'approved' && w.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => markPaid(w.drawId, w.user._id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gold-500/15 text-gold-400 hover:bg-gold-500/25 rounded-lg text-sm font-medium transition-colors"
                        >
                          <DollarSign className="w-4 h-4" /> Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
