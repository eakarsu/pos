import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  CogIcon,
  BanknotesIcon,
  ClockIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: CreditCardIcon,
      title: 'Payment Processing',
      description: 'Accept all major payment methods including cash, credit cards, debit cards, and mobile payments.',
      features: [
        'EMV chip card processing',
        'Contactless payments (NFC)',
        'Mobile wallet support (Apple Pay, Google Pay)',
        'Split payments and partial refunds',
        'Automatic tip calculations',
        'Multi-currency support'
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: 'Inventory Management',
      description: 'Complete control over your stock with real-time tracking and automated alerts.',
      features: [
        'Real-time stock level tracking',
        'Low stock alerts and notifications',
        'Barcode scanning and generation',
        'Supplier management',
        'Purchase order creation',
        'Stock movement history'
      ]
    },
    {
      icon: ChartBarIcon,
      title: 'Sales Analytics',
      description: 'Comprehensive reporting and analytics to understand your business performance.',
      features: [
        'Real-time sales dashboards',
        'Daily, weekly, monthly reports',
        'Product performance analysis',
        'Employee sales tracking',
        'Customer behavior insights',
        'Export data to Excel/CSV'
      ]
    },
    {
      icon: UserGroupIcon,
      title: 'Customer Management',
      description: 'Build lasting relationships with comprehensive customer profiles and loyalty programs.',
      features: [
        'Customer profiles and history',
        'Loyalty points program',
        'Email marketing integration',
        'Customer segmentation',
        'Purchase history tracking',
        'Birthday and anniversary reminders'
      ]
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile POS',
      description: 'Take your business anywhere with mobile-optimized POS functionality.',
      features: [
        'Tablet and smartphone support',
        'Offline mode capability',
        'Mobile receipt printing',
        'Line-busting during peak hours',
        'Pop-up shop ready',
        'Delivery and pickup orders'
      ]
    },
    {
      icon: LockClosedIcon,
      title: 'Security & Compliance',
      description: 'Enterprise-grade security to protect your business and customer data.',
      features: [
        'PCI DSS compliance',
        'End-to-end encryption',
        'User role management',
        'Audit trails and logging',
        'Two-factor authentication',
        'Regular security updates'
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: BanknotesIcon,
      title: 'Multi-Payment Options',
      description: 'Support for cash, cards, mobile payments, gift cards, and store credit.'
    },
    {
      icon: ClockIcon,
      title: 'Time Clock Integration',
      description: 'Track employee hours and integrate with payroll systems.'
    },
    {
      icon: DocumentTextIcon,
      title: 'Receipt Customization',
      description: 'Customize receipts with your branding and promotional messages.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Multi-Location Support',
      description: 'Manage multiple stores from a single dashboard with centralized reporting.'
    },
    {
      icon: CogIcon,
      title: 'API Integration',
      description: 'Connect with your existing tools through our comprehensive API.'
    },
    {
      icon: CloudIcon,
      title: 'Cloud Backup',
      description: 'Automatic data backup and synchronization across all devices.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl font-bold text-blue-600">POS Pro</Link>
            <nav className="hidden md:flex space-x-8">
              <Link to="/features" className="text-blue-600 font-medium">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link to="/solutions" className="text-gray-600 hover:text-blue-600 transition-colors">Solutions</Link>
              <Link to="/resources" className="text-gray-600 hover:text-blue-600 transition-colors">Resources</Link>
              <Link to="/support" className="text-gray-600 hover:text-blue-600 transition-colors">Support</Link>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for Every Business
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover all the tools you need to streamline operations, increase sales, 
            and grow your business with our comprehensive POS system.
          </p>
          <Link 
            to="/app/dashboard" 
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your business efficiently and effectively.
            </p>
          </div>

          <div className="space-y-20">
            {mainFeatures.map((feature, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-lg text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-8 h-80 flex items-center justify-center">
                    <feature.icon className="h-32 w-32 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Additional Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Even more tools to help you succeed and stand out from the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how our POS system can transform your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/app/dashboard" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/demo" 
              className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
