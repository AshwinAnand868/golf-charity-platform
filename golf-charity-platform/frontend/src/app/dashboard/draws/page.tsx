'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Trophy, Star, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Winner {
  user: string;
  matchType: string;
  prizeAmount: number;
  paymentStatus: string;
  verificationStatus: string;
  proofUrl: string;
}

interface Draw {
  _id: string;
  month: number;
  year: number;
  drawnNumbers: number[];
  prizePool: { total: number; jackpot: number; fourMatch: number; threeMatch: number };
  winners: Winner[];
  status: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DrawsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [myHistory, setMyHistory] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState('');
  const [submittingDraw, setSubmittingDraw] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    Promise.all([
      api.get('/draws'),
      api.get('/draws/my-history').catch(() => ({ data: { draws: [] } })),
    ]).then(([allRes, myRes]) => {
      setDraws(allRes.data.draws);
      setMyHistory(myRes.data.draws);
    }).catch(() => toast.error('Failed to load draws'))
      .finally(() => setLoading(false));
  }, []);

  const getMyWin = (draw: Draw) => {
    return draw.winners.find((w) => {
      const uid = typeof w.user === 'object' ? (w.user as any)._id : w.user;
      return uid === user?._id?.toString() || uid === (user as any)?.id;
    });
  };

  const submitProof = async (drawId: string) => {
    if (!proofUrl.trim()) { toast.error('Please enter proof URL'); return; }
    try {
      await api.post(`/draws/${drawId}/submit-proof`, { proofUrl });
      toast.success('Proof submitted for review!');
      setSubmittingDraw(null);
      setProofUrl('');
      // Refresh
      const { data } = await api.get('/draws/my-history');
      setMyHistory(data.draws);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit proof');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="badge-green"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'pending': return <span className="badge-gold"><Clock className="w-3 h-3" /> Under Review</span>;
      case 'rejected': return <span className="badge-red"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return <span className="badge-gray">Unsubmitted</span>;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white">Draw Results</h1>
            <p className="text-slate-400 mt-1">Monthly draws and your participation history</p>
          </div>

          {/* My winnings */}
          {myHistory.length > 0 && (
            <div className="mb-10">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-gold-400" /> My Winnings
              </h2>
              <div className="space-y-4">
                {myHistory.map((draw) => {
                  const win = getMyWin(draw);
                  if (!win) return null;
                  return (
                    <div key={draw._id} className="card border-gold-500/20 bg-gold-500/5">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-5 h-5 text-gold-400" />
                            <span className="font-semibold text-white">{MONTHS[draw.month - 1]} {draw.year} Draw</span>
                          </div>
                          <div className="text-sm text-slate-400 mb-2">
                            {win.matchType} · £{(win.prizeAmount / 100).toFixed(2)} prize
                          </div>
                          <div className="flex items-center gap-3">
                            {statusBadge(win.verificationStatus)}
                            {win.paymentStatus === 'paid' && (
                              <span className="badge-green">✓ Paid</span>
                            )}
                          </div>
                        </div>
                        {win.verificationStatus === 'unsubmitted' && (
                          <div className="flex-1 min-w-[240px]">
                            {submittingDraw === draw._id ? (
                              <div className="space-y-2">
                                <input
                                  type="url" placeholder="Screenshot URL or link to proof..."
                                  value={proofUrl}
                                  onChange={(e) => setProofUrl(e.target.value)}
                                  className="input text-sm"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => submitProof(draw._id)} className="btn-primary text-sm py-2">
                                    <Upload className="w-3.5 h-3.5" /> Submit
                                  </button>
                                  <button onClick={() => setSubmittingDraw(null)} className="btn-ghost text-sm">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setSubmittingDraw(draw._id)} className="btn-primary text-sm">
                                <Upload className="w-3.5 h-3.5" /> Submit Proof
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All draws */}
          <h2 className="font-semibold text-white mb-4">All Published Draws</h2>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="card animate-pulse h-32" />)}
            </div>
          ) : draws.length === 0 ? (
            <div className="card text-center py-16">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">No draws yet</h3>
              <p className="text-slate-400 text-sm">Check back at the end of the month for draw results</p>
            </div>
          ) : (
            <div className="space-y-4">
              {draws.map((draw) => (
                <div key={draw._id} className="card">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{MONTHS[draw.month - 1]} {draw.year} Draw</h3>
                      <div className="text-sm text-slate-400">
                        £{(draw.prizePool.total / 100).toFixed(2)} total pool · {draw.winners.length} winner{draw.winners.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <span className="badge-green">Published</span>
                  </div>

                  {/* Drawn numbers */}
                  <div className="flex gap-2 mb-4">
                    {draw.drawnNumbers.map((n) => (
                      <div key={n} className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300 text-sm">
                        {n}
                      </div>
                    ))}
                  </div>

                  {/* Pool breakdown */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: '🏆 Jackpot', value: draw.prizePool.jackpot },
                      { label: '🥈 4-Match', value: draw.prizePool.fourMatch },
                      { label: '🥉 3-Match', value: draw.prizePool.threeMatch },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-slate-400">{label}</div>
                        <div className="font-semibold text-white mt-1">£{(value / 100).toFixed(0)}</div>
                      </div>
                    ))}
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
