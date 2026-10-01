import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const users = await User.find().sort({ role: 1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, message: 'ব্যবহারকারী তালিকা লোড করা যায়নি' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { name, email, phone, role = 'CASHIER', firebaseUid } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'নাম এবং ইমেইল প্রদান করুন' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, message: 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে' }, { status: 400 });
    }

    const newUser = await User.create({
      firebaseUid: firebaseUid || `user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone,
      role,
      active: true,
      permissions: [],
    });

    await AuditLog.create({
      user: authResult.user._id,
      userName: authResult.user.name,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      afterSummary: `নতুন কর্মী যোগ: ${name} (${role})`,
    });

    return NextResponse.json({ success: true, message: 'নতুন কর্মী যোগ করা হয়েছে।', data: newUser });
  } catch (error: any) {
    console.error('Error adding user:', error);
    return NextResponse.json({ success: false, message: error.message || 'কর্মী যোগ ব্যর্থ হয়েছে' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, 'manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { id, role, active, permissions } = body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' }, { status: 404 });
    }

    if (userToUpdate.role === 'OWNER' && active === false) {
      return NextResponse.json({ success: false, message: 'মালিকের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না' }, { status: 400 });
    }

    const prevRole = userToUpdate.role;
    const prevActive = userToUpdate.active;

    if (role) userToUpdate.role = role;
    if (typeof active === 'boolean') userToUpdate.active = active;
    if (permissions) userToUpdate.permissions = permissions;

    await userToUpdate.save();

    await AuditLog.create({
      user: authResult.user._id,
      userName: authResult.user.name,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: userToUpdate._id,
      beforeSummary: `ভূমিকা: ${prevRole}, স্ট্যাটাস: ${prevActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`,
      afterSummary: `ভূমিকা: ${userToUpdate.role}, স্ট্যাটাস: ${userToUpdate.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`,
    });

    return NextResponse.json({ success: true, message: 'ব্যবহারকারী তথ্য হালনাগাদ হয়েছে।' });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, message: error.message || 'হালনাগাদ ব্যর্থ' }, { status: 400 });
  }
}
