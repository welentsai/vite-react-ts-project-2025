// API service for customer operations
export interface Customer {
  id: number;
  name: string;
  age: number;
  email: string;
  country: string;
  deleted?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

const BASE_URL = 'http://abc.example.com/api/v1';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all customers
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    return this.request<Customer[]>('/customers');
  }

  // Create a new customer
  async createCustomer(customer: Omit<Customer, 'id'>): Promise<ApiResponse<Customer>> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  // Update a customer
  async updateCustomer(id: number, customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  // Soft delete a customer
  async deleteCustomer(id: number): Promise<ApiResponse<null>> {
    return this.request<null>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Restore a deleted customer
  async restoreCustomer(id: number): Promise<ApiResponse<Customer>> {
    return this.request<Customer>(`/customers/${id}/restore`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
