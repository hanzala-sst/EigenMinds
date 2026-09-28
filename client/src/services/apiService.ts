const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export class ApiService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API error (${response.status})`);
      }

      return data as T;
    } catch (error: any) {
      console.error(`[ApiService] Error at ${endpoint}:`, error);
      throw error;
    }
  }

  // Health
  public static async getHealth() {
    return this.request<any>('/health');
  }

  // Resumes
  public static async getSyntheticResumes() {
    return this.request<any>('/resumes/seed');
  }

  // Agents
  public static async getAgents() {
    return this.request<any>('/agents');
  }

  public static async discoverAgents(jobRequirement: any) {
    return this.request<any>('/agents/discover', {
      method: 'POST',
      body: JSON.stringify(jobRequirement)
    });
  }

  // Jobs
  public static async createJob(jobData: any) {
    return this.request<any>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
  }

  public static async getJobById(jobId: string) {
    return this.request<any>(`/jobs/${jobId}`);
  }

  // Agreements
  public static async createAgreement(agreementPayload: any) {
    return this.request<any>('/agreements', {
      method: 'POST',
      body: JSON.stringify(agreementPayload)
    });
  }

  public static async getAgreementById(agreementId: string) {
    return this.request<any>(`/agreements/${agreementId}`);
  }

  // Screening
  public static async submitScreening(screeningPayload: any) {
    return this.request<any>('/screening/submit', {
      method: 'POST',
      body: JSON.stringify(screeningPayload)
    });
  }

  public static async verifyScreening(taskId: string) {
    return this.request<any>('/screening/verify', {
      method: 'POST',
      body: JSON.stringify({ taskId })
    });
  }
}
