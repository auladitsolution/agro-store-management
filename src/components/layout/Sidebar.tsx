'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  Boxes,
  Users,
  Building2,
  Wallet,
  ReceiptText,
  BarChart3,
  Settings,
  UserCheck,
  ShieldAlert,
  Sprout,
  X,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    { name: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard },
    { name: 'বিক্রয় (POS)', href: '/pos', icon: ShoppingCart, highlight: true },
    { name: 'বিক্রয় তালিকা', href: '/sales', icon: Receipt },
    { name: 'বিক্রয় ফেরত', href: '/sales/returns', icon: RotateCcw },
    { name: 'ক্রয় চালান', href: '/purchases', icon: Truck },
    { name: 'পণ্য তালিকা', href: '/products', icon: Package },
    { name: 'স্টক ও ব্যাচ', href: '/inventory', icon: Boxes },
    { name: 'কাস্টমার', href: '/customers', icon: Users },
    { name: 'বাকি আদায়', href: '/customers/dues', icon: Wallet, highlightDue: true },
    { name: 'সাপ্লায়ার', href: '/suppliers', icon: Building2 },
    { name: 'দোকানের খরচ', href: '/expenses', icon: ReceiptText },
    { name: 'ক্যাশ রেজিস্টার', href: '/cash-register', icon: Wallet },
    { name: 'রিপোর্ট ও লাভ', href: '/reports', icon: BarChart3 },
    { name: 'কর্মী ও ভূমিকা', href: '/users', icon: UserCheck, adminOnly: true },
    { name: 'অডিট লগ', href: '/audit-logs', icon: ShieldAlert, adminOnly: true },
    { name: 'সেটিংস', href: '/settings', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white leading-tight">
                কৃষি বন্ধু এগ্রো
              </h1>
              <p className="text-[10px] text-emerald-400 font-medium">Aulad IT Solution</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigation.map((item) => {
            if (item.adminOnly && user?.role !== 'OWNER' && user?.role !== 'MANAGER') {
              return null;
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : item.highlight
                    ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 hover:text-white border border-emerald-800/40'
                    : item.highlightDue
                    ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 hover:text-white border border-amber-800/40'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer User Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="font-medium text-slate-200 truncate">{user?.name || 'ব্যবহারকারী'}</p>
              <p className="text-[10px] text-emerald-400">
                {user?.role === 'OWNER' ? 'মালিক (Super Admin)' : user?.role || 'কর্মচারী'}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
