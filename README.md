# এগ্রো স্টোর ম্যানেজমেন্ট সিস্টেম (Agro Store Management System)
### Developed for Aulad IT Solution — Bangladesh

A production-grade, commercial web application designed specifically for agricultural input retail and wholesale stores in Bangladesh (selling seeds, fertilizers, pesticides, fungicides, sprayers, irrigation tools, and farming supplies).

---

## 🌾 Key Business Capabilities

1. **Complete Commercial Workflow**:
   - `Supplier → Purchase → Batch/Lot → Stock Increment → Sales POS → Payment/Due → Customer Ledger → Stock Deduction → Expenses → True Profit → Financial Reports`
2. **FEFO (First Expire, First Out) & Expiry Management**:
   - Batch tracking for agrochemicals and seeds with manufacturing & expiry dates.
   - Automatic FEFO recommendation; strict server-side blocking of expired batches from normal sale.
   - Configurable 30, 60, and 90-day expiry warning alerts.
3. **Bangla Agro Packaging & Unit Conversions**:
   - Standard units: কেজি (kg), গ্রাম (gm), টন (ton), লিটার (liter), মিলি (ml), বস্তা (bag/sack - 50kg/25kg), বোতল (bottle), প্যাকেট (packet), কার্টন (carton).
   - Deterministic base quantity tracking preventing rounding drift.
4. **Touch & Barcode Scanner-Ready POS**:
   - Lightning-fast counter POS with keyboard-emulating barcode scanner listener.
   - Retail (খুচরা) and Wholesale (পাইকারি) dual-tier pricing.
   - 1-click Cash Customer mode or real customer search by phone.
   - Mixed payments (Cash, bKash, Nagad, Rocket, Bank).
   - Customer credit limit checks & override safeguards.
5. **Double-Entry Style Traceable Ledgers**:
   - **Customer Ledger**: Every sale, payment, or return maintains a running balance.
   - **Supplier Ledger**: Every purchase, supplier payment, or return remains reconcilable.
   - **Stock Movements**: Every stock change (Purchase, Sale, Return, Damage, Adjustment) is logged with previous and new stock.
6. **Financial Accuracy & True Profit Calculation**:
   - Paisa-level integer rounding avoiding JavaScript floating-point errors.
   - Gross Profit = Sales Revenue − Cost of Goods Sold (using actual purchased batch cost snapshot, not current retail price).
   - Net Profit = Gross Profit − Store Operating Expenses.
7. **Daily Cash Register / Shift Management**:
   - Opening cash recording, real-time inflow/outflow monitoring, closing cash counting, and discrepancy calculation (উদ্বৃত্ত / ঘাটতি).
8. **Thermal & Standard Print Invoices**:
   - Print-ready CSS for 58mm thermal, 80mm thermal, and standard A4 invoices with Bangla typography.
9. **Single-Tenant Multi-Client Architecture**:
   - One master codebase easily deployable for unlimited individual clients with isolated MongoDB, Firebase, and Cloudinary configurations.
10. **Feature Flags**:
    - Easily toggle features (batchTracking, barcode, wholesale, cashRegister, etc.) to sell Basic, Standard, or Premium tiers from one codebase.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Hind Siliguri Google Bengali Font Optimization
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: Firebase Client SDK + Firebase Admin SDK (Server-Side Token Verification)
- **Validation**: Zod (100% Server & Client Validation)
- **State & Data**: React Hook Form + TanStack Table
- **Charts & UI**: Recharts + Lucide React + Sonner Toasts
- **Testing**: Vitest (18 automated tests passing for financials, FEFO, unit conversion, and RBAC)

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- MongoDB database (local or Atlas)

### 2. Clone and Install
```bash
git clone <repository-url>
cd agro-store-management
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and add your credentials:
```bash
cp .env.example .env.local
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 6. Initial Store Setup
- Go to `http://localhost:3000/setup` to bootstrap the first Owner and seed categories and units.
- Alternatively, on the dashboard click **"ডেমো ডাটা লোড করুন"** to populate realistic sample data for *"কৃষি বন্ধু এগ্রো স্টোর"*.

---

## 🧪 Automated Test Suite

Run all business logic and financial calculation tests:
```bash
npm test
```

Tests verify:
- Safe money multiplication, addition, and division without float drift
- Unit conversions (e.g. 10 bags of 50kg = 500kg base)
- FEFO batch sorting and expired batch blocking
- RBAC permissions (Owner full access vs Cashier restrictions)
- POS cart calculation, mixed payments, change calculation
- Customer credit limit breach detection
- True profit calculation based on batch cost basis
- Daily cash register expected cash and discrepancy calculations

---

## 📄 Client Onboarding & Deployment

For instructions on deploying a dedicated instance for a new agro store client, refer to:
👉 [CLIENT_SETUP.md](file:///E:/Business_Project/agro-store-management/CLIENT_SETUP.md)

---

## 🔒 Security Principles

- Server-side token verification using Firebase Admin SDK.
- Strict server-side Role-Based Access Control (RBAC) preventing unauthorized access to financial reports or settings.
- Immutable historical transactions: financial and inventory movements are never permanently deleted through normal UI.
- All sensitive operations (price change, stock adjustment, expired product override) produce an immutable `AuditLog` entry.

---

**Developed with ❤️ by Aulad IT Solution**
