import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const ParentLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/student" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Student Document Portal
              </span>
              <span className="ml-1 text-xs text-blue-600 font-medium">
                AI Verification
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Staff Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* Footer without school name */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Student Document Collection & AI-Assisted Verification System</p>
      </footer>
    </div>
  );
};
