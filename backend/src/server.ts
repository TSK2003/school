import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './modules/auth/authRoutes.js';
import studentRoutes from './modules/students/studentRoutes.js';
import documentRoutes from './modules/documents/documentRoutes.js';
import applicationRoutes from './modules/applications/applicationRoutes.js';
import verificationRoutes from './modules/verification/verificationRoutes.js';
import dashboardRoutes from './modules/dashboard/dashboardRoutes.js';
import settingsRoutes from './modules/settings/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temporary uploads directory exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS setup (Support local dev and same-origin production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

// Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger for API calls
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Health check (Point 19)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'Student Document Verification System',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Static hosting for Frontend production build with multi-path resolution
const possibleFrontendPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist')
];
const frontendDist = possibleFrontendPaths.find(p => fs.existsSync(p)) || possibleFrontendPaths[0];

if (fs.existsSync(frontendDist)) {
  console.log(`[Static] Serving React SPA build from: ${frontendDist}`);
  app.use(express.static(frontendDist));

  // SPA fallback for non-API routes (survives direct refresh on /student, /admin, etc.)
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  console.warn(`[Static] Frontend dist not found. Checked:`, possibleFrontendPaths);
}

// Global API 404 handler
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

// Global Error Handler (Sanitizes errors, no stack trace leaks)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err?.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Startup Validation & Launch
app.listen(PORT, () => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  console.log(`
=====================================================
  School Document Verification System (Monolith)
  Running on: http://localhost:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Static SPA: ${fs.existsSync(frontendDist) ? 'Active' : 'Disabled (Run npm run build:frontend)'}
  Gemini AI: ${hasGeminiKey ? 'Configured via Environment' : 'Demo Fallback Engine Active'}
=====================================================
  `);
});
