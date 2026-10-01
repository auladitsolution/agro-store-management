'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, PlusCircle, Search, Wallet, Eye, Phone, Download } from 'lucide-react';
import { ICustomer } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dueOnly, setDueOnly] = useState(false);

  // New Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerCode: '',
    name: '',
    phone: '',
    alternativePhone: '',
    village: '',
    union: '',
    upazila: '',
    district: 'রংপুর',
    openingBalance: 0,
    creditLimit: 20000,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      let url = '/api/customers';
      if (dueOnly) url += '?hasDue=true';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [dueOnly]);

  const handleOpenAdd = () => {
    setFormData({
      customerCode: `CUST-${Date.now().toString().slice(-4)}`,
      name: '',
      phone: '',
      alternativePhone: '',
      village: '',
      union: '',
      upazila: '',
      district: 'রংপুর',
      openingBalance: 0,
      creditLimit: 20000,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('নাম এবং মোবাইল নম্বর আবশ্যক');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('কাস্টমার সফলভাবে নিবন্ধিত হয়েছে');
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        toast.error(json.message || 'কাস্টমার যোগ ব্যর্থ');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ ব্যর্থ');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.customerCode.toLowerCase().includes(term) ||
      (c.village && c.village.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            কাস্টমার তালিকা ও বাকি খাতা (Customer Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            কৃষক ও গ্রাহকদের বিবরণ, বাকি পাওনা ও ক্রেডিট লিমিট ট্র্যাকিং
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/customers/dues">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50">
              <Wallet className="w-3.5 h-3.5 mr-1 text-amber-600" />
              বাকি আদায় করুন
            </Button>
          </Link>
          <a href="/api/export?type=customers" download>
            <Button size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1" />
              এক্সপোর্ট
            </Button>
          </a>
          <Button size="sm" onClick={handleOpenAdd} className="bg-emerald-700 hover:bg-emerald-800">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            নতুন কাস্টমার
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="কাস্টমারের নাম, ফোন বা গ্রাম..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={dueOnly}
            onChange={(e) => setDueOnly(e.target.checked)}
            className="rounded text-amber-600 focus:ring-amber-500"
          />
          <span>শুধুমাত্র যাদের কাছে বাকি আছে</span>
        </label>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">কাস্টমার তথ্য লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো কাস্টমার পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">কাস্টমার কোড</th>
                  <th className="py-3 px-4">নাম</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4">গ্রাম / ইউনিয়ন</th>
                  <th className="py-3 px-4 text-right">ক্রেডিট লিমিট</th>
                  <th className="py-3 px-4 text-right">বর্তমান বাকি</th>
                  <th className="py-3 px-4 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{c.customerCode}</td>
                    <td className="py-3 px-4">
                      <Link href={`/customers/${c._id}`} className="font-semibold text-slate-800 hover:text-emerald-700">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{c.village || '-'}</td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {c.creditLimit > 0 ? formatBDT(c.creditLimit) : 'সীমাহীন'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {c.currentBalance > 0 ? (
                        <span className="text-rose-600">{formatBDT(c.currentBalance)}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">৳ ০.০০</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link href={`/customers/${c._id}`}>
                        <Button size="sm" variant="outline" className="p-1.5 text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          লেজার
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন কাস্টমার নিবন্ধন"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="কাস্টমার কোড *"
              value={formData.customerCode}
              onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="কাস্টমারের নাম *"
              placeholder="যেমন: মোঃ আবুল হোসেন"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="মোবাইল নম্বর *"
              placeholder="017xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="বিকল্প মোবাইল নম্বর"
              placeholder="018xxxxxxxx"
              value={formData.alternativePhone}
              onChange={(e) => setFormData({ ...formData, alternativePhone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="গ্রাম / পাড়া"
              placeholder="গ্রামের নাম"
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
            />
            <Input
              label="ইউনিয়ন"
              placeholder="ইউনিয়ন"
              value={formData.union}
              onChange={(e) => setFormData({ ...formData, union: e.target.value })}
            />
            <Input
              label="উপজেলা"
              placeholder="উপজেলা"
              value={formData.upazila}
              onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              label="পূর্বের বকেয়া বাকি (যদি থাকে)"
              placeholder="০"
              value={formData.openingBalance || ''}
              onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) || 0 })}
            />
            <Input
              type="number"
              label="বাকি সীমা / ক্রেডিট লিমিট (টাকা)"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              নিবন্ধন সম্পন্ন করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
