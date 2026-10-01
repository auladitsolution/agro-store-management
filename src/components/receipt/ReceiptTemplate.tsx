'use client';

import React from 'react';
import { ISale, IBusinessSettings } from '@/types';
import { formatBDT } from '@/lib/utils/money';
import { formatDateBD } from '@/lib/utils/date';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReceiptTemplateProps {
  sale: ISale;
  settings?: IBusinessSettings | null;
  customerPreviousDue?: number;
  format?: 'thermal58' | 'thermal80' | 'a4';
  onClose?: () => void;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  sale,
  settings,
  customerPreviousDue = 0,
  format = 'thermal80',
  onClose,
}) => {
  const shopName = settings?.businessNameBn || 'কৃষি বন্ধু এগ্রো স্টোর';
  const shopAddress = settings?.address || 'বাজার রোড, রংপুর, বাংলাদেশ';
  const shopPhone = settings?.phone || '০১৭০০০০০০০০';
  const footerText = settings?.receiptFooterBn || 'আমাদের সাথে থাকার জন্য ধন্যবাদ! সুস্থ ফসলে সমৃদ্ধ দেশ।';

  const handlePrint = () => {
    window.print();
  };

  const currentTotalDue = (customerPreviousDue || 0) + (sale.dueAmount || 0);

  const containerClass =
    format === 'thermal58'
      ? 'thermal-58mm max-w-[280px] text-xs'
      : format === 'thermal80'
      ? 'thermal-80mm max-w-[340px] text-sm'
      : 'format-a4 max-w-2xl text-base border p-8 bg-white';

  return (
    <div className="flex flex-col items-center">
      {/* Action buttons (hidden when printing) */}
      <div className="no-print flex items-center justify-between w-full max-w-md mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <span className="text-sm font-medium text-slate-700">রিসিপ্ট প্রিন্ট প্রিভিউ</span>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            প্রিন্ট করুন
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Printable receipt wrapper */}
      <div className={`print-area bg-white text-slate-900 mx-auto p-4 shadow-sm border border-slate-100 ${containerClass}`}>
        {/* Header */}
        <div className="text-center pb-3 border-b border-dashed border-slate-400 mb-3">
          <h2 className="font-bold text-lg leading-tight">{shopName}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{shopAddress}</p>
          <p className="text-xs text-slate-600">মোবাইল: {shopPhone}</p>
          <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-[10px] font-bold tracking-wider rounded">
            বিক্রয় রসিদ / ক্যাশ মেমো
          </div>
        </div>

        {/* Invoice Info */}
        <div className="text-xs space-y-1 pb-2 border-b border-dashed border-slate-300 mb-2">
          <div className="flex justify-between">
            <span className="text-slate-500">চালান নং:</span>
            <span className="font-semibold">{sale.saleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">তারিখ:</span>
            <span>{formatDateBD(sale.createdAt, true)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">কাস্টমার:</span>
            <span className="font-medium">{sale.customerName || 'ক্যাশ কাস্টমার'}</span>
          </div>
          {sale.customerPhone && (
            <div className="flex justify-between">
              <span className="text-slate-500">মোবাইল:</span>
              <span>{sale.customerPhone}</span>
            </div>
          )}
          {sale.salespersonName && (
            <div className="flex justify-between">
              <span className="text-slate-500">বিক্রয়কর্মী:</span>
              <span>{sale.salespersonName}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 pb-1">
                <th className="py-1">পণ্য</th>
                <th className="text-center py-1">পরিমাণ</th>
                <th className="text-right py-1">দর</th>
                <th className="text-right py-1">মোট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx} className="py-1">
                  <td className="py-1 pr-1">
                    <div className="font-medium">{item.productNameBn}</div>
                    {item.batchNumber && (
                      <div className="text-[10px] text-slate-500">ব্যাচ: {item.batchNumber}</div>
                    )}
                  </td>
                  <td className="text-center py-1 whitespace-nowrap">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="text-right py-1 whitespace-nowrap">{formatBDT(item.unitPrice, { showSymbol: false })}</td>
                  <td className="text-right py-1 whitespace-nowrap font-medium">{formatBDT(item.total, { showSymbol: false })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown */}
        <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1 mb-3">
          <div className="flex justify-between">
            <span>উপমোট (Subtotal):</span>
            <span>{formatBDT(sale.subtotal)}</span>
          </div>

          {(sale.discount > 0 || sale.additionalDiscount > 0) && (
            <div className="flex justify-between text-slate-600">
              <span>ছাড় (Discount):</span>
              <span>- {formatBDT(sale.discount + sale.additionalDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-1">
            <span>সর্বমোট বিল (Grand Total):</span>
            <span>{formatBDT(sale.grandTotal)}</span>
          </div>

          <div className="flex justify-between text-emerald-800 font-medium">
            <span>পরিশোধ (Paid):</span>
            <span>{formatBDT(sale.paidAmount)}</span>
          </div>

          {sale.changeAmount > 0 && (
            <div className="flex justify-between text-blue-700">
              <span>ফেরত (Change):</span>
              <span>{formatBDT(sale.changeAmount)}</span>
            </div>
          )}

          {sale.dueAmount > 0 && (
            <div className="flex justify-between text-rose-700 font-bold">
              <span>চালানের বাকি (Due):</span>
              <span>{formatBDT(sale.dueAmount)}</span>
            </div>
          )}

          {/* Customer Overall Due status */}
          {sale.customer && (
            <div className="border-t border-dashed border-slate-300 pt-1 mt-1 text-[11px]">
              {customerPreviousDue > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>পূর্বের বাকি:</span>
                  <span>{formatBDT(customerPreviousDue)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-rose-800">
                <span>বর্তমান সর্বমোট বাকি:</span>
                <span>{formatBDT(currentTotalDue)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-500 border-t border-dashed border-slate-300 pt-3">
          <p className="font-medium text-slate-700">{footerText}</p>
          <p className="mt-1 text-[9px] text-slate-400">সফটওয়্যার প্রস্তুতকারক: Aulad IT Solution</p>
        </div>
      </div>
    </div>
  );
};
