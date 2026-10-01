export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY_MANAGER';

export type Permission =
  | 'manage_settings'
  | 'manage_users'
  | 'manage_products'
  | 'manage_inventory'
  | 'manage_purchases'
  | 'manage_suppliers'
  | 'manage_customers'
  | 'process_sales'
  | 'process_returns'
  | 'manage_expenses'
  | 'view_reports'
  | 'view_profit_reports'
  | 'manage_cash_register'
  | 'override_price'
  | 'override_expired_batch'
  | 'view_audit_logs';

export interface IUser {
  _id: any;
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IBusinessSettings {
  _id?: any;
  businessNameBn: string;
  businessNameEn: string;
  ownerName: string;
  logo?: string;
  phone: string;
  email?: string;
  address: string;
  tradeLicense?: string;
  vatNumber?: string;
  receiptFooterBn: string;
  receiptFooterEn?: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  features: {
    batchTracking: boolean;
    expiryManagement: boolean;
    barcode: boolean;
    wholesale: boolean;
    customerLedger: boolean;
    supplierLedger: boolean;
    cashRegister: boolean;
    advancedReports: boolean;
    purchaseReturns: boolean;
    salesReturns: boolean;
    creditLimitCheck: boolean;
  };
  inventorySettings: {
    expiryWarningDays: number;
    lowStockThresholdDefault: number;
    fefoAutoSelect: boolean;
    allowExpiredSaleOverride: boolean;
  };
  salesSettings: {
    invoicePrefix: string;
    purchasePrefix: string;
    allowPriceOverride: boolean;
    allowDiscounts: boolean;
    requireCustomerForDue: boolean;
    printFormatDefault: 'thermal58' | 'thermal80' | 'a4';
  };
}

export interface ICategory {
  _id: any;
  nameBn: string;
  nameEn: string;
  description?: string;
  image?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUnit {
  _id: any;
  code: string;
  nameBn: string;
  nameEn: string;
  isBaseUnit?: boolean;
  baseUnit?: string;
  conversionFactor?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  _id: any;
  productCode: string;
  barcode?: string;
  nameBn: string;
  nameEn: string;
  category: any;
  brand?: string;
  manufacturer?: string;
  description?: string;
  image?: string;
  defaultPurchasePrice: number;
  defaultSalePrice: number;
  wholesalePrice?: number;
  unit: string;
  packSize?: string;
  minimumStock: number;
  currentStock: number;
  trackBatch: boolean;
  trackExpiry: boolean;
  registrationNumber?: string;
  countryOfOrigin?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBatch {
  _id: any;
  batchNumber: string;
  product: any;
  supplier?: any;
  purchase?: any;
  manufacturingDate?: string;
  expiryDate?: string;
  purchasePrice: number;
  salePrice: number;
  initialQuantity: number;
  remainingQuantity: number;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'RECALLED';
  createdAt: string;
  updatedAt: string;
}

export interface ISupplier {
  _id: any;
  supplierCode: string;
  name: string;
  company: string;
  phone: string;
  alternativePhone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  currentBalance: number;
  totalPurchases: number;
  totalPaid: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SupplierLedgerType =
  | 'OPENING_BALANCE'
  | 'PURCHASE'
  | 'PAYMENT'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT';

export interface ISupplierLedger {
  _id: any;
  supplier: any;
  date: string;
  type: SupplierLedgerType;
  referenceType?: 'Purchase' | 'Payment' | 'PurchaseReturn' | 'Manual';
  referenceId?: any;
  referenceNumber?: string;
  debit: number;
  credit: number;
  balance: number;
  notes?: string;
  createdBy?: any;
  createdAt: string;
}

export interface ICustomer {
  _id: any;
  customerCode: string;
  name: string;
  phone: string;
  alternativePhone?: string;
  village?: string;
  union?: string;
  upazila?: string;
  district?: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number;
  totalPurchases: number;
  totalPaid: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerLedgerType =
  | 'OPENING_BALANCE'
  | 'SALE'
  | 'PAYMENT'
  | 'SALE_RETURN'
  | 'ADJUSTMENT';

export interface ICustomerLedger {
  _id: any;
  customer: any;
  date: string;
  type: CustomerLedgerType;
  referenceType?: 'Sale' | 'Payment' | 'SaleReturn' | 'Manual';
  referenceId?: any;
  referenceNumber?: string;
  debit: number;
  credit: number;
  balance: number;
  notes?: string;
  createdBy?: any;
  createdAt: string;
}

export interface IPurchaseItem {
  product: any;
  productNameBn: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  quantity: number;
  unit: string;
  unitConversionFactor?: number;
  baseQuantity: number;
  purchasePrice: number;
  salePrice?: number;
  total: number;
  batchId?: any;
}

export interface IPurchase {
  _id: any;
  purchaseNumber: string;
  supplier: any;
  invoiceNumber?: string;
  purchaseDate: string;
  items: IPurchaseItem[];
  subtotal: number;
  discount: number;
  transportCost: number;
  otherCost: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  paymentMethod: string;
  notes?: string;
  attachment?: string;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ISaleItem {
  product: any;
  productNameBn: string;
  productCode?: string;
  batch?: any;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
}

export interface IPaymentMethodBreakdown {
  method: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CARD' | 'OTHER';
  amount: number;
  reference?: string;
}

export interface ISale {
  _id: any;
  saleNumber: string;
  customer?: any;
  customerName?: string;
  customerPhone?: string;
  saleType: 'RETAIL' | 'WHOLESALE';
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  additionalDiscount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  changeAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' | 'REFUNDED';
  paymentMethods: IPaymentMethodBreakdown[];
  salesperson?: any;
  salespersonName?: string;
  notes?: string;
  overrideReason?: string;
  isReturned?: boolean;
  returnedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_RETURN'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'DAMAGE'
  | 'EXPIRED'
  | 'OPENING_STOCK';

export interface IStockMovement {
  _id: any;
  product: any;
  batch?: any;
  type: StockMovementType;
  quantity: number;
  unit: string;
  baseQuantity: number;
  referenceType?: 'Purchase' | 'Sale' | 'SaleReturn' | 'PurchaseReturn' | 'Adjustment';
  referenceId?: any;
  referenceNumber?: string;
  reason?: string;
  previousStock: number;
  newStock: number;
  createdBy?: any;
  createdAt: string;
}

export interface IExpense {
  _id: any;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  attachment?: string;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ICashShift {
  _id: any;
  shiftDate: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingCash: number;
  cashSales: number;
  cashDueCollections: number;
  cashSupplierPayments: number;
  cashExpenses: number;
  cashIn: number;
  cashOut: number;
  cashRefunds: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface INotification {
  _id: any;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' | 'CREDIT_LIMIT' | 'SUPPLIER_DUE' | 'INFO';
  entityType?: 'Product' | 'Batch' | 'Customer' | 'Supplier' | 'System';
  entityId?: any;
  read: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: any;
  user?: any;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: any;
  beforeSummary?: string;
  afterSummary?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}
