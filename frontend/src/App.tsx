import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';

// Layouts
import { ParentLayout } from './layouts/ParentLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Parent Portal
import { StudentPortal } from './pages/student/StudentPortal';

// Admin Portal
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentsDirectory } from './pages/admin/StudentsDirectory';
import { PendingVerification } from './pages/admin/PendingVerification';
import { ApplicationReview } from './pages/admin/ApplicationReview';
import { SettingsPage } from './pages/admin/SettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/student" replace />} />

          {/* Parent / Student Portal */}
          <Route path="/student" element={<ParentLayout />}>
            <Route index element={<StudentPortal />} />
          </Route>

          {/* Staff Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin / Staff Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<StudentsDirectory />} />
            <Route path="pending" element={<PendingVerification />} />
            <Route path="applications/:id" element={<ApplicationReview />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
