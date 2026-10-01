import { IBatch } from '@/types';

export type ExpiryStatus = 'GOOD' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';

export interface BatchExpiryAnalysis {
  batch: IBatch;
  status: ExpiryStatus;
  daysRemaining: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  statusLabelBn: string;
}

/**
 * Evaluates expiry status of a single batch relative to a reference date (default: today)
 */
export const evaluateBatchExpiry = (
  batch: IBatch,
  warningDays: number = 60,
  referenceDate: Date = new Date()
): BatchExpiryAnalysis => {
  if (!batch.expiryDate) {
    return {
      batch,
      status: 'NO_EXPIRY',
      daysRemaining: null,
      isExpired: false,
      isExpiringSoon: false,
      statusLabelBn: 'মেয়াদ প্রযোজ্য নয়',
    };
  }

  const expiry = new Date(batch.expiryDate);
  const diffTime = expiry.getTime() - referenceDate.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return {
      batch,
      status: 'EXPIRED',
      daysRemaining,
      isExpired: true,
      isExpiringSoon: false,
      statusLabelBn: 'মেয়াদোত্তীর্ণ',
    };
  }

  if (daysRemaining <= warningDays) {
    return {
      batch,
      status: 'EXPIRING_SOON',
      daysRemaining,
      isExpired: false,
      isExpiringSoon: true,
      statusLabelBn: `${daysRemaining} দিনে মেয়াদ শেষ`,
    };
  }

  return {
    batch,
    status: 'GOOD',
    daysRemaining,
    isExpired: false,
    isExpiringSoon: false,
    statusLabelBn: 'ভালো',
  };
};

/**
 * Sort batches using FEFO (First Expired First Out)
 * Earliest valid expiring batch first. Batches with remaining stock > 0.
 * If expired batches exist, they are placed at the end or filtered out.
 */
export const sortBatchesFEFO = (
  batches: IBatch[],
  options?: { filterExpired?: boolean; referenceDate?: Date }
): IBatch[] => {
  const { filterExpired = false, referenceDate = new Date() } = options || {};

  return [...batches]
    .filter((b) => (b.remainingQuantity || 0) > 0)
    .filter((b) => {
      if (!filterExpired) return true;
      if (!b.expiryDate) return true;
      return new Date(b.expiryDate).getTime() > referenceDate.getTime();
    })
    .sort((a, b) => {
      // If neither has expiry, sort by createdAt / batchNumber
      if (!a.expiryDate && !b.expiryDate) {
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      // If only one has expiry, prioritize the one with expiry
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;

      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
};

/**
 * Suggest optimal batch for selling a given requested quantity based on FEFO
 */
export const suggestFEFOBatch = (
  batches: IBatch[],
  referenceDate: Date = new Date()
): IBatch | null => {
  const validBatches = sortBatchesFEFO(batches, { filterExpired: true, referenceDate });
  return validBatches.length > 0 ? validBatches[0] : null;
};
