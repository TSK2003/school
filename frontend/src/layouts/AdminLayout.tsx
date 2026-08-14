import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Settings,
  LogOut,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ApplicationModel, ApiResponse } from '../types';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const user = api.auth.getUser();

  useEffect(() => {
    if (!api.auth.isAuthenticated()) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // Fetch quick pending count
    api.applications.getPending().then((res: ApiResponse<ApplicationModel[]>) => {
      if (res.success && Array.isArray(res.data)) {
        setPendingCount(res.data.length);
      }
    }).catch(() => {});
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    api.auth.logout();
    navigate('/admin/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      label: 'Students',
      path: '/admin/students',
      icon: <Users className="w-4 h-4" />
    },
    {
      label: 'Pending Verification',
      path: '/admin/pending',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      label: 'Settings',
      path: '/admin/settings',
      icon: <Settings className="w-4 h-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            DV
          </div>
          <span className="font-bold text-sm text-slate-900">Admin Console</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-900 leading-tight">
                  Verification Portal
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">Staff Administrative Console</p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          <div className="px-2 py-1.5 rounded-lg bg-slate-50">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.name || 'Staff Member'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@school.com'}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
