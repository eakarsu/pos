import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  CreditCardIcon, 
  BuildingLibraryIcon, 
  EnvelopeIcon, 
  ChartBarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Integrations: React.FC = () => {
  const integrationCategories = [
    {
      title: 'Payment Processing',
      icon: CreditCardIcon,
      integrations: [
        { name: 'Stripe', description: 'Accept credit cards and digital payments', logo: '💳' },
        { name: 'Square', description: 'Complete payment processing solution', logo: '⬜' },
        { name: 'PayPal', description: 'Global payment platform', logo: '🅿️' },
        { name: 'Authorize.Net', description: 'Secure payment gateway', logo: '🔐' }
      ]
    },
    {
      title: 'Accounting & Finance',
      icon: BuildingLibraryIcon,
      integrations: [
        { name: 'QuickBooks', description: 'Sync sales data with QuickBooks', logo: '📊' },
        { name: 'Xero', description: 'Cloud-based accounting software', logo: '📈' },
        { name: 'FreshBooks', description: 'Invoice and expense tracking', logo: '📋' },
        { name: 'Wave', description: 'Free accounting software', logo: '🌊' }
      ]
    },
    {
      title: 'E-commerce',
      icon: ShoppingCartIcon,
      integrations: [
        { name: 'Shopify', description: 'Sync online and offline inventory', logo: '🛍️' },
        { name: 'WooCommerce', description: 'WordPress e-commerce plugin', logo: '🛒' },
        { name: 'Magento', description: 'Enterprise e-commerce platform', logo: '🏪' },
        { name: 'BigCommerce', description: 'Cloud e-commerce platform', logo: '🏬' }
      ]
    },
    {
      title: 'Marketing & CRM',
      icon: UserGroupIcon,
      integrations: [
        { name: 'Mailchimp', description: 'Email marketing automation', logo: '📧' },
        { name: 'HubSpot', description: 'Complete CRM platform', logo: '🎯' },
        { name: 'Salesforce', description: 'World\'s #1 CRM', logo: '☁️' },
        { name: 'Constant Contact', description: 'Email and social marketing', logo: '📬' }
      ]
    },
    {
      title: 'Analytics & Reporting',
      icon: ChartBarIcon,
      integrations: [
        { name: 'Google Analytics', description: 'Web and app analytics', logo: '📊' },
        { name: 'Tableau', description: 'Business intelligence platform', logo: '📈' },
        { name: 'Power BI', description: 'Microsoft business analytics', logo: '⚡' },
        { name: 'Looker', description: 'Modern BI and data platform', logo: '👀' }
      ]
    },
    {
      title: 'Communication',
      icon: EnvelopeIcon,
      integrations: [
        { name: 'Slack', description: 'Team communication platform', logo: '💬' },
        { name: 'Microsoft Teams', description: 'Collaboration platform', logo: '👥' },
        { name: 'Twilio', description: 'SMS and voice communications', logo: '📱' },
        { name: 'Zoom', description: 'Video conferencing', logo: '📹' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Integrations
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect your POS system with the tools you already use. Streamline your workflow 
            with our extensive library of integrations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Browse All Integrations
            </button>
            <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              Request Integration
            </button>
          </div>
        </div>
      </section>

      {/* Integration Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Integration Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find the perfect integrations for your business needs across all major categories.
            </p>
          </div>

          <div className="space-y-16">
            {integrationCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                    <category.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.integrations.map((integration, integrationIndex) => (
                    <div key={integrationIndex} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">{integration.logo}</span>
                        <h4 className="text-lg font-semibold text-gray-900">{integration.name}</h4>
                      </div>
                      <p className="text-gray-600 mb-4">{integration.description}</p>
                      <Link 
                        to={`/integrations/${integration.name.toLowerCase().replace(/\s+/g, '-').replace('.', '')}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Learn More →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Use Integrations?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Integrations help you work smarter, not harder, by connecting all your business tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Time</h3>
              <p className="text-gray-600">
                Automate data sync between systems and eliminate manual data entry.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reduce Errors</h3>
              <p className="text-gray-600">
                Minimize human error with automated data synchronization across platforms.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Better Insights</h3>
              <p className="text-gray-600">
                Get a complete view of your business with unified data across all tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Integration CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Need a Custom Integration?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Don't see the integration you need? Our team can build custom integrations 
            to connect your POS system with any third-party service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Request Custom Integration
            </button>
            <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              View API Documentation
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Integrations;
