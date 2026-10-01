import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import AuditLog from '@/models/AuditLog';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'view_audit_logs');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await AuditLog.find()
      .populate('user', 'name role email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ success: false, message: 'অডিট লগ লোড করা যায়নি' }, { status: 500 });
  }
}
