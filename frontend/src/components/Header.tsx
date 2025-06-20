import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">POS Pro</Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/features" 
              className={`transition-colors ${isActive('/features') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className={`transition-colors ${isActive('/pricing') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Pricing
            </Link>
            <Link 
              to="/solutions" 
              className={`transition-colors ${isActive('/solutions') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Solutions
            </Link>
            <Link 
              to="/resources" 
              className={`transition-colors ${isActive('/resources') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Resources
            </Link>
            <Link 
              to="/support" 
              className={`transition-colors ${isActive('/support') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Support
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
            <Link to="/app/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
