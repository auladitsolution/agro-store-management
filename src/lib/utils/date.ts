import { format, parseISO } from 'date-fns';
import { toBanglaDigits } from './money';

export const formatDateBD = (
  dateInput: string | Date | number | null | undefined,
  includeTime: boolean = false,
  banglaDigits: boolean = false
): string => {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
    if (isNaN(d.getTime())) return '-';

    const pattern = includeTime ? 'dd/MM/yyyy hh:mm a' : 'dd/MM/yyyy';
    const formatted = format(d, pattern);

    return banglaDigits ? toBanglaDigits(formatted) : formatted;
  } catch {
    return '-';
  }
};

export const getDhakaNow = (): Date => {
  return new Date();
};
