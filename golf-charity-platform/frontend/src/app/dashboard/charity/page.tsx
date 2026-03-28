'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Heart, Search, Check, ExternalLink, Save } from 'lucide-react';

interface Charity {
  _id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  featured: boolean;
  totalReceived: number;
}

export default function CharityPage() {
  const { user, refreshUser } = useAuthStore();
  const router = useRouter();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string>('');
  const [percentage, setPercentage] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    setSelected((user.selectedCharity as any)?._id || '');
    setPercentage(user.charityPercentage || 10);
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const { data } = await api.get('/charities');
      setCharities(data.charities);
    } catch { toast.error('Failed to load charities'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!selected) { toast.error('Please select a charity'); return; }
    setSaving(true);
    try {
      await api.put('/users/charity', { selectedCharity: selected, charityPercentage: percentage });
      await refreshUser();
      toast.success('Charity preferences saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const filtered = charities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white">My Charity</h1>
            <p className="text-slate-400 mt-1">Choose where your contributions go each month</p>
          </div>

          {/* Contribution slider */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Monthly Contribution</h3>
                <p className="text-sm text-slate-400">Minimum 10% of your subscription fee</p>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold text-brand-400">{percentage}%</div>
                <div className="text-xs text-slate-500">of subscription</div>
              </div>
            </div>
            <input
              type="range" min="10" max="100" step="5"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>10% (Min)</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search charities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-11"
            />
          </div>

          {/* Charity grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-32" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {filtered.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelected(c._id)}
                  className={`card text-left transition-all duration-200 relative ${
                    selected === c._id
                      ? 'border-brand-500/50 bg-brand-500/10'
                      : 'hover:border-white/20'
                  }`}
                >
                  {selected === c._id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  {c.featured && (
                    <div className="badge-green mb-3 w-fit">Featured</div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">💚</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-xs text-slate-500 mb-2">{c.category}</div>
                      <div className="text-xs text-slate-400 line-clamp-2">{c.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <div className="text-xs text-brand-400 font-medium">
                      £{(c.totalReceived / 100).toLocaleString()} raised
                    </div>
                    <Heart className="w-4 h-4 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <button onClick={handleSave} disabled={saving || !selected} className="btn-primary w-full py-3.5">
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Charity Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
