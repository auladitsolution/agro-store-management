'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, PlusCircle, Search, FileText } from 'lucide-react';
import { IPurchase } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function PurchasesListPage() {
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases?limit=100');
      if (res.ok) {
        const json = await res.json();
        setPurchases(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const supName = (p.supplier as any)?.company || (p.supplier as any)?.name || '';
    return (
      p.purchaseNumber.toLowerCase().includes(term) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
      supName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-700" />
            সাপ্লায়ার ক্রয় চালান তালিকা
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">কোম্পানি ও ডিলার থেকে মালামাল ক্রয়ের হিসাব</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/purchases/returns">
            <Button size="sm" variant="outline">
              পণ্য ফেরত (Purchase Return)
            </Button>
          </Link>
          <Link href="/purchases/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              নতুন ক্রয় চালান
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="চালান নং, ইনভয়েস নং বা সাপ্লায়ার..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">ক্রয় তথ্য লোড হচ্ছে...</div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো ক্রয় চালান পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">চালান নং</th>
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4">সাপ্লায়ার</th>
                  <th className="py-3 px-4">ইনভয়েস নং</th>
                  <th className="py-3 px-4 text-right">সর্বমোট ক্রয়মূল্য</th>
                  <th className="py-3 px-4 text-right">পরিশোধ</th>
                  <th className="py-3 px-4 text-right">বাকি দেনা</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => {
                  const sup = p.supplier as any;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-emerald-800">{p.purchaseNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDateBD(p.purchaseDate)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{sup?.company || sup?.name || '-'}</span>
                        {sup?.phone && <span className="block text-[11px] text-slate-400">{sup.phone}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{p.invoiceNumber || '-'}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatBDT(p.grandTotal)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-medium">
                        {formatBDT(p.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {p.dueAmount > 0 ? (
                          <span className="text-rose-600 font-bold">{formatBDT(p.dueAmount)}</span>
                        ) : (
                          <span className="text-slate-400">৳ ০.০০</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            p.paymentStatus === 'PAID'
                              ? 'success'
                              : p.paymentStatus === 'PARTIAL'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {p.paymentStatus === 'PAID'
                            ? 'পরিশোধিত'
                            : p.paymentStatus === 'PARTIAL'
                            ? 'আংশিক বাকি'
                            : 'বাকি'}
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
    </div>
  );
}
