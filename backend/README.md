# MandiMithra Backend
## Smart Procurement Queue & Tracking Platform for Farmers

MandiMithra is a production-grade Node.js/Express.js backend for scheduling farmer produce procurement, calculating quantity-aware queue wait times and travel-aware departure recommendations, enforcing a strict multi-tier administrative approval hierarchy, tracking 7 sequential procurement stages via QR validation, emitting real-time updates via Socket.IO, and generating district-level Excel/CSV reports.

---

## 🚀 Key Features

1. **Role-Based Access Control (RBAC) & Hierarchy**:
   - `FARMER`: Public registration with automatic approval (`APPROVED`).
   - `CENTER_OPERATOR`: Assigned to a centre. Submitted as `PENDING`, approved by assigned `CENTER_MANAGER`.
   - `CENTER_MANAGER`: Assigned to a centre/district. Submitted as `PENDING`, approved by responsible `DISTRICT_ADMIN`.
   - `DISTRICT_ADMIN`: Responsible for a district. Submitted as `PENDING`, approved by `SUPER_ADMIN`.
   - `SUPER_ADMIN`: Administrative master user created exclusively via secure database seeding (`npm run seed:superadmin`). No public signup.

2. **Quantity-Aware Queue Engine**:
   - Computes workload ahead as $\sum (\text{expected quantity of eligible farmers ahead})$.
   - Calculates effective centre processing capacity based on active counters ($\text{defaultCapacity} \times \text{activeCounters}$).
   - Derives estimated waiting minutes: $(\text{totalQuantityAhead} / \text{effectiveCapacity}) \times 60$.
   - Automatically recalculates on every queue event (booking, arrival, stage completion, capacity change, counter change).

3. **Travel-Aware Smart Departure**:
   - Integrates route calculation abstractions:
     $$\text{Estimated Turn Time} = \text{Current Time} + \text{Estimated Wait Minutes}$$
     $$\text{Recommended Departure} = \text{Estimated Turn Time} - \text{Travel Time} - \text{Safety Buffer}$$

4. **7-Stage Procurement Workflow & QR Verification**:
   - Enforces strict sequential ordering across 7 stages:
     1. Maturity Test
     2. Bags Allocation
     3. Bags Filling
     4. Bags Stitching
     5. Weight
     6. Loading to Lorry
     7. Documents Submission
   - Validates opaque QR tokens, expiry, centre context, officer permissions, and duplicate scan protection.

5. **Reporting & Auditing**:
   - Excel (`.xlsx`) and CSV report export for district-level procurement aggregations.
   - Comprehensive audit logging (`AuditLog`) for administrative actions, QR scans, and status changes.

6. **Rule-Based Multi-Language Chatbot**:
   - Pure rule-based query resolution in English (`en`), Telugu (`te`), and Hindi (`hi`) without external AI/ML dependencies.

---

## 🛠️ Project Structure

```
backend/
├── src/
│   ├── config/          # Environment & Database Configuration
│   ├── constants/       # Role, Status & Stage Constants
│   ├── controllers/     # Thin Controller Handlers
│   ├── jobs/            # Background Maintenance & Job Scheduling
│   ├── middleware/      # Auth, Rate Limiting, Error & Validation Middleware
│   ├── models/          # Mongoose Schemas (User, ApprovalRequest, Booking, Procurement, etc.)
│   ├── routes/          # Express API Route Definition
│   ├── seed/            # Development Data Seeding
│   ├── services/        # Business Logic (Auth, Approvals, Queue, Reports, QR, OTP, Maps)
│   ├── socket/          # Socket.IO Realtime Event Emission
│   ├── sockets/         # Socket Exports
│   ├── utils/           # Helper Utilities & Custom Errors
│   ├── validators/      # Zod Request Validation Schemas
│   └── app.js           # Express App Configuration
├── scripts/
│   └── seedSuperAdmin.js # Idempotent Super Admin Database Seed Script
├── tests/               # Jest Unit & Integration Test Suite
├── .env                 # Environment Configuration
├── .env.example         # Example Environment Variables Template
├── package.json         # Dependencies & NPM Scripts
└── README.md            # Setup & Architecture Documentation
```

---

## ⚙️ Environment Configuration (`.env`)

Copy `.env.example` to `.env` and configure:

```ini
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/mandimithra

# Authentication & JWT
JWT_SECRET=mandimithra_super_secret_jwt_key_2026
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=mandimithra_refresh_super_secret_key_2026
JWT_REFRESH_EXPIRES_IN=7d

# Client Configuration
CLIENT_URL=http://localhost:5173

# OTP Configuration
OTP_MODE=development
DEV_OTP=123456
OTP_EXPIRY_MINUTES=5
OTP_RESEND_SECONDS=60

# Travel & Maps Integration
MAP_PROVIDER=mock
GOOGLE_MAPS_API_KEY=

# System Defaults
DEFAULT_LANGUAGE=en
QUEUE_SAFETY_BUFFER_MINUTES=10

# Super Admin Initial Credentials (Seeding)
SUPER_ADMIN_NAME=Super Administrator
SUPER_ADMIN_EMAIL=superadmin@mandimithra.gov.in
SUPER_ADMIN_PHONE=9999900000
SUPER_ADMIN_PASSWORD=SuperAdmin@123456
```

---

## 🏁 Quickstart Setup & Seeding Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Super Admin Account
Run the idempotent Super Admin database seed script:
```bash
npm run seed:superadmin
```

### 3. Seed Development / Demo Data (Districts, Centres, Samples)
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🧪 Running Automated Tests

Run the complete Jest test suite covering authorization rules, approval hierarchy enforcement, public signup restrictions, QR validation, stage order, queue calculations, and report generation:

```bash
npm test
```

---

## 📑 Core REST API Endpoints

### 1. Authentication & Registration
- `POST /api/auth/register/farmer` - Farmer self-registration (Auto-approved).
- `POST /api/auth/register/staff` - Staff registration request (`PENDING` status; requires approval).
- `POST /api/auth/login` - User login (Enforces `PENDING`/`REJECTED`/`SUSPENDED` account status checks).
- `POST /api/auth/send-otp` - Request OTP.
- `POST /api/auth/verify-otp` - Verify OTP & obtain JWT tokens.
- `GET /api/auth/me` - Fetch active authenticated user profile.

### 2. Administrative Approvals
- `GET /api/approvals/centre-managers` - District Admin retrieves pending Centre Manager requests for their district.
- `GET /api/approvals/centre-operators` - Centre Manager retrieves pending Centre Operator requests for their centre.
- `GET /api/approvals/district-admins` - Super Admin retrieves pending District Admin requests.
- `PATCH /api/approvals/:id/approve` - Approve staff request.
- `PATCH /api/approvals/:id/reject` - Reject staff request with reason.

### 3. Queue & Travel Engine
- `GET /api/queue/centre/:id` - Fetch live centre queue position & workload estimates.
- `POST /api/queue/recalculate/:centreId` - Force queue estimate recalculation.

### 4. Procurement Stages & QR Scans
- `GET /api/procurements/:id/stages` - Fetch 7 procurement stages status.
- `POST /api/procurements/:id/arrival` - Officer verifies Arrival QR.
- `POST /api/procurements/:id/stages/:stageId/complete` - Complete stage N (requires stage N-1 to be completed).

### 5. District Reporting
- `GET /api/reports/district/excel` - Export district procurement Excel report.
- `GET /api/reports/district/csv` - Export district procurement CSV report.
