'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import { IAuditLog } from '@/types';
import { formatDateBD } from '@/lib/utils/date';
import { Badge } from '@/components/ui/Badge';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/audit-logs?limit=100');
        if (res.ok) {
          const json = await res.json();
          setLogs(json.data || []);
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      !searchTerm ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.userName && l.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.reason && l.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-700" />
          সিস্টেম অডিট ও নিরাপত্তা লগ (Audit Logs)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          স্টক সমন্বয়, সেটিংস পরিবর্তন, মূল্য ওভাররাইড ও কর্মী সম্পর্কিত সংবেদনশীল কর্মকাণ্ডের রেকর্ড
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="একশন বা ব্যবহারকারী দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>
          <span className="text-xs text-slate-500">মোট লগ: {filtered.length} টি</span>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-400 text-sm">অডিট লগ লোড হচ্ছে...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-slate-400 text-sm">কোনো অডিট লগ রেকর্ড পাওয়া যায়নি</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">সময় ও তারিখ</th>
                  <th className="py-2.5 px-3">অপারেটর</th>
                  <th className="py-2.5 px-3">একশন</th>
                  <th className="py-2.5 px-3">মডিউল</th>
                  <th className="py-2.5 px-3">বিবরণ / পরিবর্তন</th>
                  <th className="py-2.5 px-3">কারণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {formatDateBD(log.createdAt, true)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {log.userName || (log.user as any)?.name || 'সিস্টেম'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="default">{log.entityType}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{log.afterSummary || log.beforeSummary || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{log.reason || '-'}</td>
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
