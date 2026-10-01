import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    const settings = await BusinessSettings.findOne().lean();

    return NextResponse.json({
      success: true,
      user,
      settings: settings || null,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
