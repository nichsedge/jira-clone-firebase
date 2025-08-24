// API client functions to replace localStorage operations

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  category?: string;
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
  updatedAt: Date;
  assignee?: User;
  reporter: User;
  projectId: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

// Generic API fetch function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    return {
      success: false,
      error: 'Network error',
    };
  }
}

// Tickets API
export const ticketsApi = {
  // Get all tickets
  async getAll(params?: {
    projectId?: string;
    assigneeId?: string;
    status?: string;
  }): Promise<ApiResponse<Ticket[]>> {
    const queryParams = new URLSearchParams();
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.assigneeId) queryParams.append('assigneeId', params.assigneeId);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return apiRequest<Ticket[]>(`/api/tickets${query ? `?${query}` : ''}`);
  },

  // Get ticket by ID
  async getById(id: string): Promise<ApiResponse<Ticket>> {
    return apiRequest<Ticket>(`/api/tickets/${id}`);
  },

  // Create new ticket
  async create(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Ticket>> {
    return apiRequest<Ticket>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  },

  // Update ticket
  async update(id: string, updates: Partial<Ticket>): Promise<ApiResponse<Ticket>> {
    return apiRequest<Ticket>(`/api/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete ticket
  async delete(id: string): Promise<ApiResponse<Ticket>> {
    return apiRequest<Ticket>(`/api/tickets/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk update tickets (for drag & drop)
  async bulkUpdate(updates: { ticketId: string; updates: Partial<Ticket> }[]): Promise<ApiResponse<Ticket[]>> {
    const results = await Promise.all(
      updates.map(({ ticketId, updates }) => this.update(ticketId, updates))
    );

    const success = results.every(result => result.success);
    const data = results.filter(result => result.success).map(result => result.data!);

    return {
      success,
      data,
      error: success ? undefined : 'Some updates failed',
    };
  },
};

// Users API
export const usersApi = {
  // Get all users
  async getAll(): Promise<ApiResponse<User[]>> {
    return apiRequest<User[]>('/api/users');
  },

  // Create new user
  async create(user: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    return apiRequest<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
};

// Projects API
export const projectsApi = {
  // Get all projects
  async getAll(): Promise<ApiResponse<Project[]>> {
    return apiRequest<Project[]>('/api/projects');
  },

  // Create new project
  async create(project: Omit<Project, 'id'>): Promise<ApiResponse<Project>> {
    return apiRequest<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },
};