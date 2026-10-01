'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Printer, PlusCircle, ArrowUpDown } from 'lucide-react';
import { ISale } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ReceiptTemplate } from '@/components/receipt/ReceiptTemplate';

export default function SalesListPage() {
  const [sales, setSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Receipt Modal
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchSales = async () => {
    try {
      let url = '/api/sales?limit=100';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setSales(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [statusFilter]);

  const filteredSales = sales.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.saleNumber.toLowerCase().includes(term) ||
      (s.customerName && s.customerName.toLowerCase().includes(term)) ||
      (s.customerPhone && s.customerPhone.includes(term))
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">বিক্রয় চালান তালিকা</h1>
          <p className="text-xs text-slate-500 mt-0.5">সকল বিক্রয় চালান, বিল ও পেমেন্ট হিস্ট্রি</p>
        </div>

        <Link href="/pos">
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            নতুন বিক্রয় (POS)
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="চালান নং, কাস্টমার নাম বা ফোন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">পেমেন্ট ফিল্টার:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="PAID">পরিশোধিত (Paid)</option>
            <option value="PARTIAL">আংশিক বাকি (Partial)</option>
            <option value="DUE">সম্পূর্ণ বাকি (Due)</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">বিক্রয় চালান লোড হচ্ছে...</div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো বিক্রয় চালান পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">চালান নং</th>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4">কাস্টমার</th>
                  <th className="py-3 px-4">ধরন</th>
                  <th className="py-3 px-4 text-right">সর্বমোট বিল</th>
                  <th className="py-3 px-4 text-right">পরিশোধ</th>
                  <th className="py-3 px-4 text-right">বাকি</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-800">{sale.saleNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDateBD(sale.createdAt, true)}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{sale.customerName || 'ক্যাশ কাস্টমার'}</span>
                      {sale.customerPhone && (
                        <span className="block text-[11px] text-slate-400">{sale.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sale.saleType === 'WHOLESALE' ? 'পাইকারি' : 'খুচরা'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatBDT(sale.grandTotal)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-medium">
                      {formatBDT(sale.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {sale.dueAmount > 0 ? (
                        <span className="text-rose-600 font-bold">{formatBDT(sale.dueAmount)}</span>
                      ) : (
                        <span className="text-slate-400">৳ ০.০০</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          sale.paymentStatus === 'PAID'
                            ? 'success'
                            : sale.paymentStatus === 'PARTIAL'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {sale.paymentStatus === 'PAID'
                          ? 'পরিশোধিত'
                          : sale.paymentStatus === 'PARTIAL'
                          ? 'আংশিক বাকি'
                          : 'বাকি'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSale(sale);
                          setIsReceiptOpen(true);
                        }}
                        className="p-1.5"
                        title="রসিদ প্রিন্ট করুন"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        রসিদ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECEIPT MODAL */}
      {selectedSale && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title="চালান রসিদ প্রিন্ট"
          maxWidth="lg"
        >
          <ReceiptTemplate sale={selectedSale} onClose={() => setIsReceiptOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
