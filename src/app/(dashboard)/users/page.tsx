'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, PlusCircle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { IUser, UserRole } from '@/types';
import { roleDisplayBn } from '@/lib/permissions/rbac';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('নাম এবং ইমেইল দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, role }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('নতুন কর্মী সফলভাবে যুক্ত হয়েছে');
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        fetchUsers();
      } else {
        toast.error(json.message || 'কর্মী যোগ ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserActive = async (user: IUser) => {
    if (user.role === 'OWNER') {
      toast.error('মালিকের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user._id,
          active: !user.active,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(`অ্যাকাউন্ট ${!user.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
        fetchUsers();
      } else {
        toast.error(json.message || 'হালনাগাদ ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ ব্যর্থ');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            দোকানের কর্মী ও ভূমিকা (Users & RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ম্যানেজার, ক্যাশিয়ার ও ইনভেন্টরি কর্মীদের অ্যাকাউন্ট এবং অনুমতি ব্যবস্থাপনা
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-emerald-700 hover:bg-emerald-800">
          <PlusCircle className="w-4 h-4 mr-1.5" />
          নতুন কর্মী যোগ করুন
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400">কর্মী তালিকা লোড হচ্ছে...</p>
        ) : users.length === 0 ? (
          <p className="p-10 text-center text-slate-400">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">কর্মীর নাম</th>
                  <th className="py-3 px-4">ইমেইল</th>
                  <th className="py-3 px-4">ফোন</th>
                  <th className="py-3 px-4">ভূমিকা (Role)</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{u.email}</td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          u.role === 'OWNER'
                            ? 'success'
                            : u.role === 'MANAGER'
                            ? 'info'
                            : 'default'
                        }
                      >
                        {roleDisplayBn[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={u.active ? 'success' : 'danger'}>
                        {u.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.role !== 'OWNER' && (
                        <button
                          onClick={() => toggleUserActive(u)}
                          className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                            u.active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন কর্মী যোগ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-3">
          <Input
            label="কর্মীর পূর্ণ নাম *"
            placeholder="নাম লিখুন"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            type="email"
            label="ইমেইল অ্যাড্রেস *"
            placeholder="example@agrostore.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="মোবাইল নম্বর"
            placeholder="017xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পদবি ও ভূমিকা (Role) *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="CASHIER">ক্যাশিয়ার / বিক্রয়কর্মী (POS & Sales)</option>
              <option value="INVENTORY_MANAGER">ইনভেন্টরি ম্যানেজার (Stock & Purchases)</option>
              <option value="MANAGER">ম্যানেজার (Managerial Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting} className="bg-emerald-700 hover:bg-emerald-800">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
