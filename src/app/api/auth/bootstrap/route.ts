import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/models/User';
import BusinessSettings from '@/models/BusinessSettings';
import Category from '@/models/Category';
import Unit from '@/models/Unit';
import { STANDARD_UNITS } from '@/lib/utils/units';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const existingOwner = await User.findOne({ role: 'OWNER' });
    if (existingOwner) {
      return NextResponse.json(
        { success: false, message: 'সিস্টেমে ইতিমধ্যে একজন মালিক (Owner) অ্যাকাউন্ট নিবন্ধিত আছে।' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, email, phone, firebaseUid, businessNameBn, address } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'নাম এবং ইমেইল প্রদান করুন।' },
        { status: 400 }
      );
    }

    // 1. Create First Owner
    const newOwner = await User.create({
      firebaseUid: firebaseUid || 'owner_uid_' + Date.now(),
      name,
      email: email.toLowerCase(),
      phone: phone || '01700000000',
      role: 'OWNER',
      active: true,
      permissions: [],
    });

    // 2. Initialize Business Settings
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({
        businessNameBn: businessNameBn || 'কৃষি বন্ধু এগ্রো স্টোর',
        businessNameEn: 'Krishi Bondhu Agro Store',
        ownerName: name,
        phone: phone || '01700000000',
        email: email.toLowerCase(),
        address: address || 'বাজার রোড, রংপুর, বাংলাদেশ',
      });
    }

    // 3. Seed Default Categories if none exist
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { nameBn: 'বীজ', nameEn: 'Seeds', sortOrder: 1 },
        { nameBn: 'সার', nameEn: 'Fertilizers', sortOrder: 2 },
        { nameBn: 'কীটনাশক', nameEn: 'Pesticides', sortOrder: 3 },
        { nameBn: 'ছত্রাকনাশক', nameEn: 'Fungicides', sortOrder: 4 },
        { nameBn: 'আগাছানাশক', nameEn: 'Herbicides', sortOrder: 5 },
        { nameBn: 'উদ্ভিদ পুষ্টি', nameEn: 'Plant Nutrients', sortOrder: 6 },
        { nameBn: 'কৃষি সরঞ্জাম', nameEn: 'Agri Equipment', sortOrder: 7 },
        { nameBn: 'সেচ সরঞ্জাম', nameEn: 'Irrigation Tools', sortOrder: 8 },
        { nameBn: 'স্প্রেয়ার', nameEn: 'Sprayers', sortOrder: 9 },
        { nameBn: 'পশু/পোল্ট্রি ফিড', nameEn: 'Animal/Poultry Feed', sortOrder: 10 },
      ];
      await Category.insertMany(defaultCategories);
    }

    // 4. Seed Standard Units if none exist
    const unitCount = await Unit.countDocuments();
    if (unitCount === 0) {
      const unitsToInsert = STANDARD_UNITS.map((u) => ({
        code: u.code,
        nameBn: u.nameBn,
        nameEn: u.nameEn,
        isBaseUnit: u.category === 'weight' ? u.code === 'kg' : u.category === 'volume' ? u.code === 'liter' : u.code === 'piece',
        baseUnit: u.baseUnit,
        conversionFactor: u.defaultConversionFactor,
      }));
      await Unit.insertMany(unitsToInsert);
    }

    return NextResponse.json({
      success: true,
      message: 'সফলভাবে প্রাথমিক সেটআপ সম্পন্ন হয়েছে।',
      owner: newOwner,
      settings,
    });
  } catch (error) {
    console.error('Error during initial bootstrap setup:', error);
    return NextResponse.json(
      { success: false, message: 'সেটআপ ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}
