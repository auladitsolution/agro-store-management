'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ICashShift } from '@/types';
import { formatBDT, subtractMoney } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function CashRegisterPage() {
  const [activeShift, setActiveShift] = useState<ICashShift | null>(null);
  const [pastShifts, setPastShifts] = useState<ICashShift[]>([]);
  const [loading, setLoading] = useState(true);

  // Open Shift State
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState<string>('5000');
  const [openNotes, setOpenNotes] = useState('');

  // Close Shift State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [actualCash, setActualCash] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/cash-shifts');
      if (res.ok) {
        const json = await res.json();
        setActiveShift(json.activeShift || null);
        setPastShifts(json.pastShifts || []);
      }
    } catch (err) {
      console.error('Error fetching cash shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/cash-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN',
          openingCash: Number(openingCash) || 0,
          notes: openNotes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('দিনের নতুন ক্যাশ শিফট চালু হয়েছে!');
        setIsOpenModalOpen(false);
        fetchShifts();
      } else {
        toast.error(json.message || 'শিফট চালু করা যায়নি');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const counted = Number(actualCash) || 0;

    setSubmitting(true);
    try {
      const res = await fetch('/api/cash-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE',
          actualCash: counted,
          notes: closeNotes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('ক্যাশ রেজিস্টার সফলভাবে ক্লোজ করা হয়েছে!');
        setIsCloseModalOpen(false);
        setActualCash('');
        fetchShifts();
      } else {
        toast.error(json.message || 'শিফট ক্লোজ করা যায়নি');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const discrepancy = activeShift
    ? subtractMoney(Number(actualCash) || 0, activeShift.expectedCash)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-700" />
            দৈনিক ক্যাশ রেজিস্টার ও শিফট হিসাব (Daily Cash Register)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            দিনের প্রারম্ভিক নগদ, মোট নগদ বিক্রি, নগদ আদায়, খরচ এবং সমাপনী ক্যাশ মেলানো
          </p>
        </div>

        <div>
          {activeShift ? (
            <Button
              size="sm"
              onClick={() => setIsCloseModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              শিফট ক্লোজ ও ক্যাশ মেলান
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsOpenModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              দিনের নতুন শিফট ওপেন করুন
            </Button>
          )}
        </div>
      </div>

      {/* Active Shift Status */}
      {activeShift ? (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/40 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h2 className="text-base font-bold text-slate-800">
                  চলতি ক্যাশ শিফট সক্রিয় রয়েছে
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ওপেনিং সময়: {formatDateBD(activeShift.openedAt, true)} | অপারেটর: {activeShift.openedBy}
              </p>
            </div>

            <Badge variant="success">সক্রিয় শিফট (LIVE)</Badge>
          </div>

          {/* Real-time Inflows & Outflows */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">দিনের শুরু নগদ:</span>
              <span className="font-bold text-sm text-slate-800">
                {formatBDT(activeShift.openingCash)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-emerald-700 block">নগদ বিক্রয় (POS):</span>
              <span className="font-bold text-sm text-emerald-800">
                + {formatBDT(activeShift.cashSales || 0)}
              </span>
            </div>

            <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200">
              <span className="text-teal-700 block">নগদ বাকি আদায়:</span>
              <span className="font-bold text-sm text-teal-800">
                + {formatBDT(activeShift.cashDueCollections || 0)}
              </span>
            </div>

            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
              <span className="text-rose-700 block">নগদ খরচ ও দেনা প্রদান:</span>
              <span className="font-bold text-sm text-rose-800">
                - {formatBDT((activeShift.cashExpenses || 0) + (activeShift.cashSupplierPayments || 0))}
              </span>
            </div>
          </div>

          <div className="p-4 bg-emerald-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200">ক্যাশ বাক্সে প্রত্যাশিত মোট নগদ (Expected Cash):</p>
              <h3 className="text-2xl font-bold mt-0.5">{formatBDT(activeShift.expectedCash)}</h3>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCloseModalOpen(true)}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold"
            >
              ক্যাশ ক্লোজিং করুন →
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="font-bold text-base text-amber-900">
            বর্তমানে কোনো ক্যাশ রেজিস্টার শিফট চালু নেই
          </h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            দিনের প্রথম বিক্রয় শুরুর আগে ক্যাশ ড্রয়ারে থাকা শুরুর নগদ টাকার পরিমাণ দিয়ে একটি নতুন শিফট চালু করুন।
          </p>
          <Button
            size="sm"
            onClick={() => setIsOpenModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            শিফট চালু করুন
          </Button>
        </div>
      )}

      {/* Past Shifts History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">বিগত ক্যাশ রেজিস্টার ক্লোজিং হিস্ট্রি</h2>
        </div>

        {pastShifts.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">কোনো বিগত শিফট রেকর্ড নেই</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">অপারেটর</th>
                  <th className="py-2.5 px-3 text-right">শুরুর নগদ</th>
                  <th className="py-2.5 px-3 text-right">মোট বিক্রয়</th>
                  <th className="py-2.5 px-3 text-right">প্রত্যাশিত ক্যাশ</th>
                  <th className="py-2.5 px-3 text-right">গণনাকৃত ক্যাশ</th>
                  <th className="py-2.5 px-3 text-right">পার্থক্য (Difference)</th>
                  <th className="py-2.5 px-3">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastShifts.map((s) => {
                  const diff = s.difference || 0;
                  return (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{formatDateBD(s.shiftDate)}</td>
                      <td className="py-2.5 px-3">{s.openedBy}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{formatBDT(s.openingCash)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                        {formatBDT(s.cashSales || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatBDT(s.expectedCash)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                        {s.actualCash !== undefined ? formatBDT(s.actualCash) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {diff === 0 ? (
                          <span className="text-emerald-700">মিল রয়েছে (৳ ০.০০)</span>
                        ) : diff > 0 ? (
                          <span className="text-blue-700">+{formatBDT(diff)} (উদ্বৃত্ত)</span>
                        ) : (
                          <span className="text-rose-600">{formatBDT(diff)} (ঘাটতি)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{s.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OPEN SHIFT MODAL */}
      <Modal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        title="দিনের নতুন ক্যাশ শিফট চালু করুন"
        maxWidth="md"
      >
        <form onSubmit={handleOpenShift} className="space-y-4">
          <Input
            type="number"
            min="0"
            label="শুরুর নগদ টাকার পরিমাণ (Opening Cash) *"
            placeholder="ক্যাশ ড্রয়ারে থাকা টাকা..."
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            required
          />

          <Input
            label="মন্তব্য (ঐচ্ছিক)"
            placeholder="যেমন: খুচরা টাকা সহ শুরু..."
            value={openNotes}
            onChange={(e) => setOpenNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting} className="bg-emerald-700 hover:bg-emerald-800">
              শিফট শুরু করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* CLOSE SHIFT MODAL */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="দিনের ক্যাশ ক্লোজিং ও মেলানো"
        maxWidth="md"
      >
        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span>প্রত্যাশিত নগদ (Expected):</span>
              <span className="font-bold text-slate-800">
                {activeShift ? formatBDT(activeShift.expectedCash) : '৳ ০.০০'}
              </span>
            </div>
          </div>

          <Input
            type="number"
            min="0"
            label="ড্রয়ারে গুনে পাওয়া প্রকৃত নগদ টাকা (Actual Cash) *"
            placeholder="ক্যাশ ড্রয়ার গুনে টাকা লিখুন"
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value)}
            required
          />

          {actualCash && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex justify-between ${
                discrepancy === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : discrepancy > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span>পার্থক্য (Discrepancy):</span>
              <span>
                {discrepancy === 0
                  ? 'ক্যাশ সম্পূর্ণ মিলেছে (৳ ০.০০)'
                  : discrepancy > 0
                  ? `উদ্বৃত্ত: +${formatBDT(discrepancy)}`
                  : `ঘাটতি: ${formatBDT(discrepancy)}`}
              </span>
            </div>
          )}

          <Input
            label="ক্লোজিং মন্তব্য"
            placeholder="যদি ঘাটতি বা বাড়তি থাকে কারণ লিখুন..."
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting} className="bg-rose-600 hover:bg-rose-700">
              শিফট ক্লোজ নিশ্চিত করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
