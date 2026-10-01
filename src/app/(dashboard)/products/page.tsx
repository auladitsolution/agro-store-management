'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  PlusCircle,
  Search,
  Barcode,
  Edit,
  Trash2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { IProduct, ICategory, IUnit } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [units, setUnits] = useState<IUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [formData, setFormData] = useState({
    productCode: '',
    barcode: '',
    nameBn: '',
    nameEn: '',
    category: '',
    brand: '',
    unit: 'kg',
    packSize: '',
    defaultPurchasePrice: 0,
    defaultSalePrice: 0,
    wholesalePrice: 0,
    minimumStock: 5,
    openingStock: 0,
    trackBatch: true,
    trackExpiry: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      let url = '/api/products?limit=200';
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (stockFilter === 'low') url += '&lowStock=true';
      if (stockFilter === 'out') url += '&outOfStock=true';

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndUnits = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/units'),
      ]);
      if (catRes.ok) {
        const catJson = await catRes.json();
        setCategories(catJson.data || []);
      }
      if (unitRes.ok) {
        const unitJson = await unitRes.json();
        setUnits(unitJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching meta:', err);
    }
  };

  useEffect(() => {
    fetchCategoriesAndUnits();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      productCode: `PRD-${Date.now().toString().slice(-4)}`,
      barcode: '',
      nameBn: '',
      nameEn: '',
      category: categories[0]?._id || '',
      brand: '',
      unit: 'kg',
      packSize: '',
      defaultPurchasePrice: 0,
      defaultSalePrice: 0,
      wholesalePrice: 0,
      minimumStock: 5,
      openingStock: 0,
      trackBatch: true,
      trackExpiry: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: IProduct) => {
    setEditingProduct(p);
    const catId = typeof p.category === 'object' ? (p.category as any)._id : p.category;
    setFormData({
      productCode: p.productCode,
      barcode: p.barcode || '',
      nameBn: p.nameBn,
      nameEn: p.nameEn,
      category: catId || '',
      brand: p.brand || '',
      unit: p.unit,
      packSize: p.packSize || '',
      defaultPurchasePrice: p.defaultPurchasePrice,
      defaultSalePrice: p.defaultSalePrice,
      wholesalePrice: p.wholesalePrice || 0,
      minimumStock: p.minimumStock,
      openingStock: 0,
      trackBatch: p.trackBatch,
      trackExpiry: p.trackExpiry,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameBn || !formData.category) {
      toast.error('বাংলা নাম এবং ক্যাটাগরি আবশ্যক');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(editingProduct ? 'পণ্য হালনাগাদ হয়েছে' : 'নতুন পণ্য যুক্ত হয়েছে');
        setIsModalOpen(false);
        fetchProducts();
      } else {
        toast.error(json.message || 'সংরক্ষণে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ ব্যর্থ');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.nameBn.toLowerCase().includes(term) ||
      p.nameEn.toLowerCase().includes(term) ||
      p.productCode.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            পণ্য তালিকা ও মূল্য তালিকা (Product Catalog)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            সকল বীজ, সার, বালাইনাশক ও যন্ত্রপাতির কোড, স্টক এবং খুচরা/পাইকারি রেট
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/export?type=products" download className="no-print">
            <Button size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1" />
              এক্সপোর্ট (CSV)
            </Button>
          </a>
          <Button size="sm" onClick={handleOpenAdd} className="bg-emerald-700 hover:bg-emerald-800">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            নতুন পণ্য যোগ করুন
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পণ্য কোড, নাম বা বারকোড খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="">সকল ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nameBn}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                stockFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              সব পণ্য
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                stockFilter === 'low' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              কম স্টক
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                stockFilter === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              শূন্য স্টক
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">পণ্য লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">কোনো পণ্য পাওয়া যায়নি</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">পণ্য কোড</th>
                  <th className="py-3 px-4">পণ্যের নাম (বাংলা ও ইংরেজি)</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4 text-center">বর্তমান স্টক</th>
                  <th className="py-3 px-4 text-right">ক্রয়মূল্য</th>
                  <th className="py-3 px-4 text-right">খুচরা বিক্রয়</th>
                  <th className="py-3 px-4 text-right">পাইকারি বিক্রয়</th>
                  <th className="py-3 px-4 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isLow = (p.currentStock || 0) <= (p.minimumStock || 0);
                  const isOut = (p.currentStock || 0) <= 0;
                  const catName = typeof p.category === 'object' ? (p.category as any)?.nameBn : '-';

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700">{p.productCode}</span>
                        {p.barcode && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {p.barcode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{p.nameBn}</div>
                        <div className="text-[11px] text-slate-400">
                          {p.nameEn} {p.packSize ? `(${p.packSize})` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{catName}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                          {p.currentStock} {p.unit}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatBDT(p.defaultPurchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800">
                        {formatBDT(p.defaultSalePrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {p.wholesalePrice ? formatBDT(p.wholesalePrice) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'পণ্য তথ্য পরিবর্তন' : 'নতুন পণ্য যোগ করুন'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="পণ্য কোড *"
              value={formData.productCode}
              onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
              required
            />
            <Input
              label="বারকোড (ঐচ্ছিক)"
              placeholder="স্ক্যানার দিয়ে বারকোড স্ক্যান করুন"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="পণ্যের নাম (বাংলা) *"
              placeholder="যেমন: ইউরিয়া সার"
              value={formData.nameBn}
              onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
              required
            />
            <Input
              label="পণ্যের নাম (ইংরেজি) *"
              placeholder="যেমন: Urea Fertilizer"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">নির্বাচন করুন</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ইউনিট *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
              >
                {units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.nameBn} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="প্যাক সাইজ (ঐচ্ছিক)"
              placeholder="যেমন: ৫০ কেজি বস্তা"
              value={formData.packSize}
              onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="number"
              label="ডিফল্ট ক্রয়মূল্য *"
              value={formData.defaultPurchasePrice || ''}
              onChange={(e) =>
                setFormData({ ...formData, defaultPurchasePrice: Number(e.target.value) || 0 })
              }
              required
            />
            <Input
              type="number"
              label="খুচরা বিক্রয়মূল্য *"
              value={formData.defaultSalePrice || ''}
              onChange={(e) =>
                setFormData({ ...formData, defaultSalePrice: Number(e.target.value) || 0 })
              }
              required
            />
            <Input
              type="number"
              label="পাইকারি বিক্রয়মূল্য"
              value={formData.wholesalePrice || ''}
              onChange={(e) =>
                setFormData({ ...formData, wholesalePrice: Number(e.target.value) || 0 })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              label="কম স্টক সতর্কতা সীমা (Minimum Stock)"
              value={formData.minimumStock}
              onChange={(e) =>
                setFormData({ ...formData, minimumStock: Number(e.target.value) || 0 })
              }
            />
            {!editingProduct && (
              <Input
                type="number"
                label="প্রারম্ভিক স্টক (Opening Stock)"
                value={formData.openingStock || ''}
                onChange={(e) =>
                  setFormData({ ...formData, openingStock: Number(e.target.value) || 0 })
                }
              />
            )}
          </div>

          <div className="flex items-center gap-4 text-xs pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.trackBatch}
                onChange={(e) => setFormData({ ...formData, trackBatch: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>ব্যাচ ট্র্যাকিং চালু রাখুন</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.trackExpiry}
                onChange={(e) => setFormData({ ...formData, trackExpiry: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>মেয়াদ (Expiry) ট্র্যাকিং চালু রাখুন</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {editingProduct ? 'হালনাগাদ সংরক্ষণ করুন' : 'পণ্য তৈরি করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
