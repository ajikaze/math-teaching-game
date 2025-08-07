const API_BASE_URL = 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

export interface CharacterState {
  id: string;
  userId: string;
  level: number;
  experience: number;
  understandingAlgebra: number;
  understandingGeometry: number;
  understandingFunctions: number;
  understandingProbability: number;
  mood: string;
  totalProblems: number;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  userId: string;
  role: string;
  content: string;
  topic?: string;
  timestamp: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication APIs
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, username, password })
    });
    
    const data = await this.handleResponse<AuthResponse>(response);
    localStorage.setItem('authToken', data.token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    const data = await this.handleResponse<AuthResponse>(response);
    localStorage.setItem('authToken', data.token);
    return data;
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse<User>(response);
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  // Character Data APIs
  async getCharacterState(): Promise<CharacterState> {
    const response = await fetch(`${this.baseUrl}/api/data/character`, {
      headers: this.getAuthHeaders()
    });
    
    const data = await this.handleResponse<APIResponse<CharacterState>>(response);
    return data.data;
  }

  async updateCharacterState(updates: Partial<CharacterState>): Promise<CharacterState> {
    const response = await fetch(`${this.baseUrl}/api/data/character`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    
    const data = await this.handleResponse<APIResponse<CharacterState>>(response);
    return data.data;
  }

  async addExperience(experience: number, topic?: string): Promise<CharacterState> {
    const response = await fetch(`${this.baseUrl}/api/data/character/experience`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ experience, topic })
    });
    
    const data = await this.handleResponse<APIResponse<CharacterState>>(response);
    return data.data;
  }

  async updateMood(mood: string): Promise<CharacterState> {
    const response = await fetch(`${this.baseUrl}/api/data/character/mood`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mood })
    });
    
    const data = await this.handleResponse<APIResponse<CharacterState>>(response);
    return data.data;
  }

  // Conversation APIs
  async getConversationHistory(limit?: number): Promise<ConversationMessage[]> {
    const url = new URL(`${this.baseUrl}/api/data/conversations`);
    if (limit) {
      url.searchParams.append('limit', limit.toString());
    }
    
    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders()
    });
    
    const data = await this.handleResponse<APIResponse<ConversationMessage[]>>(response);
    return data.data;
  }

  async saveMessage(role: string, content: string, topic?: string): Promise<ConversationMessage> {
    const response = await fetch(`${this.baseUrl}/api/data/conversations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role, content, topic })
    });
    
    const data = await this.handleResponse<APIResponse<ConversationMessage>>(response);
    return data.data;
  }

  async getStats(): Promise<{
    character: CharacterState;
    conversations: {
      totalMessages: number;
      topicStats: { topic: string; count: number }[];
      lastActivity?: string;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/api/data/stats`, {
      headers: this.getAuthHeaders()
    });
    
    const data = await this.handleResponse<APIResponse<any>>(response);
    return data.data;
  }

  // Chat API (existing)
  async chat(payload: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    
    return this.handleResponse(response);
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    return this.handleResponse(response);
  }

  // Analytics APIs
  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      headers: this.getAuthHeaders()
    });
    
    const data = await this.handleResponse<APIResponse<any>>(response);
    return data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

export const apiClient = new ApiClient();
export default apiClient;