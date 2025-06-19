import React from 'react';
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, PhoneIcon, EnvelopeIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const Support: React.FC = () => {
  const supportOptions = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      availability: '24/7 Support',
      action: 'Start Chat'
    },
    {
      icon: PhoneIcon,
      title: 'Phone Support',
      description: 'Speak directly with our experts',
      availability: 'Mon-Fri 9AM-6PM EST',
      action: 'Call Now'
    },
    {
      icon: EnvelopeIcon,
      title: 'Email Support',
      description: 'Send us your questions and we\'ll respond quickly',
      availability: 'Response within 2 hours',
      action: 'Send Email'
    },
    {
      icon: QuestionMarkCircleIcon,
      title: 'Help Center',
      description: 'Browse our comprehensive knowledge base',
      availability: 'Self-service 24/7',
      action: 'Browse Articles'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">POS Pro</Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link to="/solutions" className="text-gray-600 hover:text-blue-600 transition-colors">Solutions</Link>
              <Link to="/resources" className="text-gray-600 hover:text-blue-600 transition-colors">Resources</Link>
              <Link to="/support" className="text-blue-600 font-medium">Support</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            We're Here to Help
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get the support you need, when you need it. Our team is ready to help you succeed.
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportOptions.map((option, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <option.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-gray-600 mb-2">{option.description}</p>
                <p className="text-sm text-gray-500 mb-4">{option.availability}</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  {option.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
};

export default Support;
