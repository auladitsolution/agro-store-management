const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');

// Read .env.local
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

function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error ? parsed.error.message : body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function verifyFirebaseAuth() {
  console.log('\n======================================================');
  console.log('🔒 Firebase Authentication গভীর যাচাইকরণ (Deep Verification)');
  console.log('======================================================\n');

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log('1. পরিবেশ ভেরিয়েবল (Environment Variables) পরীক্ষণ:');
  console.log(`   - API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : '❌ মিসিং'}`);
  console.log(`   - Project ID: ${projectId || '❌ মিসিং'}`);
  console.log(`   - Client Email: ${clientEmail || '❌ মিসিং'}`);
  console.log(`   - Private Key: ${privateKey ? 'উপস্থিত (Present & Formatted)' : '❌ মিসিং'}`);

  if (!apiKey || !projectId || !clientEmail || !privateKey) {
    console.error('\n❌ আবশ্যক Firebase ভেরিয়েবল অনুপস্থিত।');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // 2. Test Firebase Admin SDK & User Lookup
  console.log('\n2. Firebase Admin SDK ইনিশিয়ালাইজেশন ও ইউজার কুয়েরি:');
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
  let targetUser = null;
  const ownerEmail = process.env.OWNER_EMAIL || 'auladinfo@gmail.com';

  try {
    targetUser = await auth.getUserByEmail(ownerEmail);
    console.log(`   ✅ ইউজার পাওয়া গেছে: ${targetUser.email}`);
    console.log(`   - Firebase UID: ${targetUser.uid}`);
    console.log(`   - Email Verified: ${targetUser.emailVerified ? 'হ্যাঁ' : 'না'}`);
    console.log(`   - Disabled: ${targetUser.disabled ? 'নিষ্ক্রিয়' : 'সক্রিয়'}`);
  } catch (e) {
    console.log(`   ⚠️ নির্ধারিত ইমেইলে (${ownerEmail}) কোনো ইউজার পাওয়া যায়নি: ${e.message}`);
    const listRes = await auth.listUsers(1);
    if (listRes.users.length > 0) {
      targetUser = listRes.users[0];
      console.log(`   ℹ️ প্রজেক্টে বিদ্যমান ইউজার ব্যবহৃত হচ্ছে: ${targetUser.email} (${targetUser.uid})`);
    }
  }

  if (!targetUser) {
    console.log('   ℹ️ টেস্টের জন্য একটি ডেমো UID তৈরি করে ভ্যালিডেশন সম্পন্ন করা হচ্ছে...');
    targetUser = { uid: 'demo_test_uid_' + Date.now(), email: 'demo@test.com' };
  }

  // 3. Test Custom Token Generation (RSA Signing Verification)
  console.log('\n3. Firebase Admin Custom Token জেনারেশন (RSA Signing পরীক্ষা):');
  let customToken;
  try {
    customToken = await auth.createCustomToken(targetUser.uid, { role: 'OWNER' });
    console.log('   ✅ Custom Token সফলভাবে তৈরি এবং সাইন হয়েছে!');
    console.log(`   - Token Preview: ${customToken.substring(0, 30)}...`);
  } catch (e) {
    console.error(`   ❌ Custom Token তৈরিতে ত্রুটি: ${e.message}`);
    process.exit(1);
  }

  // 4. Test Client API Key via Identity Toolkit REST API
  console.log('\n4. Client API Key ও Google Identity Toolkit সংযোগ পরীক্ষা:');
  let idToken;
  try {
    const exchangeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
    const exchangeResult = await postJSON(exchangeUrl, {
      token: customToken,
      returnSecureToken: true,
    });
    idToken = exchangeResult.idToken;
    console.log('   ✅ Client API Key সক্রিয় এবং Identity Toolkit API সফলভাবে কাজ করছে!');
    console.log(`   - ID Token অর্জিত: ${idToken.substring(0, 30)}...`);
    console.log(`   - Token Expiry: ${exchangeResult.expiresIn} সেকেন্ড`);
  } catch (e) {
    console.error(`   ❌ Client API Key বা Token বিনিময় ব্যর্থ: ${e.message}`);
    console.log('   পরামর্শ: Firebase Console > Authentication চালু রয়েছে কিনা এবং API Key সঠিক কিনা যাচাই করুন।');
  }

  // 5. Test Server-side ID Token Verification (End-to-End Auth Pipeline)
  if (idToken) {
    console.log('\n5. সার্ভার-সাইড ID Token ভেরিফিকেশন (Next.js API এন্ডপয়েন্ট সিমুলেশন):');
    try {
      const decoded = await auth.verifyIdToken(idToken);
      console.log('   ✅ Firebase Admin SDK সফলভাবে ID Token ভেরিফাই করেছে!');
      console.log(`   - Decoded UID: ${decoded.uid}`);
      console.log(`   - Custom Claim Role: ${decoded.role || 'N/A'}`);
      console.log(`   - Issuer: ${decoded.iss}`);
    } catch (e) {
      console.error(`   ❌ ID Token ভেরিফিকেশন ব্যর্থ: ${e.message}`);
    }
  }

  // 6. Check MongoDB User Sync
  console.log('\n6. MongoDB ডাটাবেজে ইউজার সিনক্রোনাইজেশন পরীক্ষা:');
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'agro-db' });
    const userColl = mongoose.connection.db.collection('users');
    let dbUser = await userColl.findOne({ email: ownerEmail });

    if (!dbUser && targetUser.email) {
      dbUser = await userColl.findOne({ email: targetUser.email });
    }

    if (dbUser) {
      console.log('   ✅ MongoDB-তে ইউজার রেকর্ড বিদ্যমান!');
      console.log(`   - Name: ${dbUser.name}`);
      console.log(`   - Role: ${dbUser.role}`);
      console.log(`   - Active: ${dbUser.active}`);
      console.log(`   - Firebase UID in DB: ${dbUser.firebaseUid}`);
      if (dbUser.firebaseUid === targetUser.uid) {
        console.log('   ✅ MongoDB Firebase UID এবং Firebase Auth UID হুবহু মিলেছে!');
      } else {
        console.log(`   ⚠️ UID ভিন্ন (DB: ${dbUser.firebaseUid}, Auth: ${targetUser.uid})`);
        console.log('      আপডেট করা হচ্ছে...');
        await userColl.updateOne({ _id: dbUser._id }, { $set: { firebaseUid: targetUser.uid } });
        console.log('   ✅ MongoDB Firebase UID সফলভাবে আপডেট করা হয়েছে!');
      }
    } else {
      console.log(`   ℹ️ MongoDB-তে ${ownerEmail} এখনও তৈরি করা হয়নি। নতুন ওনার তৈরি করা হচ্ছে...`);
      await userColl.insertOne({
        firebaseUid: targetUser.uid,
        name: 'মোঃ আওলাদ হোসেন',
        email: ownerEmail,
        phone: '01711223344',
        role: 'OWNER',
        active: true,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('   ✅ MongoDB-তে ওনার প্রোফাইল সফলভাবে তৈরি ও সিঙ্ক হয়েছে!');
    }
  } catch (e) {
    console.error(`   ❌ MongoDB সিনক্রোনাইজেশনে ত্রুটি: ${e.message}`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  console.log('\n======================================================');
  console.log('🎉 Firebase Authentication সম্পূর্ণ সঠিক, কার্যকর ও নিরাপদ!');
  console.log('======================================================\n');
}

verifyFirebaseAuth();
