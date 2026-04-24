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

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async verifyEmail(token: string) {
    return this.request(`/auth/verify-email/${token}`);
  }

  async resendVerification(email: string) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
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

  async bulkDeleteProducts(ids: string[]) {
    return this.request('/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  }

  async bulkUpdateProducts(ids: string[], updates: { field: string; value: any }) {
    return this.request('/products/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, updates })
    });
  }

  async bulkDeleteCustomers(ids: string[]) {
    return this.request('/customers/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  }

  async bulkUpdateCustomers(ids: string[], updates: { field: string; value: any }) {
    return this.request('/customers/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, updates })
    });
  }

  async bulkDeleteInventory(ids: string[]) {
    return this.request('/inventory/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  }

  async bulkUpdateInventory(ids: string[], updates: { field: string; value: any }) {
    return this.request('/inventory/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, updates })
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
  async getSettings(category?: string) {
    const endpoint = category ? `/settings/${category}` : '/settings';
    return this.request(endpoint);
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

  async getSetting(key: string) {
    return this.request(`/settings/key/${key}`);
  }

  async updateSetting(key: string, value: any, type: string = 'string') {
    return this.request(`/settings/key/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, type })
    });
  }

  // System management methods
  async backupDatabase() {
    return this.request('/system/backup', {
      method: 'POST'
    });
  }

  async exportData(format: 'csv' | 'json' = 'csv') {
    return this.request(`/system/export?format=${format}`, {
      method: 'POST'
    });
  }

  async getSystemLogs(lines: number = 1000) {
    return this.request(`/system/logs?lines=${lines}`);
  }

  async clearCache() {
    return this.request('/system/clear-cache', {
      method: 'POST'
    });
  }

  async getSystemInfo() {
    return this.request('/system/info');
  }

  async downloadFile(url: string, filename: string) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/v1${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const apiService = new ApiService();
