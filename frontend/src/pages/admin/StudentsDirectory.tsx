import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentModel } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Search, ChevronLeft, ChevronRight, Eye, RefreshCw, Filter, UserPlus } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

export const StudentsDirectory: React.FC = () => {
  const [students, setStudents] = useState<StudentModel[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [standard, setStandard] = useState('ALL');
  const [section, setSection] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // Options
  const [standardsList, setStandardsList] = useState<string[]>([]);
  const [sectionsList, setSectionsList] = useState<string[]>([]);

  // Selected student for detail modal
  const [selectedStudent, setSelectedStudent] = useState<StudentModel | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Add Student modal state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentStandard, setNewStudentStandard] = useState('10');
  const [newStudentSection, setNewStudentSection] = useState('A');
  const [newStudentYear, setNewStudentYear] = useState('2025-2026');
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // Fetch dropdown options
  useEffect(() => {
    api.students.getDropdownOptions().then(res => {
      if (res.success && res.data) {
        setStandardsList(res.data.standards);
        setSectionsList(res.data.sections);
      }
    });
  }, []);

  const fetchStudents = (page = 1) => {
    setIsLoading(true);
    api.students.getStudents({
      search,
      standard,
      section,
      status,
      page,
      limit: 15
    })
      .then(res => {
        if (res.success && res.data) {
          setStudents(res.data.students);
          setPagination(res.data.pagination);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStudents(1);
  }, [standard, section, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(1);
  };

  const handleViewStudent = (studentId: string) => {
    setIsLoadingDetail(true);
    setIsDetailOpen(true);
    api.students.getStudentById(studentId)
      .then(res => {
        if (res.success && res.data) {
          setSelectedStudent(res.data);
        }
      })
      .finally(() => setIsLoadingDetail(false));
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      setAddStudentError('Student name is required.');
      return;
    }

    setIsCreatingStudent(true);
    setAddStudentError(null);

    try {
      const res = await api.students.createStudent({
        name: newStudentName.trim(),
        standard: newStudentStandard.trim(),
        section: newStudentSection.trim(),
        academicYear: newStudentYear.trim()
      });

      if (res.success) {
        setIsAddStudentOpen(false);
        setNewStudentName('');
        fetchStudents(1);
      } else {
        setAddStudentError(res.message || 'Failed to add student.');
      }
    } catch (err: any) {
      setAddStudentError(err?.message || 'Error adding student record.');
    } finally {
      setIsCreatingStudent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Student Directory
          </h1>
          <p className="text-xs text-slate-500">
            Total {pagination.total} students enrolled in admission database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStudents(pagination.page)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsAddStudentOpen(true);
              setAddStudentError(null);
            }}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search student name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div>
              <Select value={standard} onChange={e => setStandard(e.target.value)}>
                <option value="ALL">All Standards</option>
                {standardsList.map(s => (
                  <option key={s} value={s}>
                    Standard {s}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select value={section} onChange={e => setSection(e.target.value)}>
                <option value="ALL">All Sections</option>
                {sectionsList.map(s => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="VERIFIED">Verified / Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="NOT_SUBMITTED">Not Submitted</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStandard('ALL');
                setSection('ALL');
                setStatus('ALL');
              }}
            >
              Reset Filters
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Standard</th>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Academic Year</th>
                <th className="px-4 py-3 font-semibold">Application Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading students...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map(st => {
                  const latestApp = st.applications && st.applications[0];
                  const appStatus = latestApp?.status || 'NOT_SUBMITTED';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {st.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        Standard {st.standard}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        Section {st.section}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {st.academicYear}
                      </td>
                      <td className="px-4 py-3">
                        {appStatus === 'NOT_SUBMITTED' ? (
                          <Badge variant="outline">Not Submitted</Badge>
                        ) : (
                          <Badge
                            variant={
                              appStatus === 'VERIFIED'
                                ? 'verified'
                                : appStatus === 'REJECTED'
                                ? 'rejected'
                                : 'pending'
                            }
                          >
                            {appStatus === 'PENDING_VERIFICATION' ? 'Pending' : appStatus}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStudent(st.id)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View
                          </Button>
                          {latestApp && (
                            <Link to={`/admin/applications/${latestApp.id}`}>
                              <Button variant="secondary" size="sm">
                                Review App
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No students match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs">
          <span className="text-slate-500">
            Showing Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800">{pagination.totalPages || 1}</strong> ({pagination.total} total)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => fetchStudents(pagination.page - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => fetchStudents(pagination.page + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Student Dialog */}
      <Dialog
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Add New Student Record"
        description="Register a new student in the school admission database for document collection."
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          {addStudentError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
              {addStudentError}
            </div>
          )}

          <Input
            label="Student Full Name"
            placeholder="e.g. Rahul Kumar S."
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Standard / Grade"
              value={newStudentStandard}
              onChange={e => setNewStudentStandard(e.target.value)}
              required
            >
              {['PreKG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(s => (
                <option key={s} value={s}>
                  {['PreKG', 'LKG', 'UKG'].includes(s) ? s : `Standard ${s}`}
                </option>
              ))}
            </Select>

            <Select
              label="Section"
              value={newStudentSection}
              onChange={e => setNewStudentSection(e.target.value)}
              required
            >
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Academic Year"
            placeholder="2025-2026"
            value={newStudentYear}
            onChange={e => setNewStudentYear(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddStudentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isCreatingStudent}>
              Save Student Record
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedStudent ? selectedStudent.name : 'Student Details'}
        description={`Standard ${selectedStudent?.standard}-${selectedStudent?.section} • Academic Year ${selectedStudent?.academicYear}`}
        maxWidth="lg"
      >
        {isLoadingDetail ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Loading student details...
          </div>
        ) : selectedStudent ? (
          <div className="space-y-4 text-xs">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-500 block">Student ID:</span>
                <span className="font-mono font-medium text-slate-800">
                  {selectedStudent.id}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Enrolled Class:</span>
                <span className="font-semibold text-slate-800">
                  Standard {selectedStudent.standard} (Section {selectedStudent.section})
                </span>
              </div>
            </div>

            {/* Applications List */}
            <div>
              <h4 className="font-semibold text-slate-900 text-xs mb-2">
                Application History ({selectedStudent.applications?.length || 0})
              </h4>

              {selectedStudent.applications && selectedStudent.applications.length > 0 ? (
                <div className="space-y-2">
                  {selectedStudent.applications.map(app => (
                    <div
                      key={app.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-600">
                          {app.applicationNumber}
                        </span>
                        <Badge
                          variant={
                            app.status === 'VERIFIED'
                              ? 'verified'
                              : app.status === 'REJECTED'
                              ? 'rejected'
                              : 'pending'
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Submitted: {formatDate(app.submittedAt)}
                        {app.verifiedAt && ` • Verified: ${formatDate(app.verifiedAt)} by ${app.verifiedBy || 'Staff'}`}
                      </div>

                      {app.remarks && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded">
                          "{app.remarks}"
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <Link to={`/admin/applications/${app.id}`} onClick={() => setIsDetailOpen(false)}>
                          <Button variant="primary" size="sm">
                            Open Verification Workspace
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No documents or applications submitted for this student yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
};
