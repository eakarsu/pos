import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CodeBracketIcon, KeyIcon, DocumentTextIcon, CubeIcon } from '@heroicons/react/24/outline';

const API: React.FC = () => {
  const endpoints = [
    {
      method: 'GET',
      endpoint: '/api/products',
      description: 'Retrieve all products with pagination',
      response: '{ "products": [...], "total": 150, "page": 1 }'
    },
    {
      method: 'POST',
      endpoint: '/api/products',
      description: 'Create a new product',
      response: '{ "id": "prod_123", "name": "Product Name", ... }'
    },
    {
      method: 'GET',
      endpoint: '/api/sales',
      description: 'Get sales data with filtering options',
      response: '{ "sales": [...], "totalAmount": 1250.00 }'
    },
    {
      method: 'POST',
      endpoint: '/api/transactions',
      description: 'Process a new transaction',
      response: '{ "transactionId": "txn_456", "status": "completed" }'
    },
    {
      method: 'GET',
      endpoint: '/api/inventory',
      description: 'Get current inventory levels',
      response: '{ "items": [...], "lowStock": [...] }'
    },
    {
      method: 'PUT',
      endpoint: '/api/inventory/:id',
      description: 'Update inventory quantity',
      response: '{ "id": "inv_789", "quantity": 50, "updated": true }'
    }
  ];

  const features = [
    {
      icon: KeyIcon,
      title: 'Authentication',
      description: 'Secure API access with JWT tokens and role-based permissions'
    },
    {
      icon: DocumentTextIcon,
      title: 'RESTful Design',
      description: 'Clean, predictable REST API following industry best practices'
    },
    {
      icon: CubeIcon,
      title: 'Real-time Data',
      description: 'WebSocket support for real-time inventory and sales updates'
    },
    {
      icon: CodeBracketIcon,
      title: 'SDKs Available',
      description: 'Official SDKs for JavaScript, Python, PHP, and more'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful API for Developers
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build custom integrations and extend your POS system with our comprehensive REST API.
            Access all your business data programmatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Get API Key
            </button>
            <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              API Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to build powerful integrations with our POS system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              API Endpoints
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Key endpoints to get you started with our API.
            </p>
          </div>

          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mr-3 ${
                        endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono text-gray-900">{endpoint.endpoint}</code>
                    </div>
                    <p className="text-gray-600 mb-4">{endpoint.description}</p>
                  </div>
                  <div className="lg:ml-6">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-md">
                      <p className="text-sm text-gray-600 mb-1">Response:</p>
                      <code className="text-sm text-gray-800">{endpoint.response}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Getting Started
            </h2>
            <p className="text-xl text-gray-600">
              Start building with our API in minutes.
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Get Your API Key</h3>
              <p className="text-gray-600 mb-4">
                Sign up for an account and generate your API key from the dashboard.
              </p>
              <div className="bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm">
                curl -H "Authorization: Bearer YOUR_API_KEY" \<br />
                &nbsp;&nbsp;&nbsp;&nbsp;https://api.pospro.com/v1/products
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Make Your First Request</h3>
              <p className="text-gray-600 mb-4">
                Test the API by fetching your product catalog.
              </p>
              <div className="bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm">
                {`{
  "products": [
    {
      "id": "prod_123",
      "name": "Coffee Mug",
      "price": 12.99,
      "stock": 45
    }
  ],
  "total": 150,
  "page": 1
}`}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Explore the Documentation</h3>
              <p className="text-gray-600 mb-4">
                Check out our comprehensive API documentation for detailed examples and use cases.
              </p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                View Full Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default API;
