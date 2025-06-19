import React from 'react';
import { Link } from 'react-router-dom';

const Retail: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl font-bold text-blue-600">POS Pro</Link>
            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Retail POS Solution</h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your retail operations with our comprehensive POS system designed specifically for retail businesses.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
              <ul className="space-y-2">
                <li>• Advanced inventory management</li>
                <li>• Barcode scanning and printing</li>
                <li>• Customer loyalty programs</li>
                <li>• Multi-location support</li>
                <li>• Real-time reporting</li>
                <li>• Employee management</li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Perfect For</h2>
              <ul className="space-y-2">
                <li>• Clothing stores</li>
                <li>• Electronics retailers</li>
                <li>• Gift shops</li>
                <li>• Bookstores</li>
                <li>• Sporting goods stores</li>
                <li>• General merchandise</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Retail;
