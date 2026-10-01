'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, CheckCircle, Truck, Package } from 'lucide-react';
import { ISupplier, IProduct } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatBDT, addMoney, subtractMoney, multiplyMoney } from '@/lib/utils/money';
import { toast } from 'sonner';

interface PurchaseFormItem {
  product: string;
  productNameBn: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  unitConversionFactor: number;
  purchasePrice: number;
  salePrice: number;
  total: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseFormItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          fetch('/api/suppliers'),
          fetch('/api/products?limit=200'),
        ]);

        if (supRes.ok) {
          const supData = await supRes.json();
          setSuppliers(supData.data || []);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.data || []);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('তথ্য লোড ব্যর্থ হয়েছে');
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];

    const newItem: PurchaseFormItem = {
      product: defaultProduct._id,
      productNameBn: defaultProduct.nameBn,
      batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      quantity: 10,
      unit: defaultProduct.unit,
      unitConversionFactor: 1,
      purchasePrice: defaultProduct.defaultPurchasePrice || 100,
      salePrice: defaultProduct.defaultSalePrice || 120,
      total: multiplyMoney(defaultProduct.defaultPurchasePrice || 100, 10),
    };

    setItems([...items, newItem]);
  };

  const handleItemChange = (index: number, field: keyof PurchaseFormItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'product') {
      const selected = products.find((p) => p._id === value);
      if (selected) {
        current.productNameBn = selected.nameBn;
        current.unit = selected.unit;
        current.purchasePrice = selected.defaultPurchasePrice;
        current.salePrice = selected.defaultSalePrice;
      }
    }

    if (field === 'quantity' || field === 'purchasePrice' || field === 'product') {
      current.total = multiplyMoney(Number(current.purchasePrice) || 0, Number(current.quantity) || 0);
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => addMoney(sum, item.total), 0);
  const grandTotal = Math.max(
    0,
    addMoney(subtractMoney(subtotal, discount), transportCost, otherCost)
  );
  const dueAmount = subtractMoney(grandTotal, paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('অনুগ্রহ করে একজন সাপ্লায়ার নির্বাচন করুন');
      return;
    }
    if (items.length === 0) {
      toast.error('কমপক্ষে একটি পণ্য চালানে যোগ করুন');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier: supplierId,
        invoiceNumber,
        purchaseDate,
        items: items.map((item) => ({
          product: item.product,
          productNameBn: item.productNameBn,
          batchNumber: item.batchNumber,
          manufacturingDate: item.manufacturingDate || undefined,
          expiryDate: item.expiryDate || undefined,
          quantity: item.quantity,
          unit: item.unit,
          unitConversionFactor: item.unitConversionFactor || 1,
          purchasePrice: item.purchasePrice,
          salePrice: item.salePrice,
        })),
        subtotal,
        discount,
        transportCost,
        otherCost,
        grandTotal,
        paidAmount,
        paymentMethod,
        notes,
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('ক্রয় চালান সফলভাবে সংরক্ষিত এবং স্টক আপডেট হয়েছে!');
        router.push('/purchases');
      } else {
        toast.error(json.message || 'ক্রয় চালান সংরক্ষণ ব্যর্থ');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ ব্যর্থ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            ফিরে যান
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">নতুন ক্রয় চালান (New Purchase)</h1>
            <p className="text-xs text-slate-500">ব্যাচ ও মেয়াদসহ মালামাল গ্রহণ এবং স্টক আপডেট</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Info Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সাপ্লায়ার / কোম্পানি *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">সাপ্লায়ার নির্বাচন করুন</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.company} ({s.name}) - বকেয়া: {formatBDT(s.currentBalance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              চালান / বিল নম্বর (Invoice No)
            </label>
            <Input
              type="text"
              placeholder="যেমন: INV-ACI-9902"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্রয়ের তারিখ *
            </label>
            <Input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Purchase Items Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              পণ্যের তালিকা ও ব্যাচ বিবরণ
            </h3>
            <Button type="button" size="sm" onClick={handleAddItem}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              পণ্য যোগ করুন
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              এখনও কোনো পণ্য যোগ করা হয়নি। উপরে &quot;পণ্য যোগ করুন&quot; বাটনে ক্লিক করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">পণ্য</th>
                    <th className="py-2.5 px-3 min-w-[120px]">ব্যাচ নং</th>
                    <th className="py-2.5 px-3 min-w-[130px]">মেয়াদ শেষ তারিখ</th>
                    <th className="py-2.5 px-3 w-24">পরিমাণ</th>
                    <th className="py-2.5 px-3 w-28">ক্রয় দর</th>
                    <th className="py-2.5 px-3 w-28">বিক্রয় দর</th>
                    <th className="py-2.5 px-3 text-right w-28">মোট টাকা</th>
                    <th className="py-2.5 px-3 text-center w-12">মুছুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <select
                          value={item.product}
                          onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                        >
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.nameBn} ({p.unit})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                          placeholder="ব্যাচ নম্বর"
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-mono uppercase"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', Number(e.target.value) || 0)
                          }
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded text-center font-bold"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={item.purchasePrice}
                          onChange={(e) =>
                            handleItemChange(idx, 'purchasePrice', Number(e.target.value) || 0)
                          }
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded text-right font-medium"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={item.salePrice}
                          onChange={(e) =>
                            handleItemChange(idx, 'salePrice', Number(e.target.value) || 0)
                          }
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded text-right font-medium"
                        />
                      </td>

                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        {formatBDT(item.total)}
                      </td>

                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Financial Summary & Payment Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800">অতিরিক্ত খরচ ও নোট</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">পরিবহন খরচ (Transport)</label>
                <Input
                  type="number"
                  placeholder="০"
                  value={transportCost || ''}
                  onChange={(e) => setTransportCost(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">অন্যান্য খরচ (Other)</label>
                <Input
                  type="number"
                  placeholder="০"
                  value={otherCost || ''}
                  onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">চালান সংক্রান্ত মন্তব্য / নোট</label>
              <Input
                type="text"
                placeholder="যেমন: ট্রাক নং, ডেলিভারিম্যানের নাম..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>পণ্যের মোট ক্রয়মূল্য (Subtotal):</span>
              <span className="font-bold">{formatBDT(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>কোম্পানি ছাড় (Discount):</span>
              <input
                type="number"
                placeholder="০"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded"
              />
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline font-bold text-sm text-slate-900">
              <span>সর্বমোট বিল (Grand Total):</span>
              <span className="text-base text-emerald-800">{formatBDT(grandTotal)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">নগদ প্রদান (Paid):</span>
                <input
                  type="number"
                  placeholder="০"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  className="w-28 px-2 py-1 text-right text-xs font-bold text-emerald-800 bg-white border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-between text-rose-700 font-bold text-sm pt-1">
                <span>সাপ্লায়ার বকেয়া বাকি (Due):</span>
                <span>{formatBDT(dueAmount)}</span>
              </div>
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                isLoading={submitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 py-2.5 font-bold text-sm shadow-md"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                ক্রয় চালান সংরক্ষণ ও স্টক বৃদ্ধি করুন
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
