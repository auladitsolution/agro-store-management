'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { formatDateBD } from '@/lib/utils/date';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.data || []);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-700" />
          সিস্টেম নোটিফিকেশন ও সতর্কবার্তা (Notifications)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          কম স্টকের পণ্য, মেয়াদ শেষের সতর্কতা ও গুরুত্বপূর্ণ বাণিজ্যিক অ্যালার্ট
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="p-8 text-center text-slate-400 text-sm">নোটিফিকেশন লোড হচ্ছে...</p>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-50" />
            কোনো নতুন সতর্কবার্তা নেই! সবকিছু স্বাভাবিক রয়েছে।
          </div>
        ) : (
          notifications.map((n, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all bg-white ${
                n.type === 'LOW_STOCK'
                  ? 'border-rose-200 shadow-2xs'
                  : n.type === 'EXPIRING_SOON'
                  ? 'border-amber-200 shadow-2xs'
                  : 'border-slate-200'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'LOW_STOCK'
                    ? 'bg-rose-50 text-rose-600'
                    : n.type === 'EXPIRING_SOON'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {n.type === 'LOW_STOCK' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {formatDateBD(n.createdAt, true)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
