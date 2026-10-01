const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const firstEq = trimmed.indexOf('=');
      if (firstEq > -1) {
        const key = trimmed.substring(0, firstEq).trim();
        let val = trimmed.substring(firstEq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

async function verifyAll() {
  const results = {
    mongodb: { status: 'PENDING', message: '', details: null },
    cloudinary: { status: 'PENDING', message: '', details: null },
    firebase: { status: 'PENDING', message: '', details: null },
  };

  console.log('\n======================================================');
  console.log('🔍 এগ্রো স্টোর সংযোগ পরীক্ষা শুরু হচ্ছে...');
  console.log('======================================================\n');

  // 1. MONGODB ATLAS VERIFICATION
  try {
    process.stdout.write('1. MongoDB Atlas সংযোগ পরীক্ষা হচ্ছে... ');
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'agro-db';

    if (!mongoUri) {
      throw new Error('MONGODB_URI পরিবেশ ভেরিয়েবল সেট করা নেই');
    }

    await mongoose.connect(mongoUri, { dbName });
    const adminDb = mongoose.connection.db.admin();
    const pingResult = await adminDb.ping();

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Count products & batches
    const productCount = collectionNames.includes('products') 
      ? await mongoose.connection.db.collection('products').countDocuments() 
      : 0;
    const batchCount = collectionNames.includes('batches') 
      ? await mongoose.connection.db.collection('batches').countDocuments() 
      : 0;

    results.mongodb = {
      status: 'SUCCESS',
      message: 'MongoDB Atlas সফলভাবে সংযুক্ত হয়েছে!',
      details: {
        databaseName: dbName,
        ping: pingResult.ok === 1 ? 'OK' : 'Unknown',
        totalCollections: collections.length,
        collections: collectionNames,
        productsCount: productCount,
        batchesCount: batchCount,
      }
    };
    console.log('✅ সফল (Connected)');
  } catch (err) {
    results.mongodb = {
      status: 'FAILED',
      message: 'MongoDB Atlas সংযোগ ব্যর্থ হয়েছে',
      details: err.message,
    };
    console.log(`❌ ব্যর্থ: ${err.message}`);
  }

  // 2. CLOUDINARY VERIFICATION
  try {
    process.stdout.write('2. Cloudinary সংযোগ পরীক্ষা হচ্ছে... ');
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary কনফিগারেশন ভেরিয়েবল (Cloud Name, API Key, Secret) অসম্পূর্ণ');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const pingRes = await cloudinary.api.ping();
    const usageRes = await cloudinary.api.usage().catch(() => null);

    results.cloudinary = {
      status: 'SUCCESS',
      message: 'Cloudinary সফলভাবে সংযুক্ত এবং প্রস্তুত!',
      details: {
        cloudName,
        ping: pingRes.status || 'OK',
        plan: usageRes ? usageRes.plan : 'Active',
        storageUsedBytes: usageRes && usageRes.storage ? usageRes.storage.usage : 'N/A',
      }
    };
    console.log('✅ সফল (Connected & Active)');
  } catch (err) {
    results.cloudinary = {
      status: 'FAILED',
      message: 'Cloudinary সংযোগ ব্যর্থ হয়েছে',
      details: err.message,
    };
    console.log(`❌ ব্যর্থ: ${err.message}`);
  }

  // 3. FIREBASE VERIFICATION
  try {
    process.stdout.write('3. Firebase Admin SDK & Authentication সংযোগ পরীক্ষা হচ্ছে... ');
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin কনফিগারেশন (Project ID, Client Email, Private Key) অসম্পূর্ণ');
    }

    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Initialize Firebase Admin using modular API
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');

    const app = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      : getApps()[0];

    const auth = getAuth(app);
    // Test auth service by listing users
    const userList = await auth.listUsers(5);

    results.firebase = {
      status: 'SUCCESS',
      message: 'Firebase Admin SDK এবং Authentication সফলভাবে সংযুক্ত!',
      details: {
        projectId,
        clientEmail,
        totalUsersInProject: userList.users.length,
        users: userList.users.map(u => ({ email: u.email, uid: u.uid, disabled: u.disabled })),
      }
    };
    console.log(`✅ সফল (Connected, ${userList.users.length} users found)`);
  } catch (err) {
    results.firebase = {
      status: 'FAILED',
      message: 'Firebase সংযোগ ব্যর্থ হয়েছে',
      details: err.message,
    };
    console.log(`❌ ব্যর্থ: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log('📋 সামগ্রিক সংযোগ সারসংক্ষেপ (Summary Report):');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

verifyAll();
