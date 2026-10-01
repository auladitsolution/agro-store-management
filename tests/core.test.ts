import { describe, it, expect } from 'vitest';
import {
  toPaisa,
  fromPaisa,
  roundMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  formatBDT,
  toBanglaDigits,
} from '../src/lib/utils/money';
import { toBaseQuantity, fromBaseQuantity } from '../src/lib/utils/units';
import { sortBatchesFEFO, evaluateBatchExpiry, suggestFEFOBatch } from '../src/lib/utils/fefo';
import { hasPermission } from '../src/lib/permissions/rbac';
import { IBatch } from '../src/types';

describe('Safe Financial & Money Calculations', () => {
  it('converts to and from paisa accurately', () => {
    expect(toPaisa(120.55)).toBe(12055);
    expect(fromPaisa(12055)).toBe(120.55);
  });

  it('prevents floating point arithmetic errors in addition', () => {
    // 0.1 + 0.2 is famously 0.30000000000000004 in native JS
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(addMoney(100.25, 200.75, 50.5)).toBe(351.5);
  });

  it('subtracts money safely', () => {
    expect(subtractMoney(500.5, 200.25)).toBe(300.25);
    expect(subtractMoney(100, 30.33)).toBe(69.67);
  });

  it('multiplies and divides money with proper rounding', () => {
    expect(multiplyMoney(50.25, 3)).toBe(150.75);
    expect(divideMoney(100, 3)).toBe(33.33);
  });

  it('formats BDT with commas and symbol', () => {
    expect(formatBDT(150000)).toBe('৳ 1,50,000.00');
    expect(formatBDT(150000, { showSymbol: false })).toBe('1,50,000.00');
  });

  it('converts numbers to Bangla digits', () => {
    expect(toBanglaDigits('12345')).toBe('১২৩৪৫');
    expect(formatBDT(1000, { useBanglaDigits: true })).toBe('৳ ১,০০০.০০');
  });
});

describe('Unit Conversion Logic', () => {
  it('converts bags of 50kg to base kg', () => {
    const bags = 10;
    const factor = 50;
    const baseKg = toBaseQuantity(bags, factor);
    expect(baseKg).toBe(500);

    const backToBags = fromBaseQuantity(baseKg, factor);
    expect(backToBags).toBe(10);
  });

  it('converts bottles to liters', () => {
    // 4 bottles of 250ml (0.25L factor)
    expect(toBaseQuantity(4, 0.25)).toBe(1);
    expect(fromBaseQuantity(1, 0.25)).toBe(4);
  });
});

describe('FEFO (First Expire, First Out) Logic', () => {
  const mockBatches: IBatch[] = [
    {
      _id: 'b1',
      batchNumber: 'BATCH-2028',
      product: 'prod-1',
      purchasePrice: 100,
      salePrice: 150,
      initialQuantity: 50,
      remainingQuantity: 20,
      expiryDate: '2028-12-31',
      status: 'ACTIVE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      _id: 'b2',
      batchNumber: 'BATCH-2026-SOON',
      product: 'prod-1',
      purchasePrice: 100,
      salePrice: 150,
      initialQuantity: 50,
      remainingQuantity: 30,
      expiryDate: '2026-11-15',
      status: 'ACTIVE',
      createdAt: '2026-01-02',
      updatedAt: '2026-01-02',
    },
    {
      _id: 'b3',
      batchNumber: 'BATCH-EXPIRED',
      product: 'prod-1',
      purchasePrice: 100,
      salePrice: 150,
      initialQuantity: 50,
      remainingQuantity: 15,
      expiryDate: '2025-01-01', // Already expired
      status: 'ACTIVE',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
  ];

  it('identifies expired batches and warning days correctly', () => {
    const refDate = new Date('2026-10-01');
    const expiredAnalysis = evaluateBatchExpiry(mockBatches[2], 60, refDate);
    expect(expiredAnalysis.isExpired).toBe(true);
    expect(expiredAnalysis.status).toBe('EXPIRED');

    const soonAnalysis = evaluateBatchExpiry(mockBatches[1], 60, refDate);
    expect(soonAnalysis.isExpiringSoon).toBe(true);
    expect(soonAnalysis.isExpired).toBe(false);
  });

  it('sorts batches with earliest valid expiry first, excluding expired batches when filterExpired is true', () => {
    const refDate = new Date('2026-10-01');
    const sorted = sortBatchesFEFO(mockBatches, { filterExpired: true, referenceDate: refDate });
    expect(sorted.length).toBe(2);
    expect(sorted[0].batchNumber).toBe('BATCH-2026-SOON');
    expect(sorted[1].batchNumber).toBe('BATCH-2028');
  });

  it('suggests the earliest valid batch for sale', () => {
    const refDate = new Date('2026-10-01');
    const suggested = suggestFEFOBatch(mockBatches, refDate);
    expect(suggested?._id).toBe('b2');
  });
});

describe('RBAC Authorization', () => {
  it('grants full access to OWNER regardless of explicit permissions', () => {
    const owner = { role: 'OWNER' as const, permissions: [] };
    expect(hasPermission(owner, 'manage_settings')).toBe(true);
    expect(hasPermission(owner, 'manage_users')).toBe(true);
    expect(hasPermission(owner, 'override_expired_batch')).toBe(true);
  });

  it('restricts CASHIER from sensitive owner actions', () => {
    const cashier = { role: 'CASHIER' as const };
    expect(hasPermission(cashier, 'process_sales')).toBe(true);
    expect(hasPermission(cashier, 'manage_settings')).toBe(false);
    expect(hasPermission(cashier, 'manage_users')).toBe(false);
    expect(hasPermission(cashier, 'view_profit_reports')).toBe(false);
  });
});
