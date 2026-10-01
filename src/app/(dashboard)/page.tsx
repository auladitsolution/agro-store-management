'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingCart,
  Truck,
  Wallet,
  Building2,
  Package,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/reports/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'ডেমো ডাটা সফলভাবে সেটআপ হয়েছে!');
        fetchDashboardData();
      } else {
        toast.error(json.message || 'সিড ব্যর্থ হয়েছে');
      }
    } catch {
      toast.error('সিড ডাটা সংযোগে সমস্যা হয়েছে');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-md w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const salesTrend = data?.salesTrend || [];
  const recentSales = data?.recentSales || [];
  const lowStockProducts = data?.lowStockProducts || [];
  const expiringSoonBatches = data?.expiringSoonBatches || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>কৃষি বন্ধু এগ্রো স্টোর ড্যাশবোর্ড</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              লাইভ ডাটা
            </span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">
            আজকের বিক্রয়, ক্রয়, স্টক এবং হিসাবের রিয়েল-টাইম তথ্য একনজরে দেখুন।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {recentSales.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              isLoading={seeding}
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              <Sparkles className="w-4 h-4 mr-1 text-emerald-600" />
              ডেমো ডাটা লোড করুন
            </Button>
          )}

          <Link href="/pos">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              নতুন বিক্রয় (POS)
            </Button>
          </Link>
          <Link href="/purchases/new">
            <Button size="sm" variant="outline">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              নতুন ক্রয়
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">আজকের বিক্রয়</p>
            <h3 className="text-lg lg:text-xl font-bold text-slate-800 mt-1">
              {formatBDT(kpis.todaySales || 0)}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 inline" />
              নগদ ও বাকি মিলিয়ে
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">আজকের স্থূল লাভ</p>
            <h3 className="text-lg lg:text-xl font-bold text-emerald-700 mt-1">
              {formatBDT(kpis.todayGrossProfit || 0)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              নিট লাভ: {formatBDT(kpis.todayNetProfit || 0)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">আজকের ক্রয়</p>
            <h3 className="text-lg lg:text-xl font-bold text-slate-800 mt-1">
              {formatBDT(kpis.todayPurchases || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">সাপ্লায়ার ইনভয়েস</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">আজকের খরচ</p>
            <h3 className="text-lg lg:text-xl font-bold text-rose-600 mt-1">
              {formatBDT(kpis.todayExpenses || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">দোকান ও আনুষঙ্গিক</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Customer Total Due */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">মোট কাস্টমার বাকি পাওনা</p>
            <h3 className="text-lg lg:text-xl font-bold text-amber-700 mt-1">
              {formatBDT(kpis.totalCustomerDue || 0)}
            </h3>
            <Link href="/customers/dues" className="text-[11px] text-amber-600 hover:underline mt-0.5 block">
              বাকি আদায় করুন →
            </Link>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Supplier Total Due */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">সাপ্লায়ার বাকি দেনা</p>
            <h3 className="text-lg lg:text-xl font-bold text-slate-800 mt-1">
              {formatBDT(kpis.totalSupplierDue || 0)}
            </h3>
            <Link href="/suppliers" className="text-[11px] text-blue-600 hover:underline mt-0.5 block">
              সাপ্লায়ার তালিকা →
            </Link>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Stock Cost Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">মোট বর্তমান স্টক মূল্য</p>
            <h3 className="text-lg lg:text-xl font-bold text-slate-800 mt-1">
              {formatBDT(kpis.totalStockCostValue || 0)}
            </h3>
            <Link href="/inventory" className="text-[11px] text-emerald-600 hover:underline mt-0.5 block">
              ইনভেন্টরি দেখুন →
            </Link>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Warnings: Low Stock & Expiring */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">সতর্কবার্তা</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-rose-600">
                {kpis.lowStockCount || 0} কম স্টক
              </span>
              <span>•</span>
              <span className="text-xs font-bold text-amber-600">
                {kpis.expiringSoonCount || 0} মেয়াদ শেষ
              </span>
            </div>
            <Link href="/reports" className="text-[11px] text-slate-500 hover:underline mt-0.5 block">
              বিস্তারিত রিপোর্ট →
            </Link>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Chart Section & Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">গত ৭ দিনের বিক্রয় প্রবাহ (Sales Trend)</h2>
              <p className="text-xs text-slate-500">প্রতিদিনের মোট বিক্রয় ও ট্রেন্ড</p>
            </div>
            <Link href="/reports" className="text-xs text-emerald-600 hover:underline font-medium flex items-center">
              সম্পূর্ণ রিপোর্ট <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`৳ ${val}`, 'বিক্রয়']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock & Expiry Alerts Sidebar Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                কম স্টকের পণ্যসমূহ
              </h3>
              <Link href="/products?lowStock=true" className="text-xs text-emerald-600 hover:underline">
                সবগুলো
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">কোনো কম স্টকের পণ্য নেই</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700 truncate max-w-[140px]">{p.nameBn}</span>
                    <Badge variant="danger">
                      {p.currentStock} {p.unit} (মিনিমাম: {p.minimumStock})
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                শীঘ্রই মেয়াদ শেষ হবে
              </h3>
              <Link href="/reports?tab=expiry" className="text-xs text-emerald-600 hover:underline">
                সবগুলো
              </Link>
            </div>

            {expiringSoonBatches.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">মেয়াদ শেষের কোনো পণ্য নেই</p>
            ) : (
              <div className="space-y-2">
                {expiringSoonBatches.map((b: any) => (
                  <div key={b._id} className="flex items-center justify-between text-xs p-2 bg-amber-50/50 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-800 block truncate max-w-[130px]">
                        {b.product?.nameBn || b.batchNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">ব্যাচ: {b.batchNumber}</span>
                    </div>
                    <Badge variant="warning">{formatDateBD(b.expiryDate)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">সাম্প্রতিক বিক্রয় তালিকা</h2>
            <p className="text-xs text-slate-500">সর্বশেষ বিক্রয় চালান ও পেমেন্ট স্ট্যাটাস</p>
          </div>
          <Link href="/sales">
            <Button variant="outline" size="sm">
              সব চালান দেখুন
            </Button>
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            এখনও কোনো বিক্রয় রেকর্ড পাওয়া যায়নি। &quot;নতুন বিক্রয় (POS)&quot; বাটনে ক্লিক করে প্রথম বিক্রয় করুন।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">চালান নং</th>
                  <th className="py-3 px-4">কাস্টমার</th>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4 text-right">মোট বিল</th>
                  <th className="py-3 px-4 text-right">পরিশোধ</th>
                  <th className="py-3 px-4 text-right">বাকি</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale: any) => (
                  <tr key={sale._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-emerald-800">
                      <Link href={`/sales`} className="hover:underline">
                        {sale.saleNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{sale.customerName || 'ক্যাশ কাস্টমার'}</span>
                      {sale.customerPhone && (
                        <span className="block text-[11px] text-slate-400">{sale.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateBD(sale.createdAt, true)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatBDT(sale.grandTotal)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatBDT(sale.paidAmount)}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
