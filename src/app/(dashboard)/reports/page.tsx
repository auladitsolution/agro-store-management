'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  Download,
  Users,
  Building2,
  Calendar,
} from 'lucide-react';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'valuation' | 'expiry' | 'dues'>('profit');

  // Profit Data
  const [profitData, setProfitData] = useState<any>(null);
  const [profitLoading, setProfitLoading] = useState(false);

  // Valuation Data
  const [valuationData, setValuationData] = useState<any>(null);
  const [valuationLoading, setValuationLoading] = useState(false);

  // Expiry Data
  const [expiryBatches, setExpiryBatches] = useState<any[]>([]);
  const [expiryFilter, setExpiryFilter] = useState('60');
  const [expiryLoading, setExpiryLoading] = useState(false);

  // Dues Data
  const [customerDues, setCustomerDues] = useState<any[]>([]);
  const [supplierDues, setSupplierDues] = useState<any[]>([]);
  const [duesLoading, setDuesLoading] = useState(false);

  const fetchProfit = async () => {
    setProfitLoading(true);
    try {
      const res = await fetch('/api/reports/profit');
      if (res.ok) {
        const json = await res.json();
        setProfitData(json.data);
      }
    } catch (err) {
      console.error('Profit fetch error:', err);
    } finally {
      setProfitLoading(false);
    }
  };

  const fetchValuation = async () => {
    setValuationLoading(true);
    try {
      const res = await fetch('/api/inventory/valuation');
      if (res.ok) {
        const json = await res.json();
        setValuationData(json);
      }
    } catch (err) {
      console.error('Valuation fetch error:', err);
    } finally {
      setValuationLoading(false);
    }
  };

  const fetchExpiry = async () => {
    setExpiryLoading(true);
    try {
      const res = await fetch(`/api/reports/expiry?filter=${expiryFilter}`);
      if (res.ok) {
        const json = await res.json();
        setExpiryBatches(json.data || []);
      }
    } catch (err) {
      console.error('Expiry fetch error:', err);
    } finally {
      setExpiryLoading(false);
    }
  };

  const fetchDues = async () => {
    setDuesLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/customers?hasDue=true'),
        fetch('/api/suppliers'),
      ]);
      if (cRes.ok) {
        const cJson = await cRes.json();
        setCustomerDues(cJson.data || []);
      }
      if (sRes.ok) {
        const sJson = await sRes.json();
        setSupplierDues((sJson.data || []).filter((s: any) => s.currentBalance > 0));
      }
    } catch (err) {
      console.error('Dues fetch error:', err);
    } finally {
      setDuesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profit') fetchProfit();
    if (activeTab === 'valuation') fetchValuation();
    if (activeTab === 'expiry') fetchExpiry();
    if (activeTab === 'dues') fetchDues();
  }, [activeTab, expiryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            রিপোর্ট ও বাণিজ্যিক পরিসংখ্যান (Reports & Analytics)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            সঠিক ব্যাচ ক্রয়মূল্য ভিত্তিক লাভ-ক্ষতি, স্টক মূল্যায়ন, মেয়াদ ও বকেয়ার অডিট
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()} className="no-print">
            রিপোর্ট প্রিন্ট করুন
          </Button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-xl text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('profit')}
          className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'profit' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          লাভ-ক্ষতি ও মার্জিন (Profit & Loss)
        </button>

        <button
          onClick={() => setActiveTab('valuation')}
          className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'valuation' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          স্টক মূল্যায়ন (Stock Valuation)
        </button>

        <button
          onClick={() => setActiveTab('expiry')}
          className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'expiry' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          মেয়াদোত্তীর্ণ ও অ্যালার্ট (Expiry Report)
        </button>

        <button
          onClick={() => setActiveTab('dues')}
          className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'dues' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          বাকি পাওনা ও দেনা রিপোর্ট
        </button>
      </div>

      {/* TAB 1: PROFIT & LOSS */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          {profitLoading ? (
            <div className="p-12 text-center text-slate-400">লাভের হিসাব বিশ্লেষণ করা হচ্ছে...</div>
          ) : profitData ? (
            <>
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">মোট বিক্রয় রাজস্ব (Sales Revenue)</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">
                    {formatBDT(profitData.totalRevenue)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">মোট {profitData.salesCount} টি বিক্রয় চালান</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">বিক্রিত পণ্যের আসল ক্রয় খরচ (COGS)</p>
                  <h3 className="text-2xl font-bold text-slate-700 mt-2">
                    {formatBDT(profitData.totalCogs)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">সংশ্লিষ্ট ব্যাচের ক্রয়মূল্য অনুযায়ী</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">স্থূল লাভ (Gross Profit)</p>
                  <h3 className="text-2xl font-bold text-teal-700 mt-2">
                    {formatBDT(profitData.grossProfit)}
                  </h3>
                  <p className="text-[11px] text-teal-600 mt-1">বিক্রয় রাজস্ব − পণ্যের ক্রয়মূল্য</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">আনুমানিক নিট লাভ (Net Profit)</p>
                  <h3 className="text-2xl font-bold text-emerald-800 mt-2">
                    {formatBDT(profitData.netProfit)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    দোকানের খরচ বাদ দিয়ে ({formatBDT(profitData.totalExpenses)})
                  </p>
                </div>
              </div>

              {profitData.warningMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{profitData.warningMessage}</span>
                </div>
              )}

              {/* Profit Breakdown Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-800">বাণিজ্যিক লাভ-ক্ষতি বিবরণী (Income Statement)</h3>
                <div className="divide-y divide-slate-100 text-sm">
                  <div className="py-2.5 flex justify-between font-semibold text-slate-800">
                    <span>১. মোট বিক্রয় রাজস্ব (Sales Revenue):</span>
                    <span>{formatBDT(profitData.totalRevenue)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-slate-600 pl-4">
                    <span>বাদ: বিক্রিত পণ্যের প্রকৃত ব্যাচ খরচ (Cost of Goods Sold):</span>
                    <span>- {formatBDT(profitData.totalCogs)}</span>
                  </div>
                  <div className="py-3 flex justify-between font-bold text-teal-800 bg-teal-50/50 px-3 rounded-lg">
                    <span>২. সর্বমোট স্থূল মুনাফা (Gross Profit):</span>
                    <span>{formatBDT(profitData.grossProfit)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-slate-600 pl-4">
                    <span>বাদ: দোকান পরিচালনা ও আনুষঙ্গিক খরচ (Operating Expenses):</span>
                    <span>- {formatBDT(profitData.totalExpenses)}</span>
                  </div>
                  <div className="py-3 flex justify-between font-bold text-emerald-900 bg-emerald-100/70 px-3 rounded-lg text-base">
                    <span>৩. চূড়ান্ত নিট বাণিজ্যিক মুনাফা (Estimated Net Profit):</span>
                    <span>{formatBDT(profitData.netProfit)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 2: STOCK VALUATION */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {valuationLoading ? (
            <div className="p-12 text-center text-slate-400">স্টক মূল্যায়ন লোড হচ্ছে...</div>
          ) : valuationData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">মোট বর্তমান স্টক ক্রয়মূল্য (Cost Value)</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">
                    {formatBDT(valuationData.summary?.totalCostValuation || 0)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">প্রকৃত ইনভেন্টরি মূলধন</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">সম্ভাব্য বিক্রয়মূল্য (Potential Retail Value)</p>
                  <h3 className="text-2xl font-bold text-emerald-700 mt-2">
                    {formatBDT(valuationData.summary?.totalRetailValuation || 0)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">খুচরা বিক্রয় মূল্যে রূপান্তর করলে</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">সম্ভাব্য মোট স্থূল লাভ (Potential Margin)</p>
                  <h3 className="text-2xl font-bold text-teal-800 mt-2">
                    {formatBDT(valuationData.summary?.potentialProfit || 0)}
                  </h3>
                  <p className="text-[11px] text-teal-600 mt-1">সব মাল বিক্রয় সমাপ্তে প্রত্যাশিত লাভ</p>
                </div>
              </div>

              {/* Products Valuation Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800">পণ্যভিত্তিক স্টক মূল্যের তালিকা</h3>
                  <a href="/api/export?type=products" download>
                    <Button size="sm" variant="outline">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      এক্সপোর্ট
                    </Button>
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs lg:text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">পণ্য কোড</th>
                        <th className="py-2.5 px-4">পণ্যের নাম</th>
                        <th className="py-2.5 px-4 text-center">বর্তমান স্টক</th>
                        <th className="py-2.5 px-4 text-right">গড় ক্রয় দর</th>
                        <th className="py-2.5 px-4 text-right">বিক্রয় দর</th>
                        <th className="py-2.5 px-4 text-right">মোট স্টক ক্রয়মূল্য</th>
                        <th className="py-2.5 px-4 text-right">সম্ভাব্য বিক্রয়মূল্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(valuationData.data || []).map((p: any) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-600">{p.productCode}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{p.nameBn}</td>
                          <td className="py-2.5 px-4 text-center font-bold">
                            {p.currentStock} {p.unit}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600">
                            {formatBDT(p.defaultPurchasePrice)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-emerald-800 font-medium">
                            {formatBDT(p.defaultSalePrice)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            {formatBDT(p.costValue)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                            {formatBDT(p.retailValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 3: EXPIRY REPORT */}
      {activeTab === 'expiry' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">মেয়াদ ফিল্টার:</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpiryFilter('30')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  expiryFilter === '30' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                আগামী ৩০ দিনে মেয়াদ শেষ
              </button>
              <button
                onClick={() => setExpiryFilter('60')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  expiryFilter === '60' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                আগামী ৬০ দিন
              </button>
              <button
                onClick={() => setExpiryFilter('90')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  expiryFilter === '90' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                আগামী ৯০ দিন
              </button>
              <button
                onClick={() => setExpiryFilter('expired')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  expiryFilter === 'expired' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                ইতিমধ্যে মেয়াদোত্তীর্ণ
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {expiryLoading ? (
              <div className="p-8 text-center text-slate-400">মেয়াদ রিপোর্ট লোড হচ্ছে...</div>
            ) : expiryBatches.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">এই ফিল্টারে কোনো ব্যাচ পাওয়া যায়নি</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs lg:text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">পণ্য</th>
                      <th className="py-2.5 px-4">ব্যাচ নং</th>
                      <th className="py-2.5 px-4">সাপ্লায়ার</th>
                      <th className="py-2.5 px-4 text-center">অবশিষ্ট স্টক</th>
                      <th className="py-2.5 px-4 text-right">ক্রয় দর</th>
                      <th className="py-2.5 px-4">মেয়াদ শেষ তারিখ</th>
                      <th className="py-2.5 px-4 text-center">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiryBatches.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {b.product?.nameBn || '-'}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{b.batchNumber}</td>
                        <td className="py-2.5 px-4 text-slate-600">{b.supplier?.company || b.supplier?.name || '-'}</td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          {b.remainingQuantity} {b.product?.unit || ''}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">{formatBDT(b.purchasePrice)}</td>
                        <td className="py-2.5 px-4 text-slate-600">{formatDateBD(b.expiryDate)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge variant={b.status === 'EXPIRED' ? 'danger' : 'warning'}>
                            {b.statusLabelBn}
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
      )}

      {/* TAB 4: DUES REPORT */}
      {activeTab === 'dues' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Dues */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                কাস্টমার বাকি পাওনা তালিকা
              </h3>
              <a href="/api/export?type=customers" download>
                <Button size="sm" variant="outline">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  এক্সপোর্ট
                </Button>
              </a>
            </div>

            {customerDues.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs">কারো কাছে বাকি পাওনা নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">কাস্টমার</th>
                      <th className="py-2.5 px-3">মোবাইল</th>
                      <th className="py-2.5 px-3 text-right">বাকি পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerDues.map((c) => (
                      <tr key={c._id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{c.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{c.phone}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {formatBDT(c.currentBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Supplier Dues */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-700" />
                সাপ্লায়ার কোম্পানির বাকি দেনা
              </h3>
              <a href="/api/export?type=suppliers" download>
                <Button size="sm" variant="outline">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  এক্সপোর্ট
                </Button>
              </a>
            </div>

            {supplierDues.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs">কোনো কোম্পানির কাছে দেনা নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">কোম্পানি</th>
                      <th className="py-2.5 px-3">প্রতিনিধি</th>
                      <th className="py-2.5 px-3 text-right">বকেয়া পাওনা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierDues.map((s) => (
                      <tr key={s._id}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{s.company}</td>
                        <td className="py-2.5 px-3 text-slate-500">{s.name} ({s.phone})</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {formatBDT(s.currentBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
