import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import Product from '@/models/Product';
import Batch from '@/models/Batch';

export async function GET() {
  try {
    await connectDB();

    // Auto generate dynamic alert notifications if needed
    const lowStockCount = await Product.countDocuments({
      active: true,
      $expr: { $lte: ['$currentStock', '$minimumStock'] },
    });

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const expiringCount = await Batch.countDocuments({
      remainingQuantity: { $gt: 0 },
      expiryDate: { $lte: thirtyDays.toISOString().split('T')[0] },
    });

    const notifications: any[] = [];

    if (lowStockCount > 0) {
      notifications.push({
        _id: 'notif_low_stock',
        title: 'স্টক কম রয়েছে',
        message: `${lowStockCount}টি পণ্যের স্টক ন্যূনতম সীমার নিচে নেমে এসেছে। দ্রুত অর্ডার দিন।`,
        type: 'LOW_STOCK',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (expiringCount > 0) {
      notifications.push({
        _id: 'notif_expiry',
        title: 'মেয়াদ শেষ হওয়ার সতর্কবার্তা',
        message: `${expiringCount}টি ব্যাচের পণ্যের মেয়াদ আগামী ৩০ দিনের মধ্যে শেষ হবে।`,
        type: 'EXPIRING_SOON',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    const dbNotifs = await Notification.find().sort({ createdAt: -1 }).limit(10).lean();

    return NextResponse.json({
      success: true,
      data: [...notifications, ...dbNotifs],
      unreadCount: notifications.length + dbNotifs.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'নোটিফিকেশন লোড করা যায়নি' }, { status: 500 });
  }
}
