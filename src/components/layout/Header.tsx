'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  ShoppingCart,
  Wallet,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-72 lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পণ্য, বারকোড বা কাস্টমার খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs lg:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Quick Actions */}
        <Link href="/pos">
          <Button size="sm" className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700">
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            নতুন বিক্রয় (POS)
          </Button>
        </Link>

        <Link href="/customers/dues">
          <Button size="sm" variant="outline" className="hidden sm:inline-flex border-amber-300 text-amber-800 hover:bg-amber-50">
            <Wallet className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            বাকি আদায়
          </Button>
        </Link>

        {/* Notifications */}
        <Link href="/notifications" className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'ব্যবহারকারী'}</p>
            <p className="text-[10px] text-slate-500">{user?.role || 'কর্মী'}</p>
          </div>
          <button
            onClick={() => logout()}
            title="লগআউট"
            className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
