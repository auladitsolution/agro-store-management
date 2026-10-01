'use client';

import React, { useState, useEffect } from 'react';
import { ReceiptText, PlusCircle, Search, Download } from 'lucide-react';
import { IExpense } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = [
  'দোকান ভাড়া',
  'কর্মচারী বেতন',
  'বিদ্যুৎ',
  'পরিবহন',
  'মালামাল বহন (কুলি/লেবার)',
  'খাবার ও চা-নাস্তা',
  'মোবাইল/ইন্টারনেট',
  'মেরামত ও রক্ষণাবেক্ষণ',
  'প্যাকেজিং খরচ',
  'অন্যান্য',
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      let url = '/api/expenses?limit=100';
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      toast.error('টাকার পরিমাণ দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: numAmount,
          date,
          description,
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('খরচ সফলভাবে যোগ করা হয়েছে');
        setIsModalOpen(false);
        setAmount('');
        setDescription('');
        fetchExpenses();
      } else {
        toast.error(json.message || 'খরচ যোগ ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = expenses.filter(
    (e) =>
      !searchTerm ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.includes(searchTerm)
  );

  const totalFilteredAmount = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-700" />
            দোকানের দৈনন্দিন খরচ (Expenses)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকান ভাড়া, কর্মচারী বেতন, বিদ্যুৎ, পরিবহন ও অন্যান্য খরচের হিসাব
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/export?type=expenses" download>
            <Button size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1" />
              এক্সপোর্ট
            </Button>
          </a>
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-emerald-700 hover:bg-emerald-800">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            নতুন খরচ যোগ করুন
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="বিবরণ দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="">সকল ক্যাটাগরি</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            মোট খরচ: {formatBDT(totalFilteredAmount)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">খরচ লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো খরচের রেকর্ড পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">বিবরণ</th>
                  <th className="py-3 px-4">পেমেন্ট মাধ্যম</th>
                  <th className="py-3 px-4 text-right">টাকার পরিমাণ</th>
                  <th className="py-3 px-4">রেকর্ডকারী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{formatDateBD(e.date)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{e.category}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{e.description}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {formatBDT(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {(e.createdBy as any)?.name || 'অ্যাডমিন'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন খরচ যোগ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="number"
            min="1"
            label="খরচের পরিমাণ (টাকা) *"
            placeholder="টাকার পরিমাণ লিখুন"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="তারিখ *"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="CASH">নগদ (Cash)</option>
                <option value="BKASH">বিকাশ (bKash)</option>
                <option value="NAGAD">নগদ (Nagad)</option>
                <option value="BANK">ব্যাংক ট্রান্সফার</option>
              </select>
            </div>
          </div>

          <Input
            label="খরচের বিবরণ *"
            placeholder="যেমন: চলতি মাসের দোকান ভাড়া পরিশোধ"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

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
