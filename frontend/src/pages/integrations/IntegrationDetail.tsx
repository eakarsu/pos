import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const IntegrationDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  
  // Convert URL parameter back to display name
  const displayName = name?.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || 'Integration';

  // Generic features that apply to most integrations
  const features = [
    'Easy one-click setup process',
    'Real-time data synchronization',
    'Secure API connections',
    'Automatic error handling and retry logic',
    'Comprehensive activity logging',
    'Custom field mapping options',
    'Multi-location support',
    'Regular sync health monitoring',
    'Data backup and recovery',
    '24/7 technical support'
  ];

  const setupSteps = [
    'Navigate to Integrations in your POS Pro dashboard',
    'Find and select the integration you want to enable',
    'Follow the authentication process',
    'Configure your sync preferences',
    'Test the connection with sample data',
    'Enable live synchronization'
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
            <span className="text-gray-900">{displayName}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mr-6">
              <span className="text-3xl">🔗</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{displayName} Integration</h1>
              <p className="text-xl text-gray-600">Connect {displayName} with your POS system for streamlined operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Integration Features</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Process</h2>
              <ol className="space-y-4">
                {setupSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  Our support team is ready to help you set up this integration. 
                  We also offer guided setup sessions for complex integrations.
                </p>
                <Link 
                  to="/support" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Support →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 rounded-lg p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Connect {displayName}?</h3>
              <p className="text-gray-600 mb-6">
                Start streamlining your workflow with this powerful integration.
              </p>
              <Link 
                to={`/app/settings?tab=integrations&integration=${name}`}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors mr-4 inline-block"
              >
                Enable Integration
              </Link>
              <Link 
                to="/support" 
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Get Help
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IntegrationDetail;
