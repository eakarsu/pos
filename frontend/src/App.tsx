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

// Minimal App Routes Component for debugging
const AppRoutes: React.FC = () => {
  console.log('AppRoutes render - Current URL:', window.location.href);
  console.log('AppRoutes render - Current pathname:', window.location.pathname);
  
  return (
    <Router>
      <div className="App">
        <div style={{padding: '20px', background: 'lime', margin: '10px', fontSize: '18px'}}>
          DEBUGGING: AppRoutes is rendering. Current path: {window.location.pathname}
        </div>
        <Routes>
          <Route path="/" element={
            <div style={{padding: '40px', background: 'lightblue', fontSize: '24px'}}>
              <h1>ROOT ROUTE IS WORKING!</h1>
              <p>Current URL: {window.location.href}</p>
              <p>Current pathname: {window.location.pathname}</p>
              <p>Time: {new Date().toISOString()}</p>
            </div>
          } />
          <Route path="/login" element={
            <div style={{padding: '40px', background: 'lightcoral', fontSize: '24px'}}>
              <h1>LOGIN ROUTE</h1>
              <p>You are on the login page</p>
            </div>
          } />
          <Route path="*" element={
            <div style={{padding: '40px', background: 'yellow', fontSize: '24px'}}>
              <h1>CATCH-ALL ROUTE</h1>
              <p>Path not found: {window.location.pathname}</p>
            </div>
          } />
        </Routes>
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
