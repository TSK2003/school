# Student Document Collection & AI-Assisted Verification System

A fast, lightweight, maintainable monolithic web application designed for school student document submissions and administrative certificate verification assisted by Google Gemini Vision OCR.

---

## 🌐 Live Application URLs

* **Parent / Student Portal**: [https://school-qby2.onrender.com/student](https://school-qby2.onrender.com/student)
* **Staff / Admin Login Console**: [https://school-qby2.onrender.com/admin/login](https://school-qby2.onrender.com/admin/login)

---

## 🌟 Key Features

### 1. Parent / Student Submission Portal (`/student`)
- **Grade Support**: Full spectrum from **PreKG**, **LKG**, **UKG**, to **Standard 1 – 12 (XII)**.
- **Cascading Selection**: Choose Standard $\rightarrow$ Section $\rightarrow$ Student directly linked with school admission database profiles.
- **Certificate Uploads**: Upload **Aadhaar Card**, **Birth Certificate**, and **Community Certificate** (PDF, JPG, JPEG, PNG).
- **Dual AI-Assisted Verification**:
  - **Check 1: Certificate Type Verification**: Validates whether the uploaded certificate matches the requested category.
  - **Check 2: Student Name Verification**: Extracts printed text via Gemini Vision OCR and matches against admission records.
- **Instant Application Tracking**: Confirmation receipt with unique identifier (`APP-2026-XXXXX`).

### 2. Staff / Admin Verification Console (`/admin`)
- **Authentication**: Role-based JWT session access for `ADMIN` and `STAFF`.
- **Metrics Dashboard**: Statistics including Total Students, Applications, Pending Verification Queue, and Grade Distribution.
- **Student Directory**: Add new students directly from the UI, filter across PreKG to XII, view complete student history.
- **Clean Verification Queue**: Real-time review inbox for incoming parent submissions.
- **Interactive Verification Workspace**: Side-by-side entity comparison, secure document preview modal, audit remarks, and 1-click Approval/Rejection.
- **Multi-Model Gemini Engine**: Auto-switching failover chain across active Gemini models.

---

## 🛠 Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite (`prisma/dev.db`)
- **AI / OCR**: Google Gemini Vision API (`@google/generative-ai`)
- **Uploads**: Multer with controlled temporary streaming
- **Auth**: JWT + Bcrypt password hashing

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@school.com` | `admin123` |
| **Staff** | `staff@school.com` | `staff123` |

---

## 🚀 Deployment / Hosting Guide

### Option 1: Render.com (Recommended - 1-Click Monolith)

1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect your GitHub repository: `https://github.com/TSK2003/school.git`.
3. Set the following build and start configurations:
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm run install:all && npm run build && npm run seed
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
4. Add **Environment Variables** in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: `file:./dev.db`
   - `JWT_SECRET`: `your-random-jwt-secret-key-2026`
   - `GEMINI_API_KEY`: `your_google_gemini_api_key`

---

## 💻 Local Development

```bash
# 1. Install all dependencies
npm run install:all

# 2. Seed database
npm run seed

# 3. Start fullstack dev server
npm run dev:all
```
- **Student Portal**: [http://localhost:5173/student](http://localhost:5173/student)
- **Admin Portal**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)