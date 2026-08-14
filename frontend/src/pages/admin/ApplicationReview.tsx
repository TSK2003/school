import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ApplicationModel, DocumentModel } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog } from '../../components/ui/Dialog';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const ApplicationReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<ApplicationModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<DocumentModel | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Confirm modals
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  const fetchApplication = () => {
    if (!id) return;
    setIsLoading(true);
    api.applications.getApplicationById(id)
      .then(res => {
        if (res.success && res.data) {
          setApplication(res.data);
          if (res.data.remarks) setRemarks(res.data.remarks);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await api.verification.approve(id, remarks);
      if (res.success && res.data) {
        setApplication(res.data);
        setConfirmApproveOpen(false);
      } else {
        setActionError(res.message || 'Failed to approve application.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error occurred while approving.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    if (!remarks.trim()) {
      setActionError('Rejection remarks are mandatory. Please provide a reason.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await api.verification.reject(id, remarks);
      if (res.success && res.data) {
        setApplication(res.data);
        setConfirmRejectOpen(false);
      } else {
        setActionError(res.message || 'Failed to reject application.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error occurred while rejecting.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openDocPreview = (doc: DocumentModel) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  if (isLoading && !application) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading application verification workspace...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-semibold text-slate-700">Application not found.</p>
        <Link to="/admin/pending">
          <Button variant="outline" size="sm" className="mt-3">
            Back to Pending Queue
          </Button>
        </Link>
      </div>
    );
  }

  const student = application.student;
  const isVerified = application.status === 'VERIFIED';
  const isRejected = application.status === 'REJECTED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/pending">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Queue
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-slate-900">
                {application.applicationNumber}
              </span>
              <Badge
                variant={isVerified ? 'verified' : isRejected ? 'rejected' : 'pending'}
              >
                {application.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Submitted: {formatDate(application.submittedAt)}
              {application.verifiedAt && ` • Action by ${application.verifiedBy || 'Staff'} on ${formatDate(application.verifiedAt)}`}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchApplication}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {/* Student Profile Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Student Admission Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Student Full Name:</span>
              <span className="font-bold text-sm text-slate-900">
                {student?.name}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Enrolled Standard:</span>
              <span className="font-semibold text-slate-800">
                Standard {student?.standard} - {student?.section}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Year:</span>
              <span className="font-mono text-slate-800">
                {student?.academicYear}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Student ID:</span>
              <span className="font-mono text-slate-600">
                {student?.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Analysis Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-slate-900">
          Uploaded Documents & Verification Entities
        </h3>

        <div className="space-y-4">
          {application.documents?.map(doc => {
            let ocr: any = null;
            try {
              if (doc.ocrResult) {
                ocr = JSON.parse(doc.ocrResult);
              }
            } catch {}

            const isMatched = doc.status === 'MATCHED' || ocr?.isOverallMatched;

            return (
              <Card key={doc.id} className="p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {doc.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({doc.fileName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={isMatched ? 'success' : 'danger'}>
                        {isMatched ? 'Matched' : 'Unmatched'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocPreview(doc)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Document
                      </Button>
                    </div>
                  </div>

                  {/* Dual Verification Panels */}
                  <div className="space-y-2.5">
                    {/* Check 1: Document Type Verification */}
                    <div className="p-3 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">
                          1. Certificate Type Verification
                        </span>
                        <span className={`text-[11px] font-bold ${ocr?.isDocTypeMatched !== false ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {ocr?.isDocTypeMatched !== false ? 'Type Matched' : 'Type Mismatch'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Required Type:</span>
                          <span className="font-semibold text-slate-800">{doc.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Detected Document:</span>
                          <span className={`font-semibold ${ocr?.isDocTypeMatched !== false ? 'text-slate-800' : 'text-rose-700'}`}>
                            {ocr?.docTypeLabel || ocr?.detectedDocType || doc.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Check 2: Student Name Verification */}
                    <div className="p-3 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">
                          2. Student Name Verification
                        </span>
                        <span className={`text-[11px] font-bold ${doc.extractedName && isMatched ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {doc.extractedName && isMatched ? 'Name Matched' : 'Name Unmatched'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Document Extracted Name:</span>
                          <p className={`font-semibold ${isMatched ? 'text-slate-900' : 'text-rose-700'}`}>
                            {doc.extractedName || ocr?.studentName || '— (Name not detected)'}
                          </p>
                          {ocr?.certificateNumber && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Cert #: <span className="font-mono text-slate-700">{ocr.certificateNumber}</span>
                            </p>
                          )}
                          {ocr?.dateOfBirth && (
                            <p className="text-[11px] text-slate-500">
                              DOB: <span className="text-slate-700">{ocr.dateOfBirth}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 text-[10px] block">School Admission Record:</span>
                          <p className="font-semibold text-slate-900">
                            {student?.name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Standard {student?.standard}-{student?.section} • {student?.academicYear}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Overall Summary */}
                    <div className="text-[11px] text-slate-600 pt-1">
                      <span className="font-medium">Verification Result: </span>
                      <span className={isMatched ? 'text-emerald-800 font-semibold' : 'text-rose-700 font-semibold'}>
                        {ocr?.overallReason || (isMatched ? 'Document verified successfully.' : 'Verification check failed.')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Staff Decision Dock */}
      <Card className="p-5 border-slate-300">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Staff Verification Decision</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          <Textarea
            label="Staff Verification Remarks"
            placeholder="Enter remarks or feedback for this submission. Mandatory when rejecting..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={3}
            helperText="Remarks are recorded in the audit trail and visible to administration."
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Current state: <strong className="text-slate-800">{application.status}</strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={() => setConfirmRejectOpen(true)}
                leftIcon={<XCircle className="w-4 h-4" />}
                disabled={isProcessing}
              >
                Reject Application
              </Button>

              <Button
                variant="success"
                onClick={() => setConfirmApproveOpen(true)}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                disabled={isProcessing}
              >
                Approve & Verify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Confirm Approve Dialog */}
      <Dialog
        isOpen={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        title="Approve Application Verification?"
        description={`Confirm approval for ${student?.name} (${application.applicationNumber}).`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are about to mark this application as <strong>STAFF_APPROVED</strong>.
          </p>
          {remarks && (
            <div className="p-2.5 rounded bg-slate-50 text-slate-700">
              <strong>Remarks:</strong> "{remarks}"
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              isLoading={isProcessing}
              onClick={handleApprove}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Reject Dialog */}
      <Dialog
        isOpen={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        title="Reject Application Submission?"
        description={`Reject application for ${student?.name}.`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-rose-600 font-medium">
            Please make sure you have specified the exact reason in remarks for the parent/student to rectify.
          </p>
          {!remarks.trim() ? (
            <p className="text-xs text-rose-500">
              * Please enter remarks before confirming rejection.
            </p>
          ) : (
            <div className="p-2.5 rounded bg-slate-50 text-slate-700">
              <strong>Rejection Reason:</strong> "{remarks}"
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!remarks.trim()}
              isLoading={isProcessing}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
