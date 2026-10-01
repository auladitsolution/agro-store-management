'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('ইমেইল এবং পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('সফলভাবে লগইন হয়েছে!');
      router.push('/');
    } catch {
      // Allow demo bypass during initial setup
      toast.info('ডেমো মোডে সরাসরি ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('গুগল দিয়ে লগইন সফল হয়েছে!');
      router.push('/');
    } catch {
      toast.info('ডেমো মোডে সরাসরি ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-emerald-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Sprout className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-800 tracking-tight">
          এগ্রো স্টোর ম্যানেজমেন্ট সিস্টেম
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Aulad IT Solution — বাণিজ্যিক কৃষি ব্যবস্থাপনা সফটওয়্যার
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200/80">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              type="email"
              label="ইমেইল অ্যাড্রেস"
              placeholder="owner@agrostore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="পাসওয়ার্ড"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" isLoading={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 py-2.5 font-bold">
              <LogIn className="w-4 h-4 mr-1.5" />
              লগইন করুন
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-500">অথবা</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.22 0 10.05 0 12s.45 3.78 1.25 5.39l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                Google অ্যাকাউন্ট দিয়ে প্রবেশ করুন
              </button>
            </div>
          </div>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <Link
              href="/setup"
              className="text-xs text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
            >
              নতুন দোকানের প্রাথমিক ইনিশিয়ালাইজেশন (Setup) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
