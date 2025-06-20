import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const QuickBooks: React.FC = () => {
  const features = [
    'Automatic sync of sales data to QuickBooks',
    'Real-time inventory updates',
    'Customer information synchronization',
    'Tax calculation and reporting',
    'Expense tracking integration',
    'Financial reporting and analytics',
    'Multi-location support',
    'Automated journal entries',
    'Bank reconciliation assistance',
    'Year-end reporting preparation'
  ];

  const syncOptions = [
    {
      name: 'Sales Data',
      description: 'Daily sales totals, individual transactions, and payment methods'
    },
    {
      name: 'Inventory',
      description: 'Stock levels, product costs, and inventory adjustments'
    },
    {
      name: 'Customers',
      description: 'Customer profiles, contact information, and purchase history'
    },
    {
      name: 'Taxes',
      description: 'Tax calculations, exemptions, and reporting data'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/integrations" className="hover:text-blue-600 flex items-center">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Integrations
            </Link>
            <span>/</span>
            <span className="text-gray-900">QuickBooks</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mr-6">
              <span className="text-3xl">📊</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">QuickBooks Integration</h1>
              <p className="text-xl text-gray-600">Seamlessly sync your POS data with QuickBooks for streamlined accounting</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Integration Benefits</h2>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What Gets Synced</h2>
              <div className="space-y-4">
                {syncOptions.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.name}</h3>
                    <p className="text-gray-600">{option.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Requirements</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• QuickBooks Online or Desktop version</li>
                  <li>• Admin access to your QuickBooks account</li>
                  <li>• Active POS Pro subscription</li>
                  <li>• Matching chart of accounts setup</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sync Frequency Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Real-time</div>
                <p className="text-gray-600">Instant sync for critical data</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Hourly</div>
                <p className="text-gray-600">Regular updates throughout the day</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Daily</div>
                <p className="text-gray-600">End-of-day batch processing</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors mr-4">
              Connect QuickBooks
            </button>
            <Link 
              to="/support" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Setup Guide
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuickBooks;
