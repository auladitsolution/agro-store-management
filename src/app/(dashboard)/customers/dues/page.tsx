'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Search, CheckCircle, User, ArrowLeft, Printer } from 'lucide-react';
import { ICustomer } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

export default function DueCollectionPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);

  // Form
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CARD' | 'OTHER'>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal
  const [collectionReceipt, setCollectionReceipt] = useState<any>(null);

  const fetchDueCustomers = async () => {
    try {
      const res = await fetch('/api/customers?hasDue=true');
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching due customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueCustomers();
  }, []);

  const handleSelectCustomer = (c: ICustomer) => {
    setSelectedCustomer(c);
    setAmount(c.currentBalance.toString());
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('কাস্টমার নির্বাচন করুন');
      return;
    }

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      toast.error('টাকার পরিমাণ শূন্যের বেশি হতে হবে');
      return;
    }

    if (numAmount > selectedCustomer.currentBalance) {
      toast.error(`আদায়ের পরিমাণ বর্তমান বকেয়া (৳ ${selectedCustomer.currentBalance})-এর চেয়ে বেশি হতে পারে না`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customers/due-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: selectedCustomer._id,
          amount: numAmount,
          paymentMethod,
          referenceNumber,
          date,
          notes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('বাকি সফলভাবে আদায় ও লেজারে লিপিবদ্ধ হয়েছে!');
        setCollectionReceipt(json);
        setSelectedCustomer(null);
        setAmount('');
        setNotes('');
        fetchDueCustomers();
      } else {
        toast.error(json.message || 'বাকি আদায় ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            দ্রুত বাকি আদায় (Quick Due Collection)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            কাস্টমারের ফোন বা নাম দিয়ে দ্রুত বকেয়া খুঁজে আদায় ও রসিদ তৈরি করুন
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Customer Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">১. কাস্টমার খুঁজুন</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="মোবাইল নম্বর বা নাম লিখুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">লোড হচ্ছে...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">কোনো বকেয়া কাস্টমার পাওয়া যায়নি</p>
            ) : (
              filtered.map((c) => {
                const isSelected = selectedCustomer?._id === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-[11px] text-slate-500">{c.phone}</p>
                      {c.village && <p className="text-[10px] text-slate-400">{c.village}</p>}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">বর্তমান বাকি:</span>
                      <span className="font-bold text-sm text-rose-600">
                        {formatBDT(c.currentBalance)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Payment Entry Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">২. বাকি আদায় বিবরণ</h3>

          {selectedCustomer ? (
            <form onSubmit={handleCollectSubmit} className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{selectedCustomer.name}</span>
                  <span className="text-slate-500">{selectedCustomer.phone}</span>
                </div>
                <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t border-amber-200/60">
                  <span className="text-slate-600">বর্তমান বকেয়া:</span>
                  <span className="font-bold text-base text-rose-700">
                    {formatBDT(selectedCustomer.currentBalance)}
                  </span>
                </div>
              </div>

              <Input
                type="number"
                label="আদায়কৃত টাকার পরিমাণ *"
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
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="BANK">ব্যাংক ট্রান্সফার</option>
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
                label="রেফারেন্স / ট্রানজাকশন আইডি (ঐচ্ছিক)"
                placeholder="যেমন: বিকাশ TrxID"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />

              <Input
                label="মন্তব্য / নোট"
                placeholder="ঐচ্ছিক মন্তব্য..."
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
                  বাকি আদায় সম্পন্ন করুন
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-24 text-slate-400 text-xs">
              বাকি আদায় করতে বাঁদিকের তালিকা থেকে কাস্টমার নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>

      {/* Collection Receipt Modal */}
      {collectionReceipt && (
        <Modal
          isOpen={!!collectionReceipt}
          onClose={() => setCollectionReceipt(null)}
          title="বাকি আদায়ের রসিদ"
          maxWidth="md"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800">বাকি সফলভাবে আদায় হয়েছে!</h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">রসিদ নম্বর:</span>
                <span className="font-mono font-bold">{collectionReceipt.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">কাস্টমার:</span>
                <span className="font-semibold">{collectionReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পূর্বের বাকি:</span>
                <span>{formatBDT(collectionReceipt.previousDue)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-200 pt-1">
                <span>আদায়কৃত টাকা:</span>
                <span>{formatBDT(collectionReceipt.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>অবশিষ্ট বকেয়া:</span>
                <span>{formatBDT(collectionReceipt.currentBalance)}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" />
                রসিদ প্রিন্ট করুন
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCollectionReceipt(null)}>
                বন্ধ করুন
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
