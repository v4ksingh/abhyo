# 🎓 MockTest LMS — Full-Stack Learning Management System

A production-ready LMS platform for mock tests and coaching institute management, built with React + Tailwind CSS + Node.js + MySQL.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm 9+

### 1. Clone & Install

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy server environment file
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secrets, etc.
```

### 3. Seed Database

```bash
cd server && npm run seed
```

**Default credentials after seeding:**
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@mocktest.com | Admin@123 |
| Institute | institute@mocktest.com | Inst@123 |
| Student | priya@student.com | Student@123 |

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd server && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client && npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

---

## 🏗️ Project Structure

```
mocktest/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   └── layout/     # DashboardLayout
│   │   ├── lib/            # API client (axios)
│   │   ├── pages/
│   │   │   ├── admin/      # Admin panel pages
│   │   │   ├── auth/       # Login, Register, OTP
│   │   │   ├── institute/  # Institute pages
│   │   │   ├── shared/     # Profile, Notifications, Plans
│   │   │   └── student/    # Student pages + TestInterface
│   │   └── store/          # Zustand auth store
│   └── tailwind.config.js
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── middlewares/    # Auth, upload, error handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── seeders/        # Database seeder
│   │   └── utils/          # Email, SMS utilities
│   └── .env
│
└── package.json
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with email/mobile + password |
| POST | /api/auth/send-otp | Send OTP to mobile/email |
| POST | /api/auth/verify-otp | Verify OTP and get token |
| POST | /api/auth/refresh-token | Refresh JWT token |
| POST | /api/auth/forgot-password | Send reset link |
| GET | /api/auth/me | Get current user |

### Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tests | List tests (public) |
| GET | /api/tests/:id | Get test details |
| POST | /api/tests | Create test (admin) |
| PUT | /api/tests/:id | Update test (admin) |
| DELETE | /api/tests/:id | Delete test (admin) |
| GET | /api/tests/:id/start | Start test session (student) |
| POST | /api/tests/:id/submit | Submit test (student) |
| GET | /api/tests/:id/leaderboard | Get leaderboard |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Dashboard stats |
| GET | /api/admin/institutes | List all institutes |
| PATCH | /api/admin/institutes/:id/approve | Approve institute |
| PATCH | /api/admin/institutes/:id/reject | Reject institute |
| GET | /api/admin/revenue | Revenue analytics |

### Institute
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/institute/dashboard | Institute dashboard |
| POST | /api/institute/students/add | Add student |
| POST | /api/institute/students/bulk-upload | Bulk CSV upload |
| POST | /api/institute/batches | Create batch |
| POST | /api/institute/batches/:id/assign-test | Assign test to batch |

---

## 📊 Database Models

- **User** — roles: superadmin, institute, student
- **Institute** — subscription plans, branding, stats
- **Batch** — student groups with assigned tests
- **Test** — questions, sections, negative marking, scheduling
- **Question** — MCQ with bilingual support, explanations
- **Result** — detailed response tracking, rankings, subject analytics
- **Payment** — Razorpay integration for subscriptions and test purchases
- **Notification** — in-app notification system

---

## 💡 Key Features

### Test Engine
- ✅ Real-time timer with auto-submit
- ✅ Question navigator with status indicators (answered, review, skipped)
- ✅ Negative marking support
- ✅ Question shuffling
- ✅ Section-wise organization
- ✅ Mark for review functionality

### Analytics
- ✅ Subject-wise accuracy tracking
- ✅ Global and institute rankings
- ✅ Percentile calculation
- ✅ Weak area detection
- ✅ Performance trend charts

### Institute Features
- ✅ Student batch management
- ✅ Bulk CSV upload
- ✅ Test assignment with deadlines
- ✅ Invite link system
- ✅ Student performance drill-down

---

## 🚀 Deployment

### Backend (VPS/Railway/Render)
```bash
cd server
NODE_ENV=production npm start
```

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy dist/ folder to Vercel
```

### Environment Variables for Production
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-secret>
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
TWILIO_ACCOUNT_SID=...
EMAIL_USER=...
```

---

## 💰 Subscription Plans

| Plan | Price | Students | Batches |
|------|-------|----------|---------|
| Free | ₹0/mo | 50 | 3 |
| Basic | ₹1,999/mo | 200 | 10 |
| Pro | ₹4,999/mo | 1,000 | 50 |
| Enterprise | ₹9,999/mo | Unlimited | Unlimited |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3, Zustand, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL, Sequelize |
| Auth | JWT, bcrypt, OTP via Twilio |
| Payments | Razorpay |
| Real-time | Socket.IO |
| File Upload | Multer |
| Email | Nodemailer |

---

*Built for India's competitive exam ecosystem — SSC, Banking, UPSC, Railway, Defence, Engineering & Medical*
