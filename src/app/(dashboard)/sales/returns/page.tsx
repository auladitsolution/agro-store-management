'use client';

import React, { useState } from 'react';
import { Search, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatBDT } from '@/lib/utils/money';
import { toast } from 'sonner';

export default function SalesReturnsPage() {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<any>(null);

  // Return Form State
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [itemConditions, setItemConditions] = useState<Record<string, string>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceSearch.trim()) return;

    setSearching(true);
    setFoundSale(null);
    setSelectedItems({});

    try {
      const res = await fetch(`/api/sales?limit=10`);
      if (res.ok) {
        const json = await res.json();
        const matched = (json.data || []).find(
          (s: any) => s.saleNumber.toUpperCase() === invoiceSearch.trim().toUpperCase()
        );

        if (matched) {
          setFoundSale(matched);
        } else {
          toast.error(`চালান নং "${invoiceSearch}" পাওয়া যায়নি`);
        }
      }
    } catch {
      toast.error('চালান খোঁজা সম্ভব হয়নি');
    } finally {
      setSearching(false);
    }
  };

  const handleReturnSubmit = async () => {
    const itemsToReturn = Object.keys(selectedItems)
      .filter((productId) => selectedItems[productId] > 0)
      .map((productId) => {
        const originalItem = foundSale.items.find(
          (i: any) => i.product === productId || (i.product as any)._id === productId
        );
        return {
          product: productId,
          batch: originalItem?.batch,
          quantity: selectedItems[productId],
          unitPrice: originalItem?.unitPrice || 0,
          condition: itemConditions[productId] || 'RESELLABLE',
          returnToStock: itemConditions[productId] === 'RESELLABLE',
          reason: returnReasons[productId] || 'গ্রাহক ফেরত দিয়েছেন',
        };
      });

    if (itemsToReturn.length === 0) {
      toast.error('অনুগ্রহ করে ফেরত দেওয়ার পণ্য ও পরিমাণ নির্বাচন করুন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: foundSale._id,
          items: itemsToReturn,
          refundMethod: 'CASH',
          notes: 'কাউন্টার থেকে ফেরত গ্রহণ',
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('পণ্য ফেরত সফলভাবে সম্পন্ন হয়েছে ও স্টক সমন্বিত হয়েছে!');
        setFoundSale(null);
        setSelectedItems({});
        setInvoiceSearch('');
      } else {
        toast.error(json.message || 'ফেরত প্রক্রিয়াকরণ ব্যর্থ');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ ব্যর্থ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-emerald-700" />
          বিক্রয় ফেরত (Sales Return)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          কাস্টমারের ফেরত দেওয়া পণ্য ইনভেন্টরি ও বাকি হিসেবে স্বয়ংক্রিয় সমন্বয় করুন।
        </p>
      </div>

      {/* Invoice Search Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchInvoice} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="মূল বিক্রয় চালান নং লিখুন (যেমন: INV-123456)..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
          <Button type="submit" isLoading={searching}>
            চালান খুঁজুন
          </Button>
        </form>
      </div>

      {/* Invoice Items & Return Selection */}
      {foundSale && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400">চালান:</span>{' '}
              <b className="text-emerald-800">{foundSale.saleNumber}</b>
            </div>
            <div>
              <span className="text-slate-400">কাস্টমার:</span>{' '}
              <b>{foundSale.customerName || 'ক্যাশ কাস্টমার'}</b>
            </div>
            <div>
              <span className="text-slate-400">সর্বমোট:</span>{' '}
              <b>{formatBDT(foundSale.grandTotal)}</b>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-800">ফেরত দেওয়ার পণ্য নির্বাচন করুন:</h3>

          <div className="space-y-3">
            {foundSale.items.map((item: any, idx: number) => {
              const pId = item.product?._id || item.product;
              const currentReturnQty = selectedItems[pId] || 0;

              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.productNameBn}</p>
                      <p className="text-slate-500">
                        মূল বিক্রয় পরিমাণ: {item.quantity} {item.unit} | দর: {formatBDT(item.unitPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">ফেরত পরিমাণ:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={currentReturnQty}
                        onChange={(e) => {
                          const val = Math.min(item.quantity, Math.max(0, Number(e.target.value) || 0));
                          setSelectedItems({ ...selectedItems, [pId]: val });
                        }}
                        className="w-16 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  {currentReturnQty > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">পণ্যের অবস্থা:</label>
                        <select
                          value={itemConditions[pId] || 'RESELLABLE'}
                          onChange={(e) =>
                            setItemConditions({ ...itemConditions, [pId]: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value="RESELLABLE">ভালো (পুনর্বিক্রয়যোগ্য - স্টকে যোগ হবে)</option>
                          <option value="DAMAGED">নষ্ট / ড্যামেজ (স্টকে যোগ হবে না)</option>
                          <option value="EXPIRED">মেয়াদোত্তীর্ণ (স্টকে যোগ হবে না)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">ফেরতের কারণ:</label>
                        <input
                          type="text"
                          placeholder="যেমন: অতিরিক্ত নেওয়া হয়েছিল"
                          value={returnReasons[pId] || ''}
                          onChange={(e) =>
                            setReturnReasons({ ...returnReasons, [pId]: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button onClick={handleReturnSubmit} isLoading={submitting} className="bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              ফেরত নিশ্চিত ও স্টক সমন্বয় করুন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
