import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const Shopify: React.FC = () => {
  const features = [
    'Unified inventory across online and offline channels',
    'Real-time stock level synchronization',
    'Automatic product catalog sync',
    'Order management from both channels',
    'Customer data unification',
    'Centralized reporting and analytics',
    'Price synchronization and management',
    'Promotion and discount coordination',
    'Multi-location inventory tracking',
    'Automated fulfillment workflows'
  ];

  const benefits = [
    {
      title: 'Omnichannel Experience',
      description: 'Provide seamless shopping experience across online and in-store'
    },
    {
      title: 'Inventory Accuracy',
      description: 'Prevent overselling with real-time inventory updates'
    },
    {
      title: 'Unified Customer Data',
      description: 'Single view of customer interactions across all channels'
    },
    {
      title: 'Streamlined Operations',
      description: 'Manage everything from one central dashboard'
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
            <span className="text-gray-900">Shopify</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mr-6">
              <span className="text-3xl">🛍️</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopify Integration</h1>
              <p className="text-xl text-gray-600">Sync your online and offline inventory for a unified retail experience</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Benefits</h2>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Product Catalog</span>
                    <span className="text-green-600 font-medium">Bi-directional</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Inventory Levels</span>
                    <span className="text-green-600 font-medium">Real-time</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Customer Data</span>
                    <span className="text-green-600 font-medium">Unified</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Orders</span>
                    <span className="text-green-600 font-medium">Automatic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-green-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Setup Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">1</div>
                <h4 className="font-semibold text-gray-900 mb-2">Connect Store</h4>
                <p className="text-sm text-gray-600">Link your Shopify store to POS Pro</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">2</div>
                <h4 className="font-semibold text-gray-900 mb-2">Map Products</h4>
                <p className="text-sm text-gray-600">Match products between systems</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">3</div>
                <h4 className="font-semibold text-gray-900 mb-2">Configure Sync</h4>
                <p className="text-sm text-gray-600">Set sync preferences and rules</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">4</div>
                <h4 className="font-semibold text-gray-900 mb-2">Go Live</h4>
                <p className="text-sm text-gray-600">Start unified operations</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors mr-4">
              Connect Shopify Store
            </button>
            <Link 
              to="/support" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Integration Guide
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shopify;
