import { Permission, UserRole } from '@/types';

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'manage_settings',
    'manage_users',
    'manage_products',
    'manage_inventory',
    'manage_purchases',
    'manage_suppliers',
    'manage_customers',
    'process_sales',
    'process_returns',
    'manage_expenses',
    'view_reports',
    'view_profit_reports',
    'manage_cash_register',
    'override_price',
    'override_expired_batch',
    'view_audit_logs',
  ],
  MANAGER: [
    'manage_products',
    'manage_inventory',
    'manage_purchases',
    'manage_suppliers',
    'manage_customers',
    'process_sales',
    'process_returns',
    'manage_expenses',
    'view_reports',
    'manage_cash_register',
    'override_price',
  ],
  CASHIER: [
    'process_sales',
    'manage_customers',
    'manage_cash_register',
  ],
  INVENTORY_MANAGER: [
    'manage_products',
    'manage_inventory',
    'manage_purchases',
    'manage_suppliers',
  ],
};

export const hasPermission = (
  user: { role: UserRole; permissions?: Permission[] } | null | undefined,
  requiredPermission: Permission
): boolean => {
  if (!user) return false;
  if (user.role === 'OWNER') return true;

  const permissions = user.permissions && user.permissions.length > 0
    ? user.permissions
    : ROLE_DEFAULT_PERMISSIONS[user.role] || [];

  return permissions.includes(requiredPermission);
};

export const roleDisplayBn: Record<UserRole, string> = {
  OWNER: 'মালিক / সুপার এডমিন',
  MANAGER: 'ম্যানেজার',
  CASHIER: 'ক্যাশিয়ার / বিক্রয়কর্মী',
  INVENTORY_MANAGER: 'ইনভেন্টরি ম্যানেজার',
};
