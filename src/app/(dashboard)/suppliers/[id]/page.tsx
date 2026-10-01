'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Building2, Phone, MapPin, History } from 'lucide-react';
import { ISupplier, ISupplierLedger, IPurchase } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function SupplierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<ISupplier | null>(null);
  const [ledger, setLedger] = useState<ISupplierLedger[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CARD' | 'OTHER'>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const [supRes, ledgerRes] = await Promise.all([
        fetch(`/api/suppliers/${id}`),
        fetch(`/api/suppliers/${id}/ledger`),
      ]);

      if (supRes.ok) {
        const sData = await supRes.json();
        setSupplier(sData.data);
        setRecentPurchases(sData.data?.recentPurchases || []);
      }
      if (ledgerRes.ok) {
        const lData = await ledgerRes.json();
        setLedger(lData.data || []);
      }
    } catch (err) {
      console.error('Error fetching supplier profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payAmount) || 0;
    if (amount <= 0) {
      toast.error('টাকার পরিমাণ দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/suppliers/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: id,
          amount,
          paymentMethod,
          referenceNumber,
          date: new Date().toISOString().split('T')[0],
          notes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('পেমেন্ট সফলভাবে সংরক্ষিত ও লেজার আপডেট হয়েছে!');
        setIsPayModalOpen(false);
        setPayAmount('');
        setNotes('');
        fetchProfile();
      } else {
        toast.error(json.message || 'পেমেন্ট ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !supplier) {
    return <div className="p-8 text-center text-slate-400">সাপ্লায়ার তথ্য লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/suppliers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              সাপ্লায়ার তালিকা
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{supplier.company}</h1>
            <p className="text-xs text-slate-500">
              প্রতিনিধি: {supplier.name} | কোড: {supplier.supplierCode}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setPayAmount(supplier.currentBalance > 0 ? supplier.currentBalance.toString() : '');
            setIsPayModalOpen(true);
          }}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          <Wallet className="w-3.5 h-3.5 mr-1.5" />
          পেমেন্ট প্রদান করুন
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">বর্তমান বকেয়া দেনা (Due)</p>
          <h3 className="text-xl font-bold text-rose-600 mt-1">
            {formatBDT(supplier.currentBalance)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">কোম্পানির পাওনা</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">সর্বমোট ক্রয়</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">
            {formatBDT(supplier.totalPurchases || 0)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            সর্বমোট পরিশোধ: {formatBDT(supplier.totalPaid || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">যোগাযোগ ও ঠিকানা</p>
          <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            {supplier.phone}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {supplier.address || 'ঠিকানা দেওয়া হয়নি'}
          </p>
        </div>
      </div>

      {/* Supplier Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            সাপ্লায়ার লেজার বিবরণী (Ledger Transactions)
          </h2>
        </div>

        {ledger.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">কোনো লেজার রেকর্ড নেই</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">লেনদেনের ধরন</th>
                  <th className="py-2.5 px-3">রেফারেন্স / চালান</th>
                  <th className="py-2.5 px-3 text-right">ডেবিট (পরিশোধ/ফেরত)</th>
                  <th className="py-2.5 px-3 text-right">ক্রেডিট (ক্রয় ইনভয়েস)</th>
                  <th className="py-2.5 px-3 text-right">জের / ব্যালেন্স</th>
                  <th className="py-2.5 px-3">নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">{formatDateBD(row.date)}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          row.type === 'PURCHASE'
                            ? 'danger'
                            : row.type === 'PAYMENT'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {row.type === 'PURCHASE'
                          ? 'ক্রয় চালান'
                          : row.type === 'PAYMENT'
                          ? 'পেমেন্ট প্রদান'
                          : row.type === 'PURCHASE_RETURN'
                          ? 'পণ্য ফেরত'
                          : 'প্রারম্ভিক'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">{row.referenceNumber || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                      {row.debit > 0 ? formatBDT(row.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {row.credit > 0 ? formatBDT(row.credit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatBDT(row.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{row.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="সাপ্লায়ারকে পেমেন্ট প্রদান"
        maxWidth="md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center text-slate-700 border border-slate-200">
            <span>বর্তমান বকেয়া দেনা:</span>
            <span className="font-bold text-base text-rose-700">{formatBDT(supplier.currentBalance)}</span>
          </div>

          <Input
            type="number"
            min="1"
            label="প্রদেয় টাকার পরিমাণ *"
            placeholder="টাকার পরিমাণ লিখুন"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
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
              label="চেক / রেফারেন্স নম্বর"
              placeholder="ঐচ্ছিক"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <Input
            label="মন্তব্য / নোট"
            placeholder="পেমেন্ট সংক্রান্ত বিবরণ..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting} className="bg-emerald-700 hover:bg-emerald-800">
              পেমেন্ট সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
