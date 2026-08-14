export type DocumentType = 'AADHAAR' | 'BIRTH_CERTIFICATE' | 'COMMUNITY_CERTIFICATE';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED';

export type DocumentStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'OCR_COMPLETED'
  | 'MATCHED'
  | 'MISMATCH'
  | 'STAFF_APPROVED'
  | 'STAFF_REJECTED';

export interface DocumentModel {
  id: string;
  applicationId: string;
  type: DocumentType;
  fileName: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  status: DocumentStatus;
  ocrResult?: string | null;
  extractedName?: string | null;
  matchScore?: number | null;
  uploadedAt: string;
  processedAt?: string | null;
  verifiedAt?: string | null;
}

export interface StudentModel {
  id: string;
  name: string;
  standard: string;
  section: string;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
  applications?: ApplicationModel[];
}

export interface ApplicationModel {
  id: string;
  applicationNumber: string;
  studentId: string;
  student?: StudentModel;
  status: ApplicationStatus;
  remarks?: string | null;
  submittedAt: string;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: DocumentModel[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardStats {
  overview: {
    totalStudents: number;
    totalApplications: number;
    pendingVerification: number;
    verified: number;
    rejected: number;
    avgMatchRate: number;
  };
  recentApplications: ApplicationModel[];
  standardsBreakdown: { standard: string; count: number }[];
}

export interface AnalysisResponseData {
  id: string;
  type: DocumentType;
  fileName: string;
  status: DocumentStatus;
  expectedDocType: string;
  detectedDocType: string;
  docTypeLabel: string;
  isDocTypeMatched: boolean;
  docTypeMismatchReason?: string;
  extractedName: string | null;
  studentName: string;
  isNameMatched: boolean;
  isOverallMatched: boolean;
  overallReason: string;
  matchScore: number;
  matchRecommendation?: string;
  matchReason?: string;
  certificateNumber?: string | null;
  dateOfBirth?: string | null;
  documentQuality: string;
  confidence: number;
  fieldsFound: string[];
  notes: string;
  source: 'GEMINI_AI' | 'DEMO_ANALYZER';
}
