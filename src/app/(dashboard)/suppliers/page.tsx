'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, PlusCircle, Search, Eye, Phone, Download } from 'lucide-react';
import { ISupplier } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Supplier Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplierCode: '',
    name: '',
    company: '',
    phone: '',
    alternativePhone: '',
    email: '',
    address: '',
    openingBalance: 0,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const json = await res.json();
        setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      supplierCode: `SUP-${Date.now().toString().slice(-4)}`,
      name: '',
      company: '',
      phone: '',
      alternativePhone: '',
      email: '',
      address: '',
      openingBalance: 0,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.phone) {
      toast.error('কোম্পানির নাম এবং ফোন নম্বর আবশ্যক');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('সাপ্লায়ার সফলভাবে নিবন্ধিত হয়েছে');
        setIsModalOpen(false);
        fetchSuppliers();
      } else {
        toast.error(json.message || 'সাপ্লায়ার যোগ ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = suppliers.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.company.toLowerCase().includes(term) ||
      s.name.toLowerCase().includes(term) ||
      s.phone.includes(term) ||
      s.supplierCode.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            সাপ্লায়ার ও কোম্পানি তালিকা
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            বীজ, সার ও কীটনাশক সরবরাহকারী কোম্পানিদের খাতা ও বকেয়া দেনা
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/suppliers/payments">
            <Button size="sm" variant="outline">
              পেমেন্ট প্রদান
            </Button>
          </Link>
          <a href="/api/export?type=suppliers" download>
            <Button size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1" />
              এক্সপোর্ট
            </Button>
          </a>
          <Button size="sm" onClick={handleOpenAdd} className="bg-emerald-700 hover:bg-emerald-800">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            নতুন সাপ্লায়ার
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="কোম্পানির নাম, প্রতিনিধি বা ফোন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">সাপ্লায়ার লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো সাপ্লায়ার পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">সাপ্লায়ার কোড</th>
                  <th className="py-3 px-4">কোম্পানির নাম</th>
                  <th className="py-3 px-4">প্রতিনিধির নাম</th>
                  <th className="py-3 px-4">মোবাইল</th>
                  <th className="py-3 px-4 text-right">মোট ক্রয়</th>
                  <th className="py-3 px-4 text-right">মোট পরিশোধ</th>
                  <th className="py-3 px-4 text-right">বর্তমান বকেয়া দেনা</th>
                  <th className="py-3 px-4 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{s.supplierCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <Link href={`/suppliers/${s._id}`} className="hover:text-emerald-700">
                        {s.company}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {s.phone}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatBDT(s.totalPurchases || 0)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700">{formatBDT(s.totalPaid || 0)}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      {s.currentBalance > 0 ? (
                        <span className="text-rose-600">{formatBDT(s.currentBalance)}</span>
                      ) : (
                        <span className="text-slate-400">৳ ০.০০</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link href={`/suppliers/${s._id}`}>
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

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন সাপ্লায়ার / কোম্পানি যোগ করুন"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="সাপ্লায়ার কোড *"
              value={formData.supplierCode}
              onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="কোম্পানির নাম *"
              placeholder="যেমন: সিনজেনটা বাংলাদেশ"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="প্রতিনিধি / কর্মকর্তার নাম *"
              placeholder="কর্মকর্তার নাম"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="মোবাইল নম্বর *"
              placeholder="017xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <Input
            label="ঠিকানা (ঐচ্ছিক)"
            placeholder="অফিস বা গোডাউনের ঠিকানা..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Input
            type="number"
            label="প্রারম্ভিক বকেয়া দেনা (যদি থাকে)"
            value={formData.openingBalance || ''}
            onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) || 0 })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
