# AgriFlow — Farmer Procurement Scheduling and Queue Management System

**SIH 26032 Project Backend Solution**

AgriFlow is a production-quality, multilingual agricultural procurement scheduling and real-time workload-aware queue management backend platform.

---

## 🌟 Core Architecture & Highlights

- **Stack**: Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO, ExcelJS.
- **Strict Rule-Based Queue Engine**: No ML/AI models. Queue waiting time is deterministically computed based on:
  $$\text{Effective Capacity} = \text{Capacity Per Hour} \times \text{Active Counters}$$
  $$\text{Estimated Waiting Minutes} = \left( \frac{\text{Total Quantity Ahead (KG)}}{\text{Effective Capacity}} \right) \times 60$$
- **Smart Departure Calculation**:
  $$\text{Recommended Departure} = \text{Estimated Turn Time} - \text{Travel Time} - \text{Safety Buffer}$$
- **Role-Based Access Control (RBAC)**: Centralized middleware enforcing 5 primary roles (`FARMER`, `PROCUREMENT_OFFICER`, `CENTRE_MANAGER`, `DISTRICT_OFFICER`, `SUPER_ADMIN`).
- **7-Stage Procurement Workflow**:
  1. Maturity Test
  2. Bags Allocation
  3. Bags Filling
  4. Bags Stitching
  5. Weight (Records actual quantity)
  6. Loading to Lorry (Records lorry number)
  7. Documents Submission (Auto-completes procurement & triggers payment)
- **Cryptographic QR System**: HMAC-SHA256 signed QR payloads for farmer arrival and stage validation.
- **Real-Time Updates**: Socket.IO room broadcasting (`farmer:{id}`, `centre:{id}`, `district:{id}`).
- **District Excel Reporting**: Multi-column Excel (`.xlsx`) & CSV export powered by `ExcelJS`.
- **Multilingual Assistance**: Localized support for English (`en`), Telugu (`te`), and Hindi (`hi`).

---

## 📁 Directory Structure

```
agriflow/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── README.md
├── .env.example
├── tests/
│   ├── auth.test.js
│   ├── queue.test.js
│   └── procurement.test.js
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    │   ├── db.js
    │   ├── env.js
    │   └── swagger.js
    ├── constants/
    │   ├── roles.js
    │   ├── stages.js
    │   └── status.js
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   ├── rateLimiter.middleware.js
    │   └── validate.middleware.js
    ├── models/
    │   ├── User.js
    │   ├── FarmerProfile.js
    │   ├── District.js
    │   ├── ProcurementCentre.js
    │   ├── Crop.js
    │   ├── CentreCapacity.js
    │   ├── Booking.js
    │   ├── Token.js
    │   ├── Counter.js
    │   ├── OfficerAssignment.js
    │   ├── Procurement.js
    │   ├── ProcurementStage.js
    │   ├── Payment.js
    │   ├── Notification.js
    │   └── AuditLog.js
    ├── services/
    │   ├── queue/
    │   ├── otp/
    │   ├── maps/
    │   ├── qr/
    │   ├── reports/
    │   └── chatbot/
    ├── socket/
    │   └── socket.handler.js
    ├── seed/
    │   └── seed.js
    ├── validators/
    │   └── schemas.js
    └── routes/
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB Server running locally on `mongodb://localhost:27017/agriflow` or MongoDB Atlas URI.

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/agriflow
JWT_SECRET=agriflow_super_secret_jwt_key_2026_sih
OTP_MODE=development
DEV_OTP=123456
MAP_PROVIDER=mock
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Seed Script (Populate Demo Data)
```bash
npm run seed
```

This seeds the exact SIH Demo Scenario for **ABC Paddy Procurement Centre**:
- Capacity: 2000 KG/hour/counter
- Active Counters: 2
- Queue: **P-001** (1000kg), **P-002** (2000kg), **P-003** (500kg), **P-004** (1500kg), **P-005** (1000kg, Demo Farmer)
- **Quantity Ahead**: 5000 KG
- **Estimated Waiting Time**: 75 Minutes

### 5. Start Server
```bash
npm run dev
```

---

## 📚 Interactive API Documentation

Access Swagger OpenAPI interactive docs at:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

Health Check:
👉 **[http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)**

---

## 🔑 Key API Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /register`: Register farmer & send OTP
- `POST /send-otp`: Request 6-digit login OTP
- `POST /verify-otp`: Verify OTP and return JWT access/refresh tokens
- `POST /login`: Initiate OTP login
- `GET  /me`: Fetch authenticated user profile

### Queue & Departure (`/api/v1/queue` & `/api/v1/farmers`)
- `GET /api/v1/farmers/me/queue`: Farmer's real-time queue position, waiting time, travel time, smart departure time, required documents, & stage progress
- `GET /api/v1/queue/:centreId`: Public/centre queue status
- `POST /api/v1/queue/recalculate/:centreId`: Force rule-based queue recalculation

### Booking & Tokens (`/api/v1/bookings`)
- `POST /`: Reserve procurement slot, generate token & initialize 7 stages
- `GET  /me`: Farmer's booking list
- `PATCH /:id/cancel`: Cancel slot & recalculate queue

### 7-Stage Procurement Workflow (`/api/v1/procurements`)
- `POST /:id/arrival`: Scan farmer Arrival QR
- `GET  /:id/stages`: Retrieve 7 stages status
- `POST /:id/stages/:stageId/complete`: Complete stage with sequential validation (Stage 5 records actual weight, Stage 6 records lorry number, Stage 7 auto-completes procurement)

### Centre Manager Operations (`/api/v1/manager` & `/api/v1/counters`)
- `GET  /manager/dashboard`: Operational metrics, processing averages, active counters
- `POST /counters/:id/open`: Open counter & auto-recalculate queue
- `POST /counters/:id/close`: Close counter & auto-recalculate queue

### District Dashboard & Excel Reports (`/api/v1/district` & `/api/v1/reports`)
- `GET /district/dashboard`: Aggregate district totals, centre performance
- `GET /reports/procurement/excel`: Download `.xlsx` spreadsheet report
- `GET /reports/procurement/csv`: Download `.csv` report

### Rule-Based Multilingual Chatbot (`/api/v1/chatbot`)
- `GET  /faqs`: Get localized FAQs (`en`, `te`, `hi`)
- `POST /message`: Ask chatbot questions with dynamic queue lookups

---

## 🧪 Testing
Run Jest integration unit tests:
```bash
npm test
```

---

## 🐳 Docker Deployment
```bash
docker compose up --build
```
