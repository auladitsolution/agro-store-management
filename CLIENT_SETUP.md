# Aulad IT Solution — Agro Store Management System
## Client Onboarding & Deployment Guide (CLIENT_SETUP.md)

This documentation provides the exact step-by-step instructions for **Aulad IT Solution** engineers to deploy an independent, secure, single-tenant Agro Store instance for a new client in Bangladesh.

---

## 1. Single-Tenant Architecture Overview

Aulad IT Solution maintains **ONE Master Codebase**. Every agro-store client gets their own:
- Dedicated **MongoDB Atlas Database** (complete data isolation)
- Dedicated **Firebase Authentication Project**
- Dedicated **Cloudinary Storage Bucket**
- Dedicated Deployment & Environment Variables

No client's customer, due, product, or sales data is ever mixed with another store.

---

## 2. Step-by-Step Client Setup

### Step 1: MongoDB Atlas Database Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Project named after the client (e.g., `Client-Krishi-Bondhu`).
3. Deploy an M0 (Free Tier) or M10+ dedicated cluster in the **Asia (Mumbai or Singapore)** region for optimal latency from Bangladesh.
4. Go to **Database Access** → Add New Database User:
   - Authentication Method: Password
   - Database User Privileges: Read and Write to any database
5. Go to **Network Access** → Add IP Address:
   - Add deployment server IP (or `0.0.0.0/0` with strong password for serverless hosts).
6. Click **Connect** → **Drivers** (Node.js) and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/agro_store_client_db?retryWrites=true&w=majority
   ```

### Step 2: Firebase Authentication Setup
1. Log in to [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project (e.g., `agro-store-client-a`).
3. Under **Build** → **Authentication**, click **Get Started**.
4. Enable Sign-in Providers:
   - **Google** (Recommended for fast 1-click staff/owner sign-in)
   - **Email/Password**
5. Under **Settings** → **Authorized domains**, add the production deployment domain (e.g., `client-agro.auladit.com` or `*.vercel.app`).
6. Under **Project Settings** → **General** → **Your apps**, click Web (`</>`) and copy client credentials:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `appId`

### Step 3: Firebase Admin SDK (Server Verification)
1. In Firebase Console, navigate to **Project Settings** → **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Extract:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (ensure `\n` characters are properly escaped or enclosed in quotes).

### Step 4: Cloudinary Setup (Media & Invoices)
1. Create a free or paid account at [Cloudinary](https://cloudinary.com/).
2. From the Dashboard, copy:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)

---

## 3. Environment Variables Configuration

Create `.env.production` on the client's deployment server or enter these in Vercel / Cloud dashboard:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/agro_store_client?retryWrites=true&w=majority
MONGODB_DB_NAME=agro_store_client

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=client-agro.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=client-agro
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=client-agro.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

FIREBASE_PROJECT_ID=client-agro
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@client-agro.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

CLOUDINARY_CLOUD_NAME=client-agro
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_secret_here

NEXT_PUBLIC_APP_NAME="কৃষি বন্ধু এগ্রো স্টোর"
NEXT_PUBLIC_APP_URL=https://agro-client.auladit.com
OWNER_EMAIL=owner@agrostore.com
```

---

## 4. Initial Owner Bootstrap & Seeding

1. Open the application URL at `/setup` (e.g. `https://agro-client.auladit.com/setup`).
2. Enter the Owner's full name, email, phone number, and shop name in Bangla.
3. Click **"প্রাথমিক সেটআপ সম্পন্ন করুন"**.
   - This automatically seeds all standard agricultural categories (বীজ, সার, কীটনাশক, ছত্রাকনাশক, ইত্যাদি).
   - Configures standard packaging units (কেজি, লিটার, বস্তা, বোতল, ইত্যাদি).
   - Creates the protected Super Admin / Owner account.
4. Once completed, `/setup` is automatically sealed from public registration.

---

## 5. Deployment Options

### Option A: Vercel (Recommended for Serverless)
1. Fork or push the Master Codebase to GitHub/GitLab.
2. Import repository in Vercel.
3. Add environment variables listed above.
4. Click **Deploy**.

### Option B: VPS / Dedicated Server with PM2 & Nginx (Ubuntu / Debian)
```bash
# 1. Clone repository
git clone <repo_url> /var/www/agro-client
cd /var/www/agro-client

# 2. Install dependencies & build
npm install
npm run build

# 3. Start with PM2
pm2 start npm --name "agro-client" -- start -- -p 3000
pm2 save
pm2 startup
```

---

## 6. Post-Deployment Verification Checklist

- [ ] Log in with Owner credentials.
- [ ] Visit **ড্যাশবোর্ড** and verify KPI cards load without errors.
- [ ] Create a test product with batch tracking and expiry date.
- [ ] Record a Supplier Purchase and verify stock increments.
- [ ] Complete a POS sale with cash and print a test receipt (58mm/80mm).
- [ ] Record a due sale to a customer and verify customer ledger updates.
- [ ] Test **বাকি আদায়** and verify ledger balance decreases.
- [ ] Check **রিপোর্ট ও লাভ** and verify true profit calculations.
- [ ] Export products and sales to CSV.
