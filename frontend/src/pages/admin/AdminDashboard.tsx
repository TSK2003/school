import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Users,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = () => {
    setIsLoading(true);
    api.dashboard.getStats()
      .then(res => {
        if (res.success && res.data) {
          setStats(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {
    totalStudents: 0,
    totalApplications: 0,
    pendingVerification: 0,
    verified: 0,
    rejected: 0,
    avgMatchRate: 0
  };

  const metricCards = [
    {
      title: 'Total Students',
      value: overview.totalStudents,
      description: 'Enrolled in Standards 6–10',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50'
    },
    {
      title: 'Total Applications',
      value: overview.totalApplications,
      description: 'Submitted across all terms',
      icon: <FileCheck2 className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50'
    },
    {
      title: 'Pending Verification',
      value: overview.pendingVerification,
      description: 'Awaiting administrative review',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
      highlight: true
    },
    {
      title: 'Verified & Approved',
      value: overview.verified,
      description: 'Completed verifications',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50'
    },
    {
      title: 'Rejected Submissions',
      value: overview.rejected,
      description: 'Remarked for re-upload',
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50'
    },
    {
      title: 'AI Verification',
      value: 'Enabled',
      description: 'Automated OCR & Name Check',
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Verification Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Overview of student document collection, AI analysis, and staff verification status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link to="/admin/pending">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Pending Queue ({overview.pendingVerification})
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map((m, i) => (
          <Card key={i} className={`p-4 ${m.highlight ? 'border-amber-300' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${m.bg}`}>{m.icon}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-2xl font-bold text-slate-900">
                {m.value}
              </span>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {m.title}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{m.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standards Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Enrollment by Standard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.standardsBreakdown.map(std => {
              const max = 35;
              const pct = Math.round((std.count / max) * 100);
              return (
                <div key={std.standard} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{std.standard}</span>
                    <span className="font-semibold text-slate-900">{std.count} students</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Applications</CardTitle>
            <Link
              to="/admin/pending"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Application #</th>
                    <th className="px-4 py-2.5 font-semibold">Student Name</th>
                    <th className="px-4 py-2.5 font-semibold">Class</th>
                    <th className="px-4 py-2.5 font-semibold">AI Match Status</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.recentApplications && stats.recentApplications.length > 0 ? (
                    stats.recentApplications.map(app => {
                      const docs = app.documents || [];
                      const hasMismatch = docs.some(d => d.status === 'MISMATCH' || (d.matchScore !== null && d.matchScore !== undefined && d.matchScore < 85));

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-medium text-slate-800">
                            {app.applicationNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {app.student?.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            Std {app.student?.standard}-{app.student?.section}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${hasMismatch ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {hasMismatch ? 'Needs Staff Review' : 'Details Matched'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                app.status === 'VERIFIED'
                                  ? 'verified'
                                  : app.status === 'REJECTED'
                                  ? 'rejected'
                                  : 'pending'
                              }
                              showIcon
                            >
                              {app.status === 'PENDING_VERIFICATION'
                                ? 'Pending'
                                : app.status === 'VERIFIED'
                                ? 'Approved'
                                : app.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/admin/applications/${app.id}`}>
                              <Button variant="outline" size="sm">
                                Review
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No recent applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
