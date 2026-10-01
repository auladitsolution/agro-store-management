'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState('মোঃ আওলাদ হোসেন');
  const [email, setEmail] = useState('owner@agrostore.com');
  const [phone, setPhone] = useState('01711223344');
  const [businessNameBn, setBusinessNameBn] = useState('কৃষি বন্ধু এগ্রো স্টোর');
  const [address, setAddress] = useState('স্টেশন রোড, রংপুর সদর, রংপুর');
  const [loading, setLoading] = useState(false);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          businessNameBn,
          address,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'সেটআপ সফলভাবে সম্পন্ন হয়েছে!');
        router.push('/');
      } else {
        toast.error(json.message || 'সেটআপ ব্যর্থ হয়েছে');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="w-14 h-14 bg-emerald-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Sprout className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-800 tracking-tight">
          নতুন এগ্রো স্টোর ইনিশিয়ালাইজেশন
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          প্রথম মালিক (Super Admin) ও দোকানের মৌলিক তথ্য সেটআপ করুন
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          <form onSubmit={handleBootstrap} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="মালিকের নাম *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                label="মালিকের ইমেইল *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="মোবাইল নম্বর *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="প্রতিষ্ঠানের নাম (বাংলা) *"
                value={businessNameBn}
                onChange={(e) => setBusinessNameBn(e.target.value)}
                required
              />
            </div>

            <Input
              label="দোকানের পূর্ণ ঠিকানা *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
              ✓ ডিফল্ট কৃষি ক্যাটাগরি (বীজ, সার, বালাইনাশক ইত্যাদি) স্বয়ংক্রিয়ভাবে তৈরি হবে।<br />
              ✓ আদর্শ কৃষি ইউনিট (কেজি, লিটার, বস্তা, বোতল ইত্যাদি) কনফিগার হবে।
            </div>

            <Button type="submit" isLoading={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 py-2.5 font-bold">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              প্রাথমিক সেটআপ সম্পন্ন করুন
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
