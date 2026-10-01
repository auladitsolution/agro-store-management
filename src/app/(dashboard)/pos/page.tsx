'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Barcode,
  Layers,
  ArrowRight,
  UserPlus,
  Package,
} from 'lucide-react';
import { IProduct, ICustomer, IBatch, ISale } from '@/types';
import { formatBDT, addMoney, subtractMoney, multiplyMoney } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ReceiptTemplate } from '@/components/receipt/ReceiptTemplate';
import { toast } from 'sonner';

interface CartItem {
  product: IProduct;
  batch?: IBatch;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [saleType, setSaleType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [additionalDiscount, setAdditionalDiscount] = useState<number>(0);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [bkashAmount, setBkashAmount] = useState<string>('');
  const [bankAmount, setBankAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed Sale & Receipt
  const [completedSale, setCompletedSale] = useState<ISale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // New Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Barcode Scanner Listener buffer
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  const fetchData = async () => {
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        fetch('/api/products?limit=200'),
        fetch('/api/categories'),
        fetch('/api/customers'),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.data || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.data || []);
      }
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.data || []);
      }
    } catch (err) {
      console.error('Error loading POS data:', err);
      toast.error('পিওএস তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Barcode scanner hardware listener (standard USB / Bluetooth scanner emulation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is actively typing in a standard text input, do not intercept as barcode
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime.current > 100) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        const scannedCode = barcodeBuffer.current.trim();
        barcodeBuffer.current = '';
        if (scannedCode) {
          handleBarcodeScan(scannedCode);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, saleType]);

  const handleBarcodeScan = (code: string) => {
    const matched = products.find(
      (p) => p.barcode === code || p.productCode.toUpperCase() === code.toUpperCase()
    );
    if (matched) {
      addToCart(matched);
      toast.success(`বারকোড স্ক্যান: ${matched.nameBn} যোগ হয়েছে`);
    } else {
      toast.error(`বারকোড "${code}" পাওয়া যায়নি`);
    }
  };

  const addToCart = (product: IProduct) => {
    if ((product.currentStock || 0) <= 0) {
      toast.error(`"${product.nameBn}" পণ্যের স্টক শূন্য!`);
      return;
    }

    const price =
      saleType === 'WHOLESALE' && product.wholesalePrice && product.wholesalePrice > 0
        ? product.wholesalePrice
        : product.defaultSalePrice;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product._id === product._id);
      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        if (existing.quantity + 1 > product.currentStock) {
          toast.error(`স্টকে আর পর্যাপ্ত পণ্য নেই (${product.currentStock} বিদ্যমান)`);
          return prev;
        }
        const updated = [...prev];
        const newQty = existing.quantity + 1;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          total: subtractMoney(multiplyMoney(existing.unitPrice, newQty), existing.discount),
        };
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: price,
          costPrice: product.defaultPurchasePrice || 0,
          discount: 0,
          total: price,
        },
      ];
    });
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.product.currentStock) {
      toast.error(`স্টকে আর পর্যাপ্ত পণ্য নেই (বর্তমান স্টক: ${item.product.currentStock})`);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...item,
        quantity: newQty,
        total: subtractMoney(multiplyMoney(item.unitPrice, newQty), item.discount),
      };
      return updated;
    });
  };

  const updateCartPrice = (index: number, newPrice: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        unitPrice: newPrice,
        total: subtractMoney(multiplyMoney(newPrice, item.quantity), item.discount),
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAdditionalDiscount(0);
  };

  // Totals
  const subtotal = cart.reduce((sum, item) => addMoney(sum, item.total), 0);
  const grandTotal = Math.max(0, subtractMoney(subtotal, additionalDiscount));

  // Payment Breakdown Calculations
  const numCash = Number(cashAmount) || 0;
  const numBkash = Number(bkashAmount) || 0;
  const numBank = Number(bankAmount) || 0;
  const totalPaid = addMoney(numCash, numBkash, numBank);
  const dueAmount = totalPaid < grandTotal ? subtractMoney(grandTotal, totalPaid) : 0;
  const changeAmount = totalPaid > grandTotal ? subtractMoney(totalPaid, grandTotal) : 0;

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) {
      toast.error('অনুগ্রহ করে কার্টে পণ্য যোগ করুন');
      return;
    }
    // Default cash to grand total for 1-click cash checkout
    setCashAmount(grandTotal.toString());
    setBkashAmount('');
    setBankAmount('');
    setIsPaymentModalOpen(true);
  };

  const handleCompleteSale = async () => {
    if (dueAmount > 0 && !selectedCustomer) {
      toast.error('বাকি বিক্রয়ের ক্ষেত্রে কাস্টমার নির্বাচন করা আবশ্যক!');
      return;
    }

    if (
      selectedCustomer &&
      dueAmount > 0 &&
      selectedCustomer.creditLimit > 0 &&
      selectedCustomer.currentBalance + dueAmount > selectedCustomer.creditLimit &&
      !overrideReason
    ) {
      toast.error('কাস্টমারের ক্রেডিট লিমিট অতিক্রম করেছে। অতিরিক্ত বাকি অনুমোদনের কারণ লিখুন।');
      return;
    }

    setIsSubmitting(true);

    const paymentMethods: any[] = [];
    if (numCash > 0) paymentMethods.push({ method: 'CASH', amount: numCash });
    if (numBkash > 0) paymentMethods.push({ method: 'BKASH', amount: numBkash });
    if (numBank > 0) paymentMethods.push({ method: 'BANK', amount: numBank });

    const payload = {
      customer: selectedCustomer?._id,
      customerName: selectedCustomer?.name || 'ক্যাশ কাস্টমার',
      customerPhone: selectedCustomer?.phone,
      saleType,
      items: cart.map((item) => ({
        product: item.product._id,
        productNameBn: item.product.nameBn,
        productCode: item.product.productCode,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        discount: item.discount,
        total: item.total,
      })),
      subtotal,
      discount: 0,
      additionalDiscount,
      grandTotal,
      paidAmount: totalPaid > grandTotal ? grandTotal : totalPaid,
      paymentMethods: paymentMethods.length > 0 ? paymentMethods : [{ method: 'CASH', amount: grandTotal }],
      notes: paymentNote,
      overrideReason: overrideReason || undefined,
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'বিক্রয় ব্যর্থ হয়েছে');
        return;
      }

      toast.success('বিক্রয় সফলভাবে সম্পন্ন হয়েছে!');
      setCompletedSale(json.data);
      setIsPaymentModalOpen(false);
      setIsReceiptOpen(true);
      clearCart();
      fetchData(); // Refresh product stock
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      toast.error('নাম এবং ফোন নম্বর দিন');
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerCode: `C-${newCustPhone.slice(-4)}-${Date.now().toString().slice(-3)}`,
          name: newCustName,
          phone: newCustPhone,
          village: newCustAddress,
          openingBalance: 0,
          creditLimit: 10000,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('নতুন কাস্টমার তৈরি হয়েছে');
        setSelectedCustomer(json.data);
        setIsNewCustomerModalOpen(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustAddress('');
        fetchData();
      } else {
        toast.error(json.message || 'কাস্টমার যোগ ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));

    const matchesCategory =
      !selectedCategory ||
      (typeof p.category === 'object' && (p.category as any)?._id === selectedCategory) ||
      p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4">
      {/* LEFT SECTION: Products Browser */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Top Controls: Search, Retail/Wholesale, Category Filter */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="পণ্য কোড, নাম বা বারকোড খুঁজুন... (Alt+S)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Retail vs Wholesale Switch */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSaleType('RETAIL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  saleType === 'RETAIL'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                খুচরা বিক্রয়
              </button>
              <button
                type="button"
                onClick={() => setSaleType('WHOLESALE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  saleType === 'WHOLESALE'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                পাইকারি বিক্রয়
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedCategory === ''
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              সবগুলো
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c._id
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c.nameBn}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              কোনো পণ্য পাওয়া যায়নি
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const price =
                  saleType === 'WHOLESALE' && p.wholesalePrice && p.wholesalePrice > 0
                    ? p.wholesalePrice
                    : p.defaultSalePrice;
                const isOutOfStock = (p.currentStock || 0) <= 0;

                return (
                  <button
                    key={p._id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`flex flex-col justify-between text-left p-3 rounded-xl border transition-all text-xs ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200/90 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-mono">{p.productCode}</span>
                        {p.barcode && <Barcode className="w-3.5 h-3.5" />}
                      </div>
                      <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight">
                        {p.nameBn}
                      </h4>
                      {p.packSize && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.packSize}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="font-bold text-sm text-emerald-800">
                        {formatBDT(price)}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          isOutOfStock
                            ? 'text-rose-600 font-bold'
                            : p.currentStock <= p.minimumStock
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        স্টক: {p.currentStock} {p.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart, Customer & Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Customer Selector */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              কাস্টমার নির্বাচন
            </span>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="text-xs text-emerald-700 hover:underline flex items-center gap-0.5"
            >
              <UserPlus className="w-3 h-3" />
              নতুন কাস্টমার
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCustomer?._id || ''}
              onChange={(e) => {
                const found = customers.find((c) => c._id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="flex-1 text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">ক্যাশ কাস্টমার (সাধারণ)</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone}) - বাকি: {formatBDT(c.currentBalance)}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-1"
                title="ক্যাশ কাস্টমারে ফিরুন"
              >
                ✕
              </button>
            )}
          </div>

          {selectedCustomer && (
            <div className="mt-2 text-[11px] p-2 bg-amber-50 rounded-lg border border-amber-200 flex justify-between">
              <span>পূর্বের বকেয়া: <b>{formatBDT(selectedCustomer.currentBalance)}</b></span>
              <span>ক্রেডিট লিমিট: <b>{formatBDT(selectedCustomer.creditLimit)}</b></span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
              কার্ট খালি রয়েছে। বাঁদিকের তালিকা থেকে পণ্য যোগ করুন।
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="font-semibold text-slate-800 line-clamp-1">
                    {item.product.nameBn}
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-slate-200 rounded-md bg-white">
                    <button
                      onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(idx, Number(e.target.value))}
                      className="w-10 text-center font-bold focus:outline-none text-xs"
                    />
                    <button
                      onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Rate x Qty = Total */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 mr-2">
                      @
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateCartPrice(idx, Number(e.target.value))}
                        className="w-14 text-right inline border-b border-dashed border-slate-300 focus:outline-none font-medium ml-1"
                      />
                    </span>
                    <span className="font-bold text-slate-800">{formatBDT(item.total)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Complete Checkout Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>উপমোট (Subtotal):</span>
            <span>{formatBDT(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>বিশেষ ছাড় (Discount):</span>
            <input
              type="number"
              placeholder="০"
              value={additionalDiscount || ''}
              onChange={(e) => setAdditionalDiscount(Number(e.target.value) || 0)}
              className="w-20 px-2 py-0.5 text-right text-xs bg-white border border-slate-200 rounded-md"
            />
          </div>

          <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline font-bold text-sm text-slate-900">
            <span>সর্বমোট বিল (Grand Total):</span>
            <span className="text-base text-emerald-800">{formatBDT(grandTotal)}</span>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="px-2.5 text-slate-500 hover:text-rose-600"
            >
              মুছে ফেলুন
            </Button>
            <Button
              size="md"
              onClick={handleOpenPaymentModal}
              disabled={cart.length === 0}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              পেমেন্ট ও বিক্রয় সম্পন্ন করুন
            </Button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL (Supports Mixed Payments, Due, and Cash Change) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="পেমেন্ট ও বিক্রয় নিশ্চিতকরণ"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-sm">
            <span>সর্বমোট বিল:</span>
            <span className="font-bold text-lg text-emerald-800">{formatBDT(grandTotal)}</span>
          </div>

          {/* Payment Method Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নগদ টাকা (Cash)
                </label>
                <Input
                  type="number"
                  placeholder="০"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিকাশ (bKash)
                </label>
                <Input
                  type="number"
                  placeholder="০"
                  value={bkashAmount}
                  onChange={(e) => setBkashAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্যাংক / কার্ড (Bank)
                </label>
                <Input
                  type="number"
                  placeholder="০"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Change or Due Display */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>মোট প্রাপ্ত টাকা:</span>
                <span className="font-bold text-slate-800">{formatBDT(totalPaid)}</span>
              </div>

              {changeAmount > 0 && (
                <div className="flex justify-between text-blue-700 font-bold text-sm">
                  <span>গ্রাহককে ফেরত দিন (Change):</span>
                  <span>{formatBDT(changeAmount)}</span>
                </div>
              )}

              {dueAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold text-sm">
                  <span>বাকি থাকবে (Due):</span>
                  <span>{formatBDT(dueAmount)}</span>
                </div>
              )}
            </div>

            {/* Credit limit warning if applicable */}
            {selectedCustomer && dueAmount > 0 && selectedCustomer.creditLimit > 0 && (
              selectedCustomer.currentBalance + dueAmount > selectedCustomer.creditLimit && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    কাস্টমারের নির্ধারিত বাকি সীমা (৳ {selectedCustomer.creditLimit}) অতিক্রম করবে!
                  </p>
                  <input
                    type="text"
                    placeholder="অতিরিক্ত বাকি অনুমোদনের কারণ লিখুন..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-rose-300 rounded bg-white mt-1"
                  />
                </div>
              )
            )}

            <div>
              <label className="block text-xs text-slate-500 mb-1">নোট / মন্তব্য (ঐচ্ছিক)</label>
              <Input
                type="text"
                placeholder="চালান সংক্রান্ত মন্তব্য..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              বাতিল
            </Button>
            <Button
              size="md"
              onClick={handleCompleteSale}
              isLoading={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 font-bold"
            >
              বিক্রয় সম্পন্ন ও রসিদ তৈরি করুন
            </Button>
          </div>
        </div>
      </Modal>

      {/* QUICK NEW CUSTOMER MODAL */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="নতুন কাস্টমার যোগ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <Input
            label="কাস্টমারের নাম *"
            placeholder="যেমন: মোঃ আবুল হোসেন"
            value={newCustName}
            onChange={(e) => setNewCustName(e.target.value)}
            required
          />
          <Input
            label="মোবাইল নম্বর *"
            placeholder="017xxxxxxxx"
            value={newCustPhone}
            onChange={(e) => setNewCustPhone(e.target.value)}
            required
          />
          <Input
            label="ঠিকানা / গ্রাম (ঐচ্ছিক)"
            placeholder="গ্রাম, ইউনিয়ন বা উপজেলা"
            value={newCustAddress}
            onChange={(e) => setNewCustAddress(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCustomerModalOpen(false)}>
              বাতিল
            </Button>
            <Button type="submit" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECEIPT PRINT MODAL */}
      {completedSale && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title="বিক্রয় সফল হয়েছে! রসিদ প্রিন্ট করুন"
          maxWidth="lg"
        >
          <ReceiptTemplate
            sale={completedSale}
            onClose={() => setIsReceiptOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
