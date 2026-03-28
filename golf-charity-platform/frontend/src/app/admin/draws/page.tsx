'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Play, Send, Trophy, Shuffle, BarChart3, RefreshCw } from 'lucide-react';

interface Draw {
  _id: string;
  month: number;
  year: number;
  drawnNumbers: number[];
  drawType: string;
  status: string;
  prizePool: { total: number; jackpot: number; fourMatch: number; threeMatch: number; jackpotRolledOver: number };
  winners: any[];
  participantCount: number;
  jackpotRolledFromPrevious: number;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AdminDrawsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    drawType: 'random',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const { data } = await api.get('/draws/admin/all');
      setDraws(data.draws);
    } catch { toast.error('Failed to fetch draws'); }
    finally { setLoading(false); }
  };

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const { data } = await api.post('/draws/simulate', config);
      toast.success('Simulation complete!');
      setDraws((prev) => {
        const idx = prev.findIndex((d) => d._id === data.draw._id);
        if (idx >= 0) { const next = [...prev]; next[idx] = data.draw; return next; }
        return [data.draw, ...prev];
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Simulation failed');
    } finally { setSimulating(false); }
  };

  const publishDraw = async (id: string) => {
    if (!confirm('Publish this draw? This cannot be undone.')) return;
    setPublishingId(id);
    try {
      await api.post(`/draws/${id}/publish`);
      toast.success('Draw published!');
      fetchDraws();
    } catch { toast.error('Failed to publish draw'); }
    finally { setPublishingId(null); }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Admin Panel
          </Link>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Draw Management</h1>
          <p className="text-slate-400 mb-10">Configure, simulate, and publish monthly prize draws</p>

          {/* Simulation controls */}
          <div className="card border-brand-500/20 mb-10">
            <h2 className="font-semibold text-white mb-6 flex items-center gap-2">
              <Play className="w-5 h-5 text-brand-400" /> Run Draw Simulation
            </h2>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="label">Month</label>
                <select
                  value={config.month}
                  onChange={(e) => setConfig({ ...config, month: parseInt(e.target.value) })}
                  className="input bg-dark-900"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select
                  value={config.year}
                  onChange={(e) => setConfig({ ...config, year: parseInt(e.target.value) })}
                  className="input bg-dark-900"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Draw Type</label>
                <select
                  value={config.drawType}
                  onChange={(e) => setConfig({ ...config, drawType: e.target.value })}
                  className="input bg-dark-900"
                >
                  <option value="random">Random (Lottery Style)</option>
                  <option value="algorithmic">Algorithmic (Score Weighted)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={runSimulation} disabled={simulating} className="btn-primary">
                {simulating ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Simulating...</>
                ) : (
                  <><Shuffle className="w-4 h-4" /> Run Simulation</>
                )}
              </button>
              <p className="text-xs text-slate-500 self-center">
                Simulation mode — results won't notify users until published
              </p>
            </div>
          </div>

          {/* Draws list */}
          <h2 className="font-semibold text-white mb-4">All Draws</h2>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="card animate-pulse h-32" />)}
            </div>
          ) : draws.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">No draws yet. Run a simulation above.</div>
          ) : (
            <div className="space-y-4">
              {draws.map((draw) => (
                <div key={draw._id} className="card">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{MONTHS[draw.month - 1]} {draw.year}</h3>
                        <span className={draw.status === 'published' ? 'badge-green' : 'badge-gray'}>
                          {draw.status}
                        </span>
                        <span className="badge-gray capitalize">{draw.drawType}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {draw.participantCount} participants · {draw.winners.length} winners · 
                        Pool: £{(draw.prizePool.total / 100).toFixed(2)}
                      </div>
                      {draw.jackpotRolledFromPrevious > 0 && (
                        <div className="text-xs text-gold-400 mt-1">
                          +£{(draw.jackpotRolledFromPrevious / 100).toFixed(2)} jackpot rolled from previous month
                        </div>
                      )}
                    </div>
                    {draw.status === 'simulation' && (
                      <button
                        onClick={() => publishDraw(draw._id)}
                        disabled={publishingId === draw._id}
                        className="btn-primary text-sm"
                      >
                        <Send className="w-4 h-4" />
                        {publishingId === draw._id ? 'Publishing...' : 'Publish Draw'}
                      </button>
                    )}
                  </div>

                  {/* Drawn numbers */}
                  {draw.drawnNumbers.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {draw.drawnNumbers.map((n) => (
                        <div key={n} className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-brand-300 text-sm">
                          {n}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Prize tiers */}
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    {[
                      { label: '🏆 Jackpot (40%)', val: draw.prizePool.jackpot },
                      { label: '🥈 4-Match (35%)', val: draw.prizePool.fourMatch },
                      { label: '🥉 3-Match (25%)', val: draw.prizePool.threeMatch },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">{label}</div>
                        <div className="font-semibold text-white">£{(val / 100).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Winners summary */}
                  {draw.winners.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-slate-400 mb-2 font-medium">WINNERS</div>
                      <div className="space-y-1">
                        {draw.winners.map((w, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-3.5 h-3.5 text-gold-400" />
                              <span className="text-white">{w.user?.name || 'User'}</span>
                              <span className="text-slate-500">({w.matchType})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-brand-400">£{(w.prizeAmount / 100).toFixed(2)}</span>
                              <span className={
                                w.verificationStatus === 'approved' ? 'badge-green' :
                                w.verificationStatus === 'pending' ? 'badge-gold' :
                                w.verificationStatus === 'rejected' ? 'badge-red' : 'badge-gray'
                              }>{w.verificationStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
