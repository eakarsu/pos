import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-gray-300 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/integrations" className="text-gray-300 hover:text-white transition-colors">Integrations</Link></li>
              <li><Link to="/api" className="text-gray-300 hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2">
              <li><Link to="/solutions/retail" className="text-gray-300 hover:text-white transition-colors">Retail</Link></li>
              <li><Link to="/solutions/restaurant" className="text-gray-300 hover:text-white transition-colors">Restaurant</Link></li>
              <li><Link to="/solutions/salon" className="text-gray-300 hover:text-white transition-colors">Salon & Spa</Link></li>
              <li><Link to="/solutions/multi-location" className="text-gray-300 hover:text-white transition-colors">Multi-location</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/status" className="text-gray-300 hover:text-white transition-colors">System Status</Link></li>
              <li><Link to="/community" className="text-gray-300 hover:text-white transition-colors">Community</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/press" className="text-gray-300 hover:text-white transition-colors">Press</Link></li>
              <li><Link to="/partners" className="text-gray-300 hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300">
            © 2024 POS Pro. All rights reserved.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms</Link>
            <Link to="/security" className="text-gray-300 hover:text-white transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
