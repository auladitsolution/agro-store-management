'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Search, CheckCircle, Building2, ArrowLeft } from 'lucide-react';
import { ISupplier } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function SupplierPaymentsPage() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CARD' | 'OTHER'>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const json = await res.json();
        setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSelect = (s: ISupplier) => {
    setSelectedSupplier(s);
    setAmount(s.currentBalance > 0 ? s.currentBalance.toString() : '');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      toast.error('সাপ্লায়ার নির্বাচন করুন');
      return;
    }

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      toast.error('টাকার পরিমাণ দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/suppliers/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: selectedSupplier._id,
          amount: numAmount,
          paymentMethod,
          referenceNumber,
          date,
          notes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('সাপ্লায়ার পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে!');
        setSelectedSupplier(null);
        setAmount('');
        setNotes('');
        fetchSuppliers();
      } else {
        toast.error(json.message || 'পেমেন্ট ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-700" />
          সাপ্লায়ার / কোম্পানি পেমেন্ট প্রদান (Supplier Payment)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          সার ও কীটনাশক কোম্পানির বকেয়া পাওনা পরিশোধ ও খাতা হালনাগাদ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">১. কোম্পানি বা সাপ্লায়ার খুঁজুন</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="কোম্পানির নাম বা মোবাইল..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">লোড হচ্ছে...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">কোনো সাপ্লায়ার পাওয়া যায়নি</p>
            ) : (
              filtered.map((s) => {
                const isSelected = selectedSupplier?._id === s._id;
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{s.company}</p>
                      <p className="text-[11px] text-slate-500">প্রতিনিধি: {s.name} ({s.phone})</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">বকেয়া পাওনা:</span>
                      <span className="font-bold text-sm text-rose-600">
                        {formatBDT(s.currentBalance)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">২. পেমেন্ট বিবরণ</h3>

          {selectedSupplier ? (
            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{selectedSupplier.company}</span>
                  <span className="text-slate-500">{selectedSupplier.phone}</span>
                </div>
                <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t border-slate-200">
                  <span className="text-slate-600">কোম্পানির বর্তমান পাওনা:</span>
                  <span className="font-bold text-base text-rose-700">
                    {formatBDT(selectedSupplier.currentBalance)}
                  </span>
                </div>
              </div>

              <Input
                type="number"
                min="1"
                label="প্রদেয় টাকার পরিমাণ *"
                placeholder="টাকার পরিমাণ লিখুন"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="CASH">নগদ (Cash)</option>
                    <option value="BANK">ব্যাংক ট্রান্সফার / চেক</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                  </select>
                </div>

                <Input
                  type="date"
                  label="তারিখ *"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <Input
                label="চেক নং / ট্রানজাকশন আইডি"
                placeholder="ঐচ্ছিক"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />

              <Input
                label="মন্তব্য / নোট"
                placeholder="পেমেন্ট বিবরণ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 py-2.5 font-bold text-sm shadow-md"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  পেমেন্ট নিশ্চিত ও লেজার আপডেট করুন
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-24 text-slate-400 text-xs">
              পেমেন্ট প্রদান করতে বাঁদিকের তালিকা থেকে সাপ্লায়ার নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
