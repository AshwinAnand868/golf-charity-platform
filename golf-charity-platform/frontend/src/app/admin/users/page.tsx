'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Search, Users, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscription: { status: string; plan: string | null; currentPeriodEnd: string | null };
  selectedCharity: { name: string } | null;
  charityPercentage: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { page, limit: 15, search } });
      setUsers(data.users);
      setPages(data.pages);
      setTotal(data.total);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (userId: string, current: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/users/${userId}`, { 'subscription.status': newStatus });
      toast.success(`User ${newStatus}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'badge-green', inactive: 'badge-gray',
      cancelled: 'badge-red', lapsed: 'badge-red',
    };
    return <span className={map[status] || 'badge-gray'}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Admin Panel
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">User Management</h1>
              <p className="text-slate-400 mt-1">{total} total users</p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text" placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-11"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['User', 'Status', 'Plan', 'Charity', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="py-4 px-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td></tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500">No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      {u.role === 'admin' && <span className="badge-gold mt-1">Admin</span>}
                    </td>
                    <td className="py-3 px-4">{statusBadge(u.subscription.status)}</td>
                    <td className="py-3 px-4 text-slate-300 capitalize">{u.subscription.plan || '—'}</td>
                    <td className="py-3 px-4 text-slate-300 text-xs">
                      {u.selectedCharity?.name || '—'}
                      {u.selectedCharity && <div className="text-brand-400">{u.charityPercentage}%</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {format(new Date(u.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(u._id, u.subscription.status)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.subscription.status === 'active'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-brand-400 hover:bg-brand-500/10'
                          }`}
                          title={u.subscription.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {u.subscription.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(u._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400">Page {page} of {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-ghost">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
