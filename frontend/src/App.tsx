import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Resources from './pages/Resources';
import Support from './pages/Support';
import Solutions from './pages/Solutions';
import Integrations from './pages/Integrations';
import API from './pages/API';

// Solution pages
import Retail from './pages/solutions/Retail';
import Restaurant from './pages/solutions/Restaurant';
import Salon from './pages/solutions/Salon';
import MultiLocation from './pages/solutions/MultiLocation';

// Company pages
import About from './pages/company/About';
import Contact from './pages/company/Contact';
import Careers from './pages/company/Careers';
import Press from './pages/company/Press';
import Partners from './pages/company/Partners';
import Community from './pages/company/Community';

// Support pages
import HelpCenter from './pages/support/HelpCenter';
import SystemStatus from './pages/support/SystemStatus';

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

// Navigation tracker component
const NavigationTracker: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('NAVIGATION: Route changed to:', location.pathname);
    console.log('NAVIGATION: Full location:', location);
  }, [location]);
  
  return null;
};

// App Routes Component (needs to be inside AuthProvider)
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Debug logging
  console.log('AppRoutes render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes - Always accessible */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/support" element={<Support />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/api" element={<API />} />
          
          {/* Solution pages */}
          <Route path="/solutions/retail" element={<Retail />} />
          <Route path="/solutions/restaurant" element={<Restaurant />} />
          <Route path="/solutions/salon" element={<Salon />} />
          <Route path="/solutions/multi-location" element={<MultiLocation />} />
          
          {/* Company pages */}
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/press" element={<Press />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/community" element={<Community />} />
          
          {/* Support pages */}
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/status" element={<SystemStatus />} />
          
          {/* Other pages */}
          <Route path="/demo" element={<div className="p-8"><h1 className="text-2xl">Demo - Coming Soon</h1></div>} />
          <Route path="/privacy" element={<div className="p-8"><h1 className="text-2xl">Privacy Policy - Coming Soon</h1></div>} />
          <Route path="/terms" element={<div className="p-8"><h1 className="text-2xl">Terms of Service - Coming Soon</h1></div>} />
          <Route path="/security" element={<div className="p-8"><h1 className="text-2xl">Security - Coming Soon</h1></div>} />
          
          <Route path="/login" element={isLoading ? (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : <Login />} />
          
          {/* Protected App Routes - Require authentication and settings */}
          <Route path="/app" element={
            <ProtectedRoute>
              <SettingsProvider>
                <Layout />
              </SettingsProvider>
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
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
