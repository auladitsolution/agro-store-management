'use client';

import React, { useState } from 'react';
import { Search, RotateCcw, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatBDT } from '@/lib/utils/money';
import { toast } from 'sonner';

export default function PurchaseReturnsPage() {
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPurchase, setFoundPurchase] = useState<any>(null);

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSearchPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSearch.trim()) return;

    setSearching(true);
    setFoundPurchase(null);
    setSelectedItems({});

    try {
      const res = await fetch('/api/purchases?limit=20');
      if (res.ok) {
        const json = await res.json();
        const matched = (json.data || []).find(
          (p: any) =>
            p.purchaseNumber.toUpperCase() === purchaseSearch.trim().toUpperCase() ||
            (p.invoiceNumber && p.invoiceNumber.toUpperCase() === purchaseSearch.trim().toUpperCase())
        );

        if (matched) {
          setFoundPurchase(matched);
        } else {
          toast.error(`চালান "${purchaseSearch}" পাওয়া যায়নি`);
        }
      }
    } catch {
      toast.error('ক্রয় চালান খোঁজা সম্ভব হয়নি');
    } finally {
      setSearching(false);
    }
  };

  const handleReturnSubmit = async () => {
    const itemsToReturn = Object.keys(selectedItems)
      .filter((productId) => selectedItems[productId] > 0)
      .map((productId) => {
        const originalItem = foundPurchase.items.find(
          (i: any) => i.product === productId || (i.product as any)._id === productId
        );
        return {
          product: productId,
          batch: originalItem?.batchId,
          quantity: selectedItems[productId],
          unit: originalItem?.unit,
          unitPrice: originalItem?.purchasePrice || 0,
          reason: reasons[productId] || 'কোম্পানিতে ফেরত',
        };
      });

    if (itemsToReturn.length === 0) {
      toast.error('অনুগ্রহ করে ফেরত দেওয়ার পণ্য ও পরিমাণ দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/purchases/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: foundPurchase._id,
          items: itemsToReturn,
          notes: 'সাপ্লায়ার গোডাউনে মাল ফেরত',
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('পণ্য সাপ্লায়ারে সফলভাবে ফেরত পাঠানো হয়েছে এবং স্টক কমেছে!');
        setFoundPurchase(null);
        setSelectedItems({});
        setPurchaseSearch('');
      } else {
        toast.error(json.message || 'ফেরত প্রক্রিয়াকরণ ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ ত্রুটি');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-700" />
          সাপ্লায়ারে মালামাল ফেরত (Purchase Return)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          নষ্ট, মেয়াদহীন বা ভুল মালামাল কোম্পানিতে ফেরত পাঠানো এবং দেনা হিসাব সমন্বয়।
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchPurchase} className="flex gap-3">
          <input
            type="text"
            placeholder="ক্রয় চালান নং (যেমন: PUR-123456) বা ইনভয়েস নং লিখুন..."
            value={purchaseSearch}
            onChange={(e) => setPurchaseSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Button type="submit" isLoading={searching}>
            চালান খুঁজুন
          </Button>
        </form>
      </div>

      {foundPurchase && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400">চালান:</span>{' '}
              <b className="text-emerald-800">{foundPurchase.purchaseNumber}</b>
            </div>
            <div>
              <span className="text-slate-400">সাপ্লায়ার:</span>{' '}
              <b>{foundPurchase.supplier?.company || foundPurchase.supplier?.name}</b>
            </div>
            <div>
              <span className="text-slate-400">মোট বিল:</span>{' '}
              <b>{formatBDT(foundPurchase.grandTotal)}</b>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-800">ফেরত পাঠানোর পণ্য নির্বাচন করুন:</h3>

          <div className="space-y-3">
            {foundPurchase.items.map((item: any, idx: number) => {
              const pId = item.product?._id || item.product;
              const returnQty = selectedItems[pId] || 0;

              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.productNameBn}</p>
                      <p className="text-slate-500">
                        ক্রয় পরিমাণ: {item.quantity} {item.unit} | ক্রয় দর: {formatBDT(item.purchasePrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">ফেরত পরিমাণ:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnQty}
                        onChange={(e) => {
                          const val = Math.min(item.quantity, Math.max(0, Number(e.target.value) || 0));
                          setSelectedItems({ ...selectedItems, [pId]: val });
                        }}
                        className="w-16 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  {returnQty > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        placeholder="ফেরত পাঠানোর কারণ লিখুন (যেমন: বোতল ভাঙা / ডেট কাছাকাছি)..."
                        value={reasons[pId] || ''}
                        onChange={(e) => setReasons({ ...reasons, [pId]: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button onClick={handleReturnSubmit} isLoading={submitting} className="bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              কোম্পানিতে ফেরত নিশ্চিত করুন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
