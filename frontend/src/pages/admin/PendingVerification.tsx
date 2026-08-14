import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ApplicationModel } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  CheckSquare,
  Search,
  RefreshCw,
  ArrowRight,
  FileCheck,
  Clock
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const PendingVerification: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [standard, setStandard] = useState('ALL');
  const [standardsList, setStandardsList] = useState<string[]>([]);

  useEffect(() => {
    api.students.getDropdownOptions().then(res => {
      if (res.success && res.data) {
        setStandardsList(res.data.standards);
      }
    });
  }, []);

  const fetchPending = () => {
    setIsLoading(true);
    api.applications.getPending({ search, standard })
      .then(res => {
        if (res.success && res.data) {
          setApplications(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, [standard]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPending();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pending Verification Queue
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {applications.length} Awaiting Review
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Applications requiring staff document inspection, OCR match validation, and final approval decision.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPending}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by student name or application #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={standard} onChange={e => setStandard(e.target.value)}>
              <option value="ALL">All Standards</option>
              {standardsList.map(s => (
                <option key={s} value={s}>
                  Standard {s}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>
      </Card>

      {/* Applications List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading pending verification queue...
        </div>
      ) : applications.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {applications.map(app => {
            const docs = app.documents || [];
            const hasMismatch = docs.some(d => d.status === 'MISMATCH' || (d.matchScore !== null && d.matchScore !== undefined && d.matchScore < 85));

            return (
              <Card
                key={app.id}
                className="p-4 sm:p-5 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-600">
                        {app.applicationNumber}
                      </span>
                      <Badge variant={hasMismatch ? 'warning' : 'matched'} showIcon>
                        {hasMismatch ? 'Needs Staff Review' : 'Matched with Student Details'}
                      </Badge>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Submitted: {formatDate(app.submittedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-sm text-slate-900">
                        {app.student?.name}
                      </span>
                      <span className="text-slate-500">
                        Standard {app.student?.standard} - {app.student?.section}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        AY: {app.student?.academicYear}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {docs.map(d => {
                        const isDocMatched = d.status === 'MATCHED' || (d.matchScore !== null && d.matchScore !== undefined && d.matchScore >= 85);

                        return (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700"
                          >
                            <FileCheck className="w-3 h-3 text-slate-400" />
                            <span>{d.type.replace(/_/g, ' ')}</span>
                            <span className={isDocMatched ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                              • {isDocMatched ? 'Matched' : 'Review'}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <Link to={`/admin/applications/${app.id}`}>
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Verify Documents
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12 p-6">
          <CheckSquare className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">
            Queue is Clear!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            All submitted student document applications have been verified and processed.
          </p>
        </Card>
      )}
    </div>
  );
};
