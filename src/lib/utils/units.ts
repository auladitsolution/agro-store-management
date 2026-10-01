/**
 * Unit conversion & base stock handling for agro stores
 */

export interface UnitDefinition {
  code: string;
  nameBn: string;
  nameEn: string;
  category: 'weight' | 'volume' | 'count';
  baseUnit: string;
  defaultConversionFactor: number; // Factor to multiply to get base unit
}

export const STANDARD_UNITS: UnitDefinition[] = [
  // Weight units (base: kg)
  { code: 'kg', nameBn: 'কেজি', nameEn: 'Kilogram', category: 'weight', baseUnit: 'kg', defaultConversionFactor: 1 },
  { code: 'gm', nameBn: 'গ্রাম', nameEn: 'Gram', category: 'weight', baseUnit: 'kg', defaultConversionFactor: 0.001 },
  { code: 'ton', nameBn: 'টন', nameEn: 'Ton', category: 'weight', baseUnit: 'kg', defaultConversionFactor: 1000 },
  { code: 'sack', nameBn: 'বস্তা (৫০ কেজি)', nameEn: 'Sack (50kg)', category: 'weight', baseUnit: 'kg', defaultConversionFactor: 50 },
  { code: 'bag_25', nameBn: 'বস্তা (২৫ কেজি)', nameEn: 'Sack (25kg)', category: 'weight', baseUnit: 'kg', defaultConversionFactor: 25 },

  // Volume units (base: liter)
  { code: 'liter', nameBn: 'লিটার', nameEn: 'Liter', category: 'volume', baseUnit: 'liter', defaultConversionFactor: 1 },
  { code: 'ml', nameBn: 'মিলি', nameEn: 'Milliliter', category: 'volume', baseUnit: 'liter', defaultConversionFactor: 0.001 },
  { code: 'bottle_100ml', nameBn: 'বোতল (১০০ মিলি)', nameEn: 'Bottle (100ml)', category: 'volume', baseUnit: 'liter', defaultConversionFactor: 0.1 },
  { code: 'bottle_250ml', nameBn: 'বোতল (২৫০ মিলি)', nameEn: 'Bottle (250ml)', category: 'volume', baseUnit: 'liter', defaultConversionFactor: 0.25 },
  { code: 'bottle_500ml', nameBn: 'বোতল (৫০০ মিলি)', nameEn: 'Bottle (500ml)', category: 'volume', baseUnit: 'liter', defaultConversionFactor: 0.5 },
  { code: 'bottle_1l', nameBn: 'বোতল (১ লিটার)', nameEn: 'Bottle (1L)', category: 'volume', baseUnit: 'liter', defaultConversionFactor: 1 },

  // Count / Pack units (base: piece)
  { code: 'piece', nameBn: 'পিস', nameEn: 'Piece', category: 'count', baseUnit: 'piece', defaultConversionFactor: 1 },
  { code: 'packet', nameBn: 'প্যাকেট', nameEn: 'Packet', category: 'count', baseUnit: 'piece', defaultConversionFactor: 1 },
  { code: 'box', nameBn: 'বক্স', nameEn: 'Box', category: 'count', baseUnit: 'piece', defaultConversionFactor: 1 },
  { code: 'carton', nameBn: 'কার্টন', nameEn: 'Carton', category: 'count', baseUnit: 'piece', defaultConversionFactor: 1 },
];

/**
 * Converts a quantity from a given unit to base unit
 * e.g., 10 bags of 50kg = 500 kg
 */
export const toBaseQuantity = (quantity: number, conversionFactor: number = 1): number => {
  const safeQty = Number(quantity) || 0;
  const factor = Number(conversionFactor) || 1;
  return Math.round(safeQty * factor * 10000) / 10000;
};

/**
 * Converts a base quantity to a target packaging unit
 * e.g., 500 kg base / 50 = 10 bags
 */
export const fromBaseQuantity = (baseQuantity: number, conversionFactor: number = 1): number => {
  const safeBase = Number(baseQuantity) || 0;
  const factor = Number(conversionFactor) || 1;
  if (!factor) return 0;
  return Math.round((safeBase / factor) * 10000) / 10000;
};

export const getUnitLabel = (unitCode: string): string => {
  const match = STANDARD_UNITS.find((u) => u.code === unitCode || u.nameBn === unitCode || u.nameEn === unitCode);
  return match ? match.nameBn : unitCode;
};
