import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CreditCardIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const Stripe: React.FC = () => {
  const features = [
    'Accept all major credit and debit cards',
    'Support for Apple Pay, Google Pay, and other digital wallets',
    'Real-time fraud detection and prevention',
    'Automatic PCI compliance',
    'Instant payouts to your bank account',
    'Detailed transaction reporting and analytics',
    'Recurring billing and subscription management',
    'International payment processing',
    'Mobile-optimized checkout experience',
    'Developer-friendly APIs and webhooks'
  ];

  const pricingTiers = [
    {
      name: 'Standard',
      rate: '2.9% + 30¢',
      description: 'Per successful card charge'
    },
    {
      name: 'Custom',
      rate: 'Volume pricing',
      description: 'For businesses processing $80k+ monthly'
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
            <span className="text-gray-900">Stripe</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mr-6">
              <span className="text-3xl">💳</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Stripe Integration</h1>
              <p className="text-xl text-gray-600">Accept credit cards and digital payments with industry-leading security</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing</h2>
              <div className="space-y-4">
                {pricingTiers.map((tier, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{tier.name}</h3>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{tier.rate}</div>
                    <p className="text-gray-600">{tier.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Process</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Create a Stripe account at stripe.com</li>
                  <li>Complete business verification</li>
                  <li>Get your API keys from the Stripe dashboard</li>
                  <li>Enter your Stripe credentials in POS Pro settings</li>
                  <li>Test the integration with a small transaction</li>
                  <li>Go live and start accepting payments!</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link 
              to="/app/settings?tab=integrations&integration=stripe"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors mr-4 inline-block"
            >
              Enable Stripe Integration
            </Link>
            <Link 
              to="/support" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Stripe;
