'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Phone, MapPin, Receipt, History } from 'lucide-react';
import { ICustomer, ICustomerLedger, ISale } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [ledger, setLedger] = useState<ICustomerLedger[]>([]);
  const [recentSales, setRecentSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Due Collection Modal
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const [custRes, ledgerRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/customers/${id}/ledger`),
      ]);

      if (custRes.ok) {
        const cData = await custRes.json();
        setCustomer(cData.data);
        setRecentSales(cData.data?.recentSales || []);
      }
      if (ledgerRes.ok) {
        const lData = await ledgerRes.json();
        setLedger(lData.data || []);
      }
    } catch (err) {
      console.error('Error fetching customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(collectAmount) || 0;
    if (amount <= 0) {
      toast.error('টাকার পরিমাণ দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customers/due-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: id,
          amount,
          paymentMethod,
          referenceNumber,
          date: new Date().toISOString().split('T')[0],
          notes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('বাকি সফলভাবে আদায় ও লেজারে লিপিবদ্ধ হয়েছে!');
        setIsDueModalOpen(false);
        setCollectAmount('');
        setNotes('');
        fetchProfile();
      } else {
        toast.error(json.message || 'বাকি আদায় ব্যর্থ');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !customer) {
    return <div className="p-8 text-center text-slate-400">কাস্টমার তথ্য লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              কাস্টমার তালিকা
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{customer.name}</h1>
            <p className="text-xs text-slate-500 font-mono">কোড: {customer.customerCode}</p>
          </div>
        </div>

        {customer.currentBalance > 0 && (
          <Button
            size="sm"
            onClick={() => {
              setCollectAmount(customer.currentBalance.toString());
              setIsDueModalOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            <Wallet className="w-3.5 h-3.5 mr-1.5" />
            বাকি আদায় করুন
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">বর্তমান বকেয়া বাকি</p>
          <h3 className="text-xl font-bold text-rose-600 mt-1">
            {formatBDT(customer.currentBalance)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ক্রেডিট লিমিট: {customer.creditLimit > 0 ? formatBDT(customer.creditLimit) : 'সীমাহীন'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">সর্বমোট ক্রয়</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">
            {formatBDT(customer.totalPurchases || 0)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            সর্বমোট পরিশোধ: {formatBDT(customer.totalPaid || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">যোগাযোগ ও ঠিকানা</p>
          <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            {customer.phone}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {customer.village || ''} {customer.union ? `, ${customer.union}` : ''}
          </p>
        </div>
      </div>

      {/* Customer Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            কাস্টমার লেজার বিবরণী (Ledger Transactions)
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
                  <th className="py-2.5 px-3 text-right">ডেবিট (বিক্রয় পাওনা)</th>
                  <th className="py-2.5 px-3 text-right">ক্রেডিট (পরিশোধ)</th>
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
                          row.type === 'SALE'
                            ? 'danger'
                            : row.type === 'PAYMENT'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {row.type === 'SALE'
                          ? 'বিক্রয়'
                          : row.type === 'PAYMENT'
                          ? 'বাকি আদায়'
                          : row.type === 'SALE_RETURN'
                          ? 'বিক্রয় ফেরত'
                          : 'প্রারম্ভিক'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">{row.referenceNumber || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {row.debit > 0 ? formatBDT(row.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
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

      {/* Due Collection Modal */}
      <Modal
        isOpen={isDueModalOpen}
        onClose={() => setIsDueModalOpen(false)}
        title="বাকি আদায় (Due Collection)"
        maxWidth="md"
      >
        <form onSubmit={handleDueSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl text-xs flex justify-between items-center text-amber-900 border border-amber-200">
            <span>বর্তমান বাকি দেনা:</span>
            <span className="font-bold text-base text-rose-700">{formatBDT(customer.currentBalance)}</span>
          </div>

          <Input
            type="number"
            min="1"
            max={customer.currentBalance}
            label="আদায়ের পরিমাণ (টাকা) *"
            placeholder="আদায়ের পরিমাণ লিখুন"
            value={collectAmount}
            onChange={(e) => setCollectAmount(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মেথড</label>
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

            <Input
              label="ট্রানজাকশন / স্লিপ নং"
              placeholder="ঐচ্ছিক"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <Input
            label="মন্তব্য / নোট"
            placeholder="যেমন: ধান বিক্রির পর কিস্তি পরিশোধ..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDueModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting} className="bg-emerald-700 hover:bg-emerald-800">
              আদায় সম্পন্ন ও লেজার আপডেট করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
