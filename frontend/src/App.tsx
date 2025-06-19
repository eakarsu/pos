import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Import components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { SettingsProvider } from './utils/SettingsContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component for landing page
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// App Routes Component (needs to be inside AuthProvider)
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Debug logging
  console.log('AppRoutes render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
  
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes - Always accessible, no auth checks */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={isLoading ? (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : <Login />} />
          
          {/* Protected App Routes - Require authentication */}
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Legacy redirects for backward compatibility */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/pos" element={<Navigate to="/app/pos" replace />} />
          <Route path="/products" element={<Navigate to="/app/products" replace />} />
          <Route path="/customers" element={<Navigate to="/app/customers" replace />} />
          <Route path="/inventory" element={<Navigate to="/app/inventory" replace />} />
          <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
