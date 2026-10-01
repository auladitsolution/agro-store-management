'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, Search } from 'lucide-react';
import { IStockMovement } from '@/types';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<IStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        let url = '/api/inventory/movements?limit=100';
        if (typeFilter) url += `&type=${typeFilter}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setMovements(json.data || []);
        }
      } catch (err) {
        console.error('Error fetching stock movements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [typeFilter]);

  const typeLabelsBn: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
    PURCHASE: { label: 'ক্রয় চালান', variant: 'success' },
    SALE: { label: 'বিক্রয় চালান', variant: 'info' },
    SALE_RETURN: { label: 'বিক্রয় ফেরত', variant: 'success' },
    PURCHASE_RETURN: { label: 'সাপ্লায়ারে ফেরত', variant: 'danger' },
    ADJUSTMENT_IN: { label: 'সমন্বয় (বৃদ্ধি)', variant: 'success' },
    ADJUSTMENT_OUT: { label: 'সমন্বয় (হ্রাস)', variant: 'danger' },
    DAMAGE: { label: 'নষ্ট / ড্যামেজ', variant: 'danger' },
    EXPIRED: { label: 'মেয়াদোত্তীর্ণ বাতিল', variant: 'danger' },
    OPENING_STOCK: { label: 'প্রারম্ভিক স্টক', variant: 'default' },
  };

  const filtered = movements.filter((m) => {
    if (!searchTerm) return true;
    const prodName = (m.product as any)?.nameBn || '';
    const refNo = m.referenceNumber || '';
    return (
      prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              ইনভেন্টরিতে ফিরুন
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-700" />
              স্টক মুভমেন্ট ও ট্র্যাকিং হিস্ট্রি (Stock Ledger)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রতিটি পণ্য ও ব্যাচের স্টক হ্রাস-বৃদ্ধির অডিট ও ট্রানজাকশন লগ
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পণ্য বা রেফারেন্স চালান নম্বর..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
        >
          <option value="">সকল মুভমেন্ট ধরন</option>
          <option value="PURCHASE">ক্রয় চালান (Purchase)</option>
          <option value="SALE">বিক্রয় চালান (Sale)</option>
          <option value="SALE_RETURN">বিক্রয় ফেরত (Sale Return)</option>
          <option value="PURCHASE_RETURN">সাপ্লায়ারে ফেরত (Purchase Return)</option>
          <option value="ADJUSTMENT_IN">সমন্বয় বৃদ্ধি (Adjustment In)</option>
          <option value="ADJUSTMENT_OUT">সমন্বয় হ্রাস (Adjustment Out)</option>
          <option value="DAMAGE">নষ্ট / ড্যামেজ (Damage)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">হিস্ট্রি লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো স্টক মুভমেন্ট রেকর্ড পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4">পণ্য</th>
                  <th className="py-3 px-4">ধরন</th>
                  <th className="py-3 px-4 text-center">পরিবর্তন পরিমাণ</th>
                  <th className="py-3 px-4 text-center">পূর্বের স্টক</th>
                  <th className="py-3 px-4 text-center">বর্তমান স্টক</th>
                  <th className="py-3 px-4">রেফারেন্স / কারণ</th>
                  <th className="py-3 px-4">কর্মী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => {
                  const prod = m.product as any;
                  const typeMeta = typeLabelsBn[m.type] || { label: m.type, variant: 'default' };
                  const isPositive = m.quantity > 0;

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600">{formatDateBD(m.createdAt, true)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{prod?.nameBn || '-'}</span>
                        <span className="block text-[11px] text-slate-400">{prod?.productCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={typeMeta.variant}>{typeMeta.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">
                        {m.previousStock} {m.unit}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {m.newStock} {m.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium text-slate-700">{m.referenceNumber || '-'}</span>
                        {m.reason && <span className="block text-[11px] text-slate-400">{m.reason}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {(m.createdBy as any)?.name || 'সিস্টেম'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
