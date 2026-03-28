'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Star, Save, X } from 'lucide-react';

interface Charity {
  _id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  featured: boolean;
  totalReceived: number;
  isActive: boolean;
}

const emptyForm = { name: '', description: '', logo: '', website: '', category: 'General', featured: false };

export default function AdminCharitiesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const { data } = await api.get('/charities');
      setCharities(data.charities);
    } catch { toast.error('Failed to fetch charities'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/charities/${editId}`, form);
        toast.success('Charity updated!');
      } else {
        await api.post('/charities', form);
        toast.success('Charity created!');
      }
      setShowForm(false); setEditId(null); setForm(emptyForm);
      fetchCharities();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save charity');
    } finally { setSaving(false); }
  };

  const startEdit = (c: Charity) => {
    setEditId(c._id);
    setForm({ name: c.name, description: c.description, logo: c.logo, website: '', category: c.category, featured: c.featured });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCharity = async (id: string) => {
    if (!confirm('Deactivate this charity?')) return;
    try {
      await api.delete(`/charities/${id}`);
      toast.success('Charity deactivated');
      fetchCharities();
    } catch { toast.error('Failed to deactivate'); }
  };

  const toggleFeatured = async (id: string) => {
    try {
      await api.put(`/charities/${id}/feature`);
      fetchCharities();
    } catch { toast.error('Failed to toggle featured'); }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Admin Panel
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">Charity Management</h1>
              <p className="text-slate-400 mt-1">Add, edit and manage platform charities</p>
            </div>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Charity
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div className="card border-brand-500/20 mb-8">
              <h2 className="font-semibold text-white mb-6">{editId ? 'Edit Charity' : 'New Charity'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Charity Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Charity name" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input bg-dark-900">
                      {['General', 'Youth Sports', 'Medical Research', 'Environment', 'Veterans', 'Education', 'Poverty', 'Animal Welfare'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Logo URL</label>
                    <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="input" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="label">Website URL</label>
                    <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input" placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="label">Description *</label>
                  <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" placeholder="Charity description..." />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-brand-500" />
                  <span className="text-sm text-slate-300">Feature on homepage</span>
                </label>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="btn-primary">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : editId ? 'Update Charity' : 'Create Charity'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-ghost">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Charities list */}
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="card animate-pulse h-24" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {charities.map((c) => (
                <div key={c._id} className="card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {c.logo && (
                      <img src={c.logo} alt={c.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{c.name}</span>
                        {c.featured && <span className="badge-gold">⭐ Featured</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.category} · £{(c.totalReceived / 100).toLocaleString()} raised</div>
                      <p className="text-sm text-slate-400 mt-1 truncate">{c.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleFeatured(c._id)} className={`p-2 rounded-lg transition-colors ${c.featured ? 'text-gold-400 bg-gold-500/10' : 'text-slate-500 hover:text-gold-400 hover:bg-gold-500/10'}`} title="Toggle featured">
                      <Star className="w-4 h-4" />
                    </button>
                    <button onClick={() => startEdit(c)} className="p-2 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCharity(c._id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
