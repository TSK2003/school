import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentModel, DocumentType, AnalysisResponseData, ApplicationModel } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Textarea } from '../../components/ui/Textarea';
import {
  Upload,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Sparkles,
  Check,
  RefreshCw
} from 'lucide-react';
import { formatFileSize } from '../../lib/utils';

type Step = 1 | 2 | 3 | 4 | 5;

interface DocUploadState {
  type: DocumentType;
  label: string;
  description: string;
  file: File | null;
  uploadedDocId: string | null;
  isUploading: boolean;
  uploadProgress: number;
  analysis: AnalysisResponseData | null;
  isAnalyzing: boolean;
  error?: string;
}

export const StudentPortal: React.FC = () => {
  const [step, setStep] = useState<Step>(1);

  // Metadata dropdowns - default empty
  const [standards, setStandards] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [studentList, setStudentList] = useState<StudentModel[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentModel | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Document states
  const [documents, setDocuments] = useState<Record<DocumentType, DocUploadState>>({
    AADHAAR: {
      type: 'AADHAAR',
      label: 'Aadhaar Card',
      description: 'Government issued UIDAI Aadhaar identity document (PDF / JPG / PNG)',
      file: null,
      uploadedDocId: null,
      isUploading: false,
      uploadProgress: 0,
      analysis: null,
      isAnalyzing: false
    },
    BIRTH_CERTIFICATE: {
      type: 'BIRTH_CERTIFICATE',
      label: 'Birth Certificate',
      description: 'Official birth certificate issued by Municipal Corporation / Authority',
      file: null,
      uploadedDocId: null,
      isUploading: false,
      uploadProgress: 0,
      analysis: null,
      isAnalyzing: false
    },
    COMMUNITY_CERTIFICATE: {
      type: 'COMMUNITY_CERTIFICATE',
      label: 'Community Certificate',
      description: 'Permanent community certificate issued by Revenue Department',
      file: null,
      uploadedDocId: null,
      isUploading: false,
      uploadProgress: 0,
      analysis: null,
      isAnalyzing: false
    }
  });

  // Submission State
  const [applicationRemarks, setApplicationRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<ApplicationModel | null>(null);

  // Load dropdown options on mount without auto-selection
  useEffect(() => {
    setIsLoadingOptions(true);
    api.students.getDropdownOptions()
      .then(res => {
        if (res.success && res.data) {
          setStandards(res.data.standards);
          setSections(res.data.sections);
        }
      })
      .finally(() => setIsLoadingOptions(false));
  }, []);

  // Fetch students when standard or section changes
  useEffect(() => {
    if (!selectedStandard || !selectedSection) {
      setStudentList([]);
      setSelectedStudentId('');
      setSelectedStudent(null);
      return;
    }

    setIsLoadingStudents(true);
    setSelectedStudentId('');
    setSelectedStudent(null);

    api.students.lookupStudents(selectedStandard, selectedSection)
      .then(res => {
        if (res.success && res.data) {
          setStudentList(res.data);
        }
      })
      .finally(() => setIsLoadingStudents(false));
  }, [selectedStandard, selectedSection]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const found = studentList.find(s => s.id === studentId) || null;
    setSelectedStudent(found);
  };

  // Upload file
  const handleFileUpload = async (type: DocumentType, file: File) => {
    if (!selectedStudent) return;

    setDocuments(prev => ({
      ...prev,
      [type]: { ...prev[type], file, isUploading: true, uploadProgress: 40, error: undefined }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('studentId', selectedStudent.id);

      const res = await api.documents.uploadDocument(formData);
      if (res.success && res.data) {
        setDocuments(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            uploadedDocId: res.data.id,
            isUploading: false,
            uploadProgress: 100
          }
        }));
      } else {
        setDocuments(prev => ({
          ...prev,
          [type]: { ...prev[type], isUploading: false, error: res.message || 'Upload failed' }
        }));
      }
    } catch (err: any) {
      setDocuments(prev => ({
        ...prev,
        [type]: { ...prev[type], isUploading: false, error: err?.message || 'Error uploading file' }
      }));
    }
  };

  const handleRemoveFile = (type: DocumentType) => {
    setDocuments(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        file: null,
        uploadedDocId: null,
        isUploading: false,
        uploadProgress: 0,
        analysis: null,
        error: undefined
      }
    }));
  };

  // Fast Parallel AI OCR Analysis
  const runAiAnalysis = async () => {
    const docTypes: DocumentType[] = ['AADHAAR', 'BIRTH_CERTIFICATE', 'COMMUNITY_CERTIFICATE'];

    // Set analyzing state
    setDocuments(prev => {
      const updated = { ...prev };
      docTypes.forEach(t => {
        if (updated[t].uploadedDocId) {
          updated[t].isAnalyzing = true;
        }
      });
      return updated;
    });

    for (const t of docTypes) {
      const doc = documents[t];
      if (doc.uploadedDocId) {
        try {
          const res = await api.documents.analyzeDocument(doc.uploadedDocId);
          if (res.success && res.data) {
            setDocuments(prev => ({
              ...prev,
              [t]: { ...prev[t], analysis: res.data, isAnalyzing: false }
            }));
          } else {
            setDocuments(prev => ({
              ...prev,
              [t]: { ...prev[t], isAnalyzing: false, error: res.message }
            }));
          }
        } catch (err) {
          setDocuments(prev => ({
            ...prev,
            [t]: { ...prev[t], isAnalyzing: false }
          }));
        }
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
    setStep(3);
  };

  // Submit Final Application
  const handleSubmitApplication = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      const res = await api.applications.submitApplication({
        studentId: selectedStudent.id,
        remarks: applicationRemarks
      });

      if (res.success && res.data) {
        setSubmittedApplication(res.data);
        setStep(5);
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllUploaded = Object.values(documents).every(d => d.uploadedDocId !== null);
  const isAnyAnalyzing = Object.values(documents).some(d => d.isAnalyzing);

  return (
    <div className="space-y-6">
      {/* Wizard Step Progress Bar */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, title: 'Student' },
            { num: 2, title: 'Upload' },
            { num: 3, title: 'AI Analysis' },
            { num: 4, title: 'Review' },
            { num: 5, title: 'Receipt' }
          ].map(s => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'border-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:inline ${
                    isCurrent ? 'text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Student Selection */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Student Document Submission
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select standard, section, and student name to start document verification.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select Student Profile</CardTitle>
              <CardDescription>
                Choose standard and section, then select student from the admission roster.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Standard / Grade"
                  value={selectedStandard}
                  onChange={e => setSelectedStandard(e.target.value)}
                  disabled={isLoadingOptions}
                  required
                >
                  <option value="">-- Select Standard --</option>
                  {standards.map(std => (
                    <option key={std} value={std}>
                      {['PreKG', 'LKG', 'UKG'].includes(std) ? std : `Standard ${std}`}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Section"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  disabled={isLoadingOptions}
                  required
                >
                  <option value="">-- Select Section --</option>
                  {sections.map(sec => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  label="Student Name"
                  value={selectedStudentId}
                  onChange={e => handleStudentSelect(e.target.value)}
                  disabled={isLoadingStudents || !selectedStandard || !selectedSection}
                  required
                  helperText={
                    !selectedStandard || !selectedSection
                      ? 'Please select standard and section first.'
                      : isLoadingStudents
                      ? 'Loading students from database...'
                      : studentList.length === 0
                      ? 'No students found in this section.'
                      : `${studentList.length} students enrolled in Standard ${selectedStandard}-${selectedSection}`
                  }
                >
                  <option value="">-- Select Student Name --</option>
                  {studentList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} (Std {st.standard}-{st.section})
                    </option>
                  ))}
                </Select>
              </div>

              {selectedStudent && (
                <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Confirmed Student Record
                    </span>
                    <Badge variant="outline">Academic Year {selectedStudent.academicYear}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block">Full Name:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedStudent.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Class & Section:</span>
                      <span className="font-semibold text-slate-800">
                        Standard {selectedStudent.standard} - {selectedStudent.section}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Admission ID:</span>
                      <span className="font-mono text-slate-600">
                        {selectedStudent.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-end">
              <Button
                variant="primary"
                disabled={!selectedStudent}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setStep(2)}
              >
                Continue to Upload Documents
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* STEP 2: Document Upload */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Upload Required Documents
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Student: <span className="font-semibold text-slate-800">{selectedStudent?.name}</span> (Std {selectedStudent?.standard}-{selectedStudent?.section})
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Change Student
            </Button>
          </div>

          <div className="space-y-4">
            {(['AADHAAR', 'BIRTH_CERTIFICATE', 'COMMUNITY_CERTIFICATE'] as DocumentType[]).map(type => {
              const doc = documents[type];

              return (
                <Card key={type} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {doc.label}
                        </span>
                        <span className="text-rose-500 text-xs font-semibold">*Required</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {doc.description}
                      </p>
                    </div>

                    <div className="flex-1 sm:max-w-xs flex flex-col items-end gap-2">
                      {!doc.uploadedDocId ? (
                        <label className="w-full cursor-pointer flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-slate-50 hover:bg-blue-50/50 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(type, e.target.files[0]);
                              }
                            }}
                          />
                          <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                            <Upload className="w-4 h-4" />
                            <span>Select Document</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, PNG (Max 10MB)</span>
                        </label>
                      ) : (
                        <div className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCheck className="w-4 h-4 text-slate-700 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">
                                {doc.file?.name || `${doc.type.toLowerCase()}.pdf`}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {formatFileSize(doc.file?.size || 240000)} • Ready
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(type)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {doc.isUploading && (
                        <ProgressBar value={doc.uploadProgress} className="w-full" color="blue" />
                      )}
                      {doc.error && (
                        <p className="text-[11px] text-rose-500 font-medium">{doc.error}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!isAllUploaded || isAnyAnalyzing}
              isLoading={isAnyAnalyzing}
              onClick={runAiAnalysis}
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              Run AI Document Analysis
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: AI Document Analysis Results (Type + Name Validation) */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              AI Document Verification Results
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Automated validation of certificate type and student name matching.
            </p>
          </div>

          <div className="space-y-4">
            {(['AADHAAR', 'BIRTH_CERTIFICATE', 'COMMUNITY_CERTIFICATE'] as DocumentType[]).map(type => {
              const doc = documents[type];
              const analysis = doc.analysis;
              const isMatched = analysis?.isOverallMatched || (analysis?.status === 'MATCHED');

              return (
                <Card key={type} className="p-4 sm:p-5">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {doc.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (Target Slot)
                        </span>
                      </div>

                      {analysis ? (
                        <Badge variant={isMatched ? 'success' : 'danger'}>
                          {isMatched ? 'Matched' : 'Unmatched'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending Analysis</Badge>
                      )}
                    </div>

                    {analysis && (
                      <div className="space-y-2.5 pt-1">
                        {/* Check 1: Document Type Verification */}
                        <div className="p-3 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500 font-semibold uppercase text-[10px]">
                              1. Certificate Type Verification
                            </span>
                            <span className={`text-[11px] font-bold ${analysis.isDocTypeMatched ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {analysis.isDocTypeMatched ? 'Type Matched' : 'Type Mismatch'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400 text-[10px] block">Required Document:</span>
                              <span className="font-semibold text-slate-800">{doc.label}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">Detected Upload:</span>
                              <span className={`font-semibold ${analysis.isDocTypeMatched ? 'text-slate-800' : 'text-rose-700'}`}>
                                {analysis.docTypeLabel || analysis.detectedDocType || doc.label}
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
                            <span className={`text-[11px] font-bold ${analysis.isNameMatched ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {analysis.isNameMatched ? 'Name Matched' : 'Name Unmatched'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400 text-[10px] block">Document Extracted Name:</span>
                              <span className={`font-semibold ${analysis.isNameMatched ? 'text-slate-800' : 'text-rose-700'}`}>
                                {analysis.extractedName || 'Name not detected on document'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">School Admission Record:</span>
                              <span className="font-semibold text-slate-800">{selectedStudent?.name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Verification Reason / Summary */}
                        <div className="text-[11px] text-slate-600 pt-1">
                          <span className="font-medium">Verification Result: </span>
                          <span className={isMatched ? 'text-emerald-800 font-semibold' : 'text-rose-700 font-semibold'}>
                            {analysis.overallReason || (isMatched ? 'Document verified successfully.' : 'Verification failed.')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Upload
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(4)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submission */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Review Application Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review student details and verification results before final submission.
            </p>
          </div>

          {/* Student Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Student Name:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Class & Section:</span>
                  <span className="font-semibold text-slate-800">Standard {selectedStudent?.standard}-{selectedStudent?.section}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Academic Year:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent?.academicYear}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Attached Certificates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(['AADHAAR', 'BIRTH_CERTIFICATE', 'COMMUNITY_CERTIFICATE'] as DocumentType[]).map(type => {
                const doc = documents[type];
                const analysis = doc.analysis;
                const isMatched = analysis?.isOverallMatched || (analysis?.status === 'MATCHED');

                return (
                  <div key={type} className="flex items-center justify-between p-3 rounded bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-semibold text-slate-800 block">{doc.label}</span>
                        <span className="text-[10px] text-slate-400">{doc.file?.name}</span>
                      </div>
                    </div>
                    <div>
                      <Badge variant={isMatched ? 'success' : 'danger'}>
                        {isMatched ? 'Matched' : 'Unmatched'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Remarks */}
          <div>
            <Textarea
              label="Additional Notes / Parent Remarks (Optional)"
              placeholder="Provide any additional context or clarification for school staff..."
              value={applicationRemarks}
              onChange={e => setApplicationRemarks(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Analysis
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleSubmitApplication}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Application
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Receipt */}
      {step === 5 && submittedApplication && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="text-center p-6 sm:p-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Application Submitted Successfully
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your document submission has been received and queued for administrative verification.
            </p>

            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">Application Number</span>
                <span className="font-mono text-sm font-bold text-blue-600">
                  {submittedApplication.applicationNumber}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                <span className="text-slate-500">Student Name</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent?.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                <span className="text-slate-500">Class & Section</span>
                <span className="font-semibold text-slate-800">
                  Standard {selectedStudent?.standard} - {selectedStudent?.section}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Current Status</span>
                <Badge variant="pending">Pending Staff Verification</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setDocuments({
                    AADHAAR: { type: 'AADHAAR', label: 'Aadhaar Card', description: 'Government issued UIDAI Aadhaar identity document (PDF / JPG / PNG)', file: null, uploadedDocId: null, isUploading: false, uploadProgress: 0, analysis: null, isAnalyzing: false },
                    BIRTH_CERTIFICATE: { type: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', description: 'Official birth certificate issued by Municipal Corporation / Authority', file: null, uploadedDocId: null, isUploading: false, uploadProgress: 0, analysis: null, isAnalyzing: false },
                    COMMUNITY_CERTIFICATE: { type: 'COMMUNITY_CERTIFICATE', label: 'Community Certificate', description: 'Permanent community certificate issued by Revenue Department', file: null, uploadedDocId: null, isUploading: false, uploadProgress: 0, analysis: null, isAnalyzing: false }
                  });
                  setSubmittedApplication(null);
                  setApplicationRemarks('');
                  setSelectedStandard('');
                  setSelectedSection('');
                  setSelectedStudentId('');
                  setSelectedStudent(null);
                }}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Submit Another Application
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
