import { ApiResponse, DashboardStats, StudentModel, ApplicationModel, AnalysisResponseData } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('school_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  auth: {
    async login(email: string, password: string) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data: ApiResponse<{ token: string; user: any }> = await res.json();
      if (data.success && data.data?.token) {
        localStorage.setItem('school_auth_token', data.data.token);
        localStorage.setItem('school_user', JSON.stringify(data.data.user));
      }
      return data;
    },
    async getMe() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<any>;
    },
    logout() {
      localStorage.removeItem('school_auth_token');
      localStorage.removeItem('school_user');
    },
    getUser() {
      const u = localStorage.getItem('school_user');
      try {
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    },
    isAuthenticated() {
      return Boolean(localStorage.getItem('school_auth_token'));
    }
  },

  // Students
  students: {
    async getDropdownOptions() {
      const res = await fetch(`${API_BASE}/students/metadata/options`);
      return (await res.json()) as ApiResponse<{
        standards: string[];
        sections: string[];
        academicYears: string[];
      }>;
    },
    async lookupStudents(standard: string, section: string) {
      const res = await fetch(`${API_BASE}/students/lookup?standard=${encodeURIComponent(standard)}&section=${encodeURIComponent(section)}`);
      return (await res.json()) as ApiResponse<StudentModel[]>;
    },
    async getStudents(params: {
      search?: string;
      standard?: string;
      section?: string;
      academicYear?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.standard) query.set('standard', params.standard);
      if (params.section) query.set('section', params.section);
      if (params.academicYear) query.set('academicYear', params.academicYear);
      if (params.status) query.set('status', params.status);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));

      const res = await fetch(`${API_BASE}/students?${query.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<{
        students: StudentModel[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>;
    },
    async getStudentById(id: string) {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<StudentModel>;
    },
    async createStudent(payload: { name: string; standard: string; section: string; academicYear?: string }) {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return (await res.json()) as ApiResponse<StudentModel>;
    },
    async deleteStudent(id: string) {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<any>;
    }
  },

  // Documents
  documents: {
    async uploadDocument(formData: FormData) {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData
      });
      return (await res.json()) as ApiResponse<any>;
    },
    async analyzeDocument(id: string) {
      const res = await fetch(`${API_BASE}/documents/${id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      return (await res.json()) as ApiResponse<AnalysisResponseData>;
    },
    getPreviewUrl(id: string) {
      return `${API_BASE}/documents/${id}/preview`;
    }
  },

  // Applications
  applications: {
    async submitApplication(payload: { studentId: string; applicationId?: string; remarks?: string }) {
      const res = await fetch(`${API_BASE}/applications/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return (await res.json()) as ApiResponse<ApplicationModel>;
    },
    async getPending(params?: { search?: string; standard?: string }) {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.standard) query.set('standard', params.standard);

      const res = await fetch(`${API_BASE}/applications/pending?${query.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<ApplicationModel[]>;
    },
    async getApplications(params: {
      search?: string;
      status?: string;
      standard?: string;
      page?: number;
      limit?: number;
    }) {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.status) query.set('status', params.status);
      if (params.standard) query.set('standard', params.standard);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));

      const res = await fetch(`${API_BASE}/applications?${query.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<{
        applications: ApplicationModel[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>;
    },
    async getApplicationById(id: string) {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<ApplicationModel>;
    }
  },

  // Verification
  verification: {
    async approve(id: string, remarks?: string) {
      const res = await fetch(`${API_BASE}/verification/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ remarks })
      });
      return (await res.json()) as ApiResponse<ApplicationModel>;
    },
    async reject(id: string, remarks: string) {
      const res = await fetch(`${API_BASE}/verification/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ remarks })
      });
      return (await res.json()) as ApiResponse<ApplicationModel>;
    }
  },

  // Dashboard
  dashboard: {
    async getStats() {
      const res = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<DashboardStats>;
    }
  },

  // Settings
  settings: {
    async getSettings() {
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { ...getAuthHeader() }
      });
      return (await res.json()) as ApiResponse<any>;
    },
    async updateSettings(payload: {
      activeProvider?: string;
      geminiApiKey?: string;
      groqApiKey?: string;
      mistralApiKey?: string;
    }) {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return (await res.json()) as ApiResponse<any>;
    },
    async testConnection(provider?: 'GEMINI' | 'GROQ' | 'MISTRAL') {
      const res = await fetch(`${API_BASE}/settings/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ provider })
      });
      return (await res.json()) as ApiResponse<any>;
    }
  }
};
