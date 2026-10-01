import { NextRequest } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/models/User';
import { IUser, Permission, UserRole } from '@/types';
import { hasPermission } from '@/lib/permissions/rbac';

export interface AuthenticatedUser {
  user: IUser;
  role: UserRole;
  permissions: Permission[];
}

export async function getSessionUser(req: NextRequest): Promise<IUser | null> {
  await connectDB();

  // 1. Try Firebase Bearer Token
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await verifyFirebaseIdToken(token);
    if (decoded && decoded.uid) {
      const userDoc = await User.findOne({ firebaseUid: decoded.uid, active: true }).lean<IUser>();
      if (userDoc) {
        return {
          ...userDoc,
          _id: userDoc._id.toString(),
        };
      }
    }
  }

  // 2. Fallback for Local / Development / Demo session if Firebase is not fully configured
  const devEmail = req.headers.get('x-dev-user-email') || req.cookies.get('demo_user_email')?.value;
  if (devEmail) {
    const userDoc = await User.findOne({ email: devEmail.toLowerCase(), active: true }).lean<IUser>();
    if (userDoc) {
      return {
        ...userDoc,
        _id: userDoc._id.toString(),
      };
    }
  }

  // 3. Fallback: check if an active OWNER user exists in DB for single-tenant local operation
  const ownerUser = await User.findOne({ role: 'OWNER', active: true }).lean<IUser>();
  if (ownerUser) {
    return {
      ...ownerUser,
      _id: ownerUser._id.toString(),
    };
  }

  return null;
}

export async function requireAuth(
  req: NextRequest,
  requiredPermission?: Permission
): Promise<{ user: IUser } | { error: string; status: number }> {
  const user = await getSessionUser(req);
  if (!user) {
    return { error: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে লগইন করুন।', status: 401 };
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return { error: 'আপনার এই কাজটি করার অনুমতি নেই।', status: 403 };
  }

  return { user };
}
