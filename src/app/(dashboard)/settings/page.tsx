'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, Sliders, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { IBusinessSettings } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<IBusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          setSettings(json.data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
        setSettings(json.data);
      } else {
        toast.error(json.message || 'সেটিংস সংরক্ষণ ব্যর্থ');
      }
    } catch {
      toast.error('সংযোগ সমস্যা');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (key: keyof IBusinessSettings['features']) => {
    if (!settings) return;
    setSettings({
      ...settings,
      features: {
        ...settings.features,
        [key]: !settings.features[key],
      },
    });
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-400">সেটিংস লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            দোকান ও সিস্টেম সেটিংস (Settings)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            প্রতিষ্ঠানের নাম, ঠিকানা, রসিদ ফরম্যাট ও প্যাকেজ ফিচার কনফিগারেশন
          </p>
        </div>

        <Button onClick={handleSave} isLoading={saving} className="bg-emerald-700 hover:bg-emerald-800 font-bold">
          <Save className="w-4 h-4 mr-1.5" />
          পরিবর্তন সংরক্ষণ করুন
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
            ১. প্রতিষ্ঠানের পরিচিতি ও তথ্য
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="প্রতিষ্ঠানের নাম (বাংলা) *"
              value={settings.businessNameBn}
              onChange={(e) => setSettings({ ...settings, businessNameBn: e.target.value })}
              required
            />
            <Input
              label="প্রতিষ্ঠানের নাম (ইংরেজি) *"
              value={settings.businessNameEn}
              onChange={(e) => setSettings({ ...settings, businessNameEn: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="মালিকের নাম *"
              value={settings.ownerName}
              onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
              required
            />
            <Input
              label="দোকানের মোবাইল নম্বর *"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              required
            />
            <Input
              label="ইমেইল (ঐচ্ছিক)"
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="দোকানের পূর্ণ ঠিকানা *"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                required
              />
            </div>
            <Input
              label="ট্রেড লাইসেন্স নং"
              value={settings.tradeLicense || ''}
              onChange={(e) => setSettings({ ...settings, tradeLicense: e.target.value })}
            />
          </div>

          <Input
            label="রসিদের নিচের শুভেচ্ছা বার্তা (Receipt Footer) *"
            value={settings.receiptFooterBn}
            onChange={(e) => setSettings({ ...settings, receiptFooterBn: e.target.value })}
            required
          />
        </div>

        {/* Sales & Receipt Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
            ২. বিক্রয় ও রসিদ সেটিংস
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ডিফল্ট রসিদ প্রিন্ট ফরম্যাট
              </label>
              <select
                value={settings.salesSettings.printFormatDefault}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    salesSettings: {
                      ...settings.salesSettings,
                      printFormatDefault: e.target.value as any,
                    },
                  })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="thermal80">৮০ মিমি থার্মাল প্রিন্ট (80mm Thermal POS)</option>
                <option value="thermal58">৫৮ মিমি থার্মাল প্রিন্ট (58mm Mini POS)</option>
                <option value="a4">A4 পূর্ণ সাইজ ক্যাশ মেমো (A4 Print)</option>
              </select>
            </div>

            <Input
              label="বিক্রয় চালান প্রিফিক্স"
              value={settings.salesSettings.invoicePrefix}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  salesSettings: { ...settings.salesSettings, invoicePrefix: e.target.value },
                })
              }
            />

            <Input
              label="ক্রয় চালান প্রিফিক্স"
              value={settings.salesSettings.purchasePrefix}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  salesSettings: { ...settings.salesSettings, purchasePrefix: e.target.value },
                })
              }
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.salesSettings.allowDiscounts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    salesSettings: { ...settings.salesSettings, allowDiscounts: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span>বিক্রয়ে বিশেষ ছাড় অনুমোদন</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.salesSettings.requireCustomerForDue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    salesSettings: {
                      ...settings.salesSettings,
                      requireCustomerForDue: e.target.checked,
                    },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span>বাকি বিক্রয়ে কাস্টমার নির্বাচন বাধ্যতামূলক রাখা</span>
            </label>
          </div>
        </div>

        {/* Feature Flags (Package Management) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-700" />
                ৩. প্যাকেজ ফিচার কন্ট্রোল (Feature Flags)
              </h3>
              <p className="text-xs text-slate-500">
                একই মাস্টার কোডবেসে বেসিক, স্ট্যান্ডার্ড বা প্রিমিয়াম প্যাকেজ কনফিগার করুন
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { key: 'batchTracking', label: 'ব্যাচ ট্র্যাকিং সিস্টেম' },
              { key: 'expiryManagement', label: 'মেয়াদোত্তীর্ণ পর্যবেক্ষণ ও সতর্কবার্তা' },
              { key: 'barcode', label: 'বারকোড স্ক্যানার ও ইনপুট সাপোর্ট' },
              { key: 'wholesale', label: 'পাইকারি রেট ও বিক্রয় মোড' },
              { key: 'customerLedger', label: 'কাস্টমার লেজার খাতা' },
              { key: 'supplierLedger', label: 'সাপ্লায়ার লেজার খাতা' },
              { key: 'cashRegister', label: 'দৈনিক ক্যাশ রেজিস্টার ও শিফট ট্র্যাকিং' },
              { key: 'advancedReports', label: 'উন্নত লাভ-ক্ষতি ও স্টক মূল্যায়ন রিপোর্ট' },
              { key: 'salesReturns', label: 'বিক্রয় ফেরত (Sales Return)' },
              { key: 'purchaseReturns', label: 'সাপ্লায়ারে মালামাল ফেরত (Purchase Return)' },
              { key: 'creditLimitCheck', label: 'কাস্টমার ক্রেডিট লিমিট চেক' },
            ].map(({ key, label }) => {
              const isEnabled = settings.features[key as keyof IBusinessSettings['features']];
              return (
                <div
                  key={key}
                  onClick={() => toggleFeature(key as keyof IBusinessSettings['features'])}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isEnabled
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-semibold">{label}</span>
                  {isEnabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} className="bg-emerald-700 hover:bg-emerald-800 font-bold px-8">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            সেটিংস পরিবর্তন কার্যকর করুন
          </Button>
        </div>
      </form>
    </div>
  );
}
