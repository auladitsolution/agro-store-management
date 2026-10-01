'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Sliders,
  History,
  AlertTriangle,
  Clock,
  ArrowRight,
  Search,
} from 'lucide-react';
import { IBatch, IProduct } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { evaluateBatchExpiry } from '@/lib/utils/fefo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [batches, setBatches] = useState<IBatch[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'expiring' | 'expired'>('all');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustBatchId, setAdjustBatchId] = useState('');
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'DAMAGE' | 'EXPIRED'>('ADJUSTMENT_OUT');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      const [batchRes, prodRes] = await Promise.all([
        fetch('/api/batches'),
        fetch('/api/products?limit=200'),
      ]);

      if (batchRes.ok) {
        const bJson = await batchRes.json();
        setBatches(bJson.data || []);
      }
      if (prodRes.ok) {
        const pJson = await prodRes.json();
        setProducts(pJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId || !adjustQty || !adjustReason) {
      toast.error('অনুগ্রহ করে সকল তথ্য পূরণ করুন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: adjustProductId,
          batch: adjustBatchId || undefined,
          type: adjustType,
          quantity: adjustQty,
          reason: adjustReason,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'স্টক সমন্বয় সফল হয়েছে');
        setIsAdjustModalOpen(false);
        setAdjustReason('');
        setAdjustQty(1);
        fetchInventory();
      } else {
        toast.error(json.message || 'সমন্বয় ব্যর্থ');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  const analyzedBatches = batches.map((b) => ({
    ...b,
    analysis: evaluateBatchExpiry(b),
  }));

  const filteredBatches = analyzedBatches.filter((b) => {
    const prodName = (b.product as any)?.nameBn || '';
    const matchesSearch =
      !searchTerm ||
      prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'expiring') return b.analysis.isExpiringSoon;
    if (filterMode === 'expired') return b.analysis.isExpired;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-700" />
            স্টক ও ব্যাচ ইনভেন্টরি (FEFO & Expiry)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ফার্স্ট এক্সপায়ার ফার্স্ট আউট (FEFO) অনুযায়ী প্রতিটি ব্যাচের স্টক ও মেয়াদ নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/inventory/movements">
            <Button size="sm" variant="outline">
              <History className="w-3.5 h-3.5 mr-1.5" />
              স্টক মুভমেন্ট হিস্ট্রি
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsAdjustModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            স্টক সমন্বয় (Adjustment)
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পণ্য বা ব্যাচ নম্বর দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md font-medium ${
              filterMode === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            সকল অ্যাক্টিভ ব্যাচ
          </button>
          <button
            onClick={() => setFilterMode('expiring')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 ${
              filterMode === 'expiring' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            <Clock className="w-3 h-3" />
            শীঘ্রই মেয়াদ শেষ (৬০ দিন)
          </button>
          <button
            onClick={() => setFilterMode('expired')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 ${
              filterMode === 'expired' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            মেয়াদোত্তীর্ণ ব্যাচ
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">ইনভেন্টরি লোড হচ্ছে...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো ব্যাচ পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">পণ্য</th>
                  <th className="py-3 px-4">ব্যাচ নং</th>
                  <th className="py-3 px-4">সাপ্লায়ার</th>
                  <th className="py-3 px-4 text-center">অবশিষ্ট স্টক</th>
                  <th className="py-3 px-4 text-right">ক্রয় দর</th>
                  <th className="py-3 px-4 text-right">বিক্রয় দর</th>
                  <th className="py-3 px-4">মেয়াদ শেষ</th>
                  <th className="py-3 px-4 text-center">মেয়াদ অবস্থা (FEFO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => {
                  const prod = b.product as any;
                  const sup = b.supplier as any;
                  const isExp = b.analysis.isExpired;
                  const isSoon = b.analysis.isExpiringSoon;

                  return (
                    <tr
                      key={b._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isExp ? 'bg-rose-50/40' : isSoon ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{prod?.nameBn || '-'}</span>
                        <span className="block text-[11px] text-slate-400">{prod?.productCode}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{b.batchNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{sup?.company || sup?.name || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {b.remainingQuantity} {prod?.unit || ''}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatBDT(b.purchasePrice)}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-800">
                        {formatBDT(b.salePrice)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDateBD(b.expiryDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isExp ? 'danger' : isSoon ? 'warning' : 'success'}>
                          {b.analysis.statusLabelBn}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="স্টক সমন্বয় করুন (Stock Adjustment)"
        maxWidth="md"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">পণ্য নির্বাচন করুন *</label>
            <select
              value={adjustProductId}
              onChange={(e) => setAdjustProductId(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">পণ্য নির্বাচন করুন</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nameBn} - বর্তমান স্টক: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">সমন্বয়ের ধরন *</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ADJUSTMENT_IN">স্টক বৃদ্ধি (গণনায় বেশি পাওয়া)</option>
                <option value="ADJUSTMENT_OUT">স্টক হ্রাস (গণনায় কম পাওয়া)</option>
                <option value="DAMAGE">নষ্ট / ভাঙা (Damage)</option>
                <option value="EXPIRED">মেয়াদ শেষ বাতিল (Expired)</option>
              </select>
            </div>

            <Input
              type="number"
              min="0.01"
              step="any"
              label="পরিমাণ *"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
              required
            />
          </div>

          <Input
            label="সমন্বয়ের কারণ / ব্যাখ্যা *"
            placeholder="যেমন: গোডাউনে ব্যাগ ফুটো হয়ে নষ্ট বা বাৎসরিক অডিট..."
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              সমন্বয় সম্পন্ন করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
