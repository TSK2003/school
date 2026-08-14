# Student Document Collection & AI-Assisted Verification System

A fast, lightweight, maintainable monolithic web application designed for school student document submissions and administrative certificate verification assisted by Google Gemini OCR and fuzzy name matching.

---

## 🌟 Key Features

### 1. Parent / Student Submission Portal (`/student`)
- **Cascading Selection**: Choose Standard $\rightarrow$ Section $\rightarrow$ Student directly linked with school database admission profiles.
- **Certificate Uploads**: Drag-and-drop or file selection for **Aadhaar Card**, **Birth Certificate**, and **Community Certificate** (PDF, JPG, JPEG, PNG).
- **AI-Assisted OCR Analysis**: Automated extraction of candidate name, date of birth, certificate identifiers, and document quality rating.
- **Fuzzy Name Matching**: Multi-strategy token similarity and normalized edit-distance scoring against database student records (e.g. `98% Matched` or `Needs Staff Review`).
- **Review & Instant Receipt**: Confirmation summary with unique tracking identifier (`APP-2026-XXXXX`).

### 2. Staff / Admin Verification Console (`/admin`)
- **Authentication**: Role-based JWT session access for `ADMIN` and `STAFF`.
- **Metrics Dashboard**: High-density statistics including Total Students, Applications, Pending Verification Queue, Approval Rate, and Enrollment Distribution.
- **Student Directory**: Multi-criteria filtering by Standard, Section, and Application Status with responsive pagination and full application history drawer.
- **Pending Queue**: Urgent verification inbox with time tracking, document counts, and match flags.
- **Interactive Verification Workspace**: Side-by-side comparison of school records and OCR extracted data, controlled document preview stream modal, staff audit remarks (mandatory on reject), and 1-click Approval/Rejection.
- **AI & System Settings**: Real-time Gemini API connection testing, masked key management (`••••••••ABCD`), and fallback diagnostics.
- **Dark Mode**: High-contrast theme toggle with local storage persistence.

---

## 🛠 Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite (`prisma/dev.db`)
- **AI / OCR**: Google Gemini API (`@google/generative-ai`) with structured JSON schema output and intelligent demo fallback analyzer
- **Uploads**: Multer with controlled temporary file streaming
- **Auth**: JWT + Bcrypt password hashing

---

## 📁 Monorepo Architecture

```text
student-document-system/
│
├── frontend/                     # React + Vite Client
│   ├── src/
│   │   ├── components/ui/        # Button, Badge, Card, Dialog, Input, Select, etc.
│   │   ├── components/common/    # ThemeToggle, DocumentPreviewModal
│   │   ├── layouts/              # ParentLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── student/          # Multi-step StudentPortal
│   │   │   └── admin/            # Login, Dashboard, Students, Pending, Review, Settings
│   │   ├── services/             # Native fetch API client
│   │   ├── lib/                  # Theme provider & utilities
│   │   └── types/                # Shared TypeScript models
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Express + Prisma Server
│   ├── src/
│   │   ├── modules/              # auth, students, applications, documents, ocr, verification, dashboard, settings
│   │   ├── middleware/           # authMiddleware, uploadMiddleware
│   │   ├── utils/                # nameMatcher, logger
│   │   └── server.ts             # Express entrypoint & static SPA host
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # 150+ realistic students & demo applications
│   ├── uploads/                  # Controlled document file storage
│   ├── package.json
│   └── .env
│
├── scripts/
│   └── dev.js                    # Fullstack concurrent runner
├── package.json                  # Root monorepo orchestration
└── README.md
```

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@school.com` | `admin123` |
| **Staff** | `staff@school.com` | `staff123` |

*(The Admin Login page also includes 1-click demo credential fill buttons).*

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- npm `v9+`

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(or run `npm install` inside both `backend/` and `frontend/`).*

### 2. Database Migration & Seed Data
Initialize SQLite database and seed 150+ realistic students and sample applications:
```bash
npm run seed
```

### 3. Start Full-Stack Development Server
```bash
npm run dev:all
```
- **Parent Portal**: [http://localhost:5173/student](http://localhost:5173/student)
- **Admin Portal**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## ⚙️ Environment Variables

### Backend (`backend/.env`):
```env
PORT=5000
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=""
JWT_SECRET="school-verification-super-secret-key-2026"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

> **Note on Gemini API**: If `GEMINI_API_KEY` is not configured, the system automatically runs the built-in **Intelligent Fallback OCR Engine**, ensuring 100% of the demo functionality works seamlessly offline or without an API key! You can also update the key at runtime via the Admin Settings page.

---

## 📦 Production Build & Render Deployment

This project is architected to deploy as a **single Render Web Service** where Express serves both the REST API and the React single-page application.

### Build Command:
```bash
npm run build
```

### Start Command:
```bash
npm run start
```

### Render Web Service Setup:
1. **Environment**: Node
2. **Build Command**: `npm install && npm run install:all && npm run seed && npm run build`
3. **Start Command**: `npm run start`
4. **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=10000` (or Render's default port)
   - `DATABASE_URL=file:./dev.db`
   - `GEMINI_API_KEY=<your_optional_api_key>`
   - `JWT_SECRET=<your_secure_random_string>`

---

## 📋 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Staff authentication with JWT | No |
| `GET` | `/api/auth/me` | Retrieve active staff profile | Yes |
| `GET` | `/api/students/metadata/options` | Distinct Standards, Sections, AYs | No |
| `GET` | `/api/students/lookup` | Cascading students by standard & section | No |
| `GET` | `/api/students` | Filterable paginated students directory | Yes |
| `GET` | `/api/students/:id` | Individual student details & applications | Yes |
| `POST` | `/api/documents/upload` | Upload certificate file via Multer | No |
| `POST` | `/api/documents/:id/analyze` | Run Gemini OCR & Name Matcher | No |
| `GET` | `/api/documents/:id/preview` | Controlled secure document preview stream | No |
| `POST` | `/api/applications/submit` | Finalize parent application submission | No |
| `GET` | `/api/applications/pending` | List pending verification applications | Yes |
| `GET` | `/api/applications/:id` | Get full application verification details | Yes |
| `POST` | `/api/verification/:id/approve` | Approve application and child documents | Yes |
| `POST` | `/api/verification/:id/reject` | Reject application with mandatory remarks | Yes |
| `GET` | `/api/dashboard/stats` | High-level metrics & enrollment breakdown | Yes |
| `GET` | `/api/settings` | Retrieve masked API key & diagnostics | Yes |
| `PUT` | `/api/settings` | Update Gemini API configuration | Yes |
| `POST` | `/api/settings/test-connection` | Ping test Gemini API connectivity | Yes |
#   s c h o o l  
 