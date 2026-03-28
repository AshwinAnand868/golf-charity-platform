'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Info } from 'lucide-react';

interface Score { value: number; date: string; }

export default function ScoresPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ value: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const { data } = await api.get('/scores');
      setScores(data.scores);
    } catch { toast.error('Failed to load scores'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/scores', { value: parseInt(form.value), date: form.date });
      setScores(data.scores);
      setShowAdd(false);
      setForm({ value: '', date: format(new Date(), 'yyyy-MM-dd') });
      toast.success('Score added!');
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to add score');
    } finally { setSaving(false); }
  };

  const handleEdit = async (idx: number) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/scores/${idx}`, { value: parseInt(form.value), date: form.date });
      setScores(data.scores);
      setEditIdx(null);
      toast.success('Score updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to update score');
    } finally { setSaving(false); }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm('Delete this score?')) return;
    try {
      const { data } = await api.delete(`/scores/${idx}`);
      setScores(data.scores);
      toast.success('Score deleted');
    } catch { toast.error('Failed to delete score'); }
  };

  const startEdit = (idx: number, score: Score) => {
    setEditIdx(idx);
    setForm({ value: score.value.toString(), date: format(new Date(score.date), 'yyyy-MM-dd') });
    setShowAdd(false);
  };

  const getScoreColor = (v: number) => {
    if (v >= 36) return 'text-brand-400';
    if (v >= 28) return 'text-blue-400';
    if (v >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">My Scores</h1>
              <p className="text-slate-400 mt-1">Your last 5 Stableford scores (most recent first)</p>
            </div>
            {scores.length < 5 && !showAdd && (
              <button onClick={() => { setShowAdd(true); setEditIdx(null); }} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Score
              </button>
            )}
          </div>

          {/* Info card */}
          <div className="card bg-brand-500/5 border-brand-500/15 flex items-start gap-3 mb-8">
            <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400">
              Your scores (1–45, Stableford format) act as your draw entry numbers each month. 
              Only your latest 5 scores are kept — adding a new score drops the oldest automatically.
            </p>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="card border-brand-500/30 mb-6">
              <h3 className="font-semibold text-white mb-4">Add New Score</h3>
              <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Stableford Score (1–45)</label>
                  <input
                    type="number" min="1" max="45" required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="input" placeholder="e.g. 36"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Date Played</label>
                  <input
                    type="date" required
                    value={form.date}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" disabled={saving} className="btn-primary">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Score'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Scores list */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="card animate-pulse h-16" />)}
            </div>
          ) : scores.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">⛳</div>
              <h3 className="font-semibold text-white mb-2">No scores yet</h3>
              <p className="text-slate-400 text-sm mb-6">Add your first Stableford score to enter the monthly draw</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary mx-auto">
                <Plus className="w-4 h-4" /> Add Your First Score
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score, idx) => (
                <div key={idx}>
                  {editIdx === idx ? (
                    <div className="card border-brand-500/30">
                      <h4 className="text-sm font-medium text-slate-400 mb-3">Edit Score #{idx + 1}</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Score (1–45)</label>
                          <input
                            type="number" min="1" max="45"
                            value={form.value}
                            onChange={(e) => setForm({ ...form, value: e.target.value })}
                            className="input" autoFocus
                          />
                        </div>
                        <div>
                          <label className="label">Date Played</label>
                          <input
                            type="date"
                            value={form.date}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div className="sm:col-span-2 flex gap-3">
                          <button onClick={() => handleEdit(idx)} disabled={saving} className="btn-primary">
                            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Update'}
                          </button>
                          <button onClick={() => setEditIdx(null)} className="btn-ghost">
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <div className={`font-display text-4xl font-bold ${getScoreColor(score.value)}`}>
                          {score.value}
                        </div>
                        <div>
                          <div className="text-white font-medium">Stableford Score</div>
                          <div className="text-sm text-slate-400">
                            {format(new Date(score.date), 'EEEE, d MMMM yyyy')}
                          </div>
                        </div>
                        {idx === 0 && (
                          <span className="badge-green">Latest</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(idx, score)} className="p-2 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(idx)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {scores.length > 0 && scores.length < 5 && !showAdd && (
            <button onClick={() => setShowAdd(true)} className="btn-secondary w-full mt-4">
              <Plus className="w-4 h-4" /> Add Another Score ({5 - scores.length} slots remaining)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
