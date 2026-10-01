import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import BusinessSettings from '@/models/BusinessSettings';
import AuditLog from '@/models/AuditLog';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    await connectDB();
    let settings = await BusinessSettings.findOne().lean();
    if (!settings) {
      settings = await BusinessSettings.create({
        businessNameBn: 'কৃষি বন্ধু এগ্রো স্টোর',
        businessNameEn: 'Krishi Bondhu Agro Store',
        ownerName: 'মোঃ আওলাদ হোসেন',
        phone: '01700000000',
        address: 'বাজার রোড, রংপুর, বাংলাদেশ',
      });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, message: 'সেটিংস লোড করা যায়নি' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_settings');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();

    const updated = await BusinessSettings.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
    });

    await AuditLog.create({
      user: authResult.user._id,
      userName: authResult.user.name,
      action: 'SETTINGS_UPDATE',
      entityType: 'BusinessSettings',
      beforeSummary: 'সিস্টেম সেটিংস হালনাগাদ',
      afterSummary: 'নতুন কনফিগারেশন সংরক্ষিত',
      reason: 'ব্যবহারকারী কর্তৃক সেটিংস পরিবর্তন',
    });

    return NextResponse.json({ success: true, data: updated, message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে।' });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, message: error.message || 'সেটিংস সংরক্ষণে সমস্যা' }, { status: 400 });
  }
}
