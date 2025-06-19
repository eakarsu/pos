const API_BASE_URL = '/api/v1';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        throw new Error('Authentication required. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  }

  // Product methods
  async getProducts(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/products${queryString}`);
  }

  async getProductByBarcode(barcode: string) {
    return this.request(`/products/barcode/${barcode}`);
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  // Sales methods
  async getSales(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/sales${queryString}`);
  }

  async createSale(saleData: any) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData)
    });
  }

  // Customer methods
  async getCustomers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/customers${queryString}`);
  }

  async createCustomer(customerData: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  // Inventory methods
  async getInventory(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/inventory${queryString}`);
  }

  async createInventoryAdjustment(adjustmentData: any) {
    return this.request('/inventory/adjustment', {
      method: 'POST',
      body: JSON.stringify(adjustmentData)
    });
  }

  // Reports methods
  async getSalesReport(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/reports/sales${queryString}`);
  }

  async getInventoryReport() {
    return this.request('/reports/inventory');
  }

  async getCustomerReport() {
    return this.request('/reports/customers');
  }

  // Settings methods
  async getSettings(category: string) {
    return this.request(`/settings/${category}`);
  }

  async updateSettings(category: string, settingsData: any) {
    return this.request(`/settings/${category}`, {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  }

  async getAllSettings() {
    return this.request('/settings');
  }
}

export const apiService = new ApiService();
