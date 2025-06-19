import React from 'react';
import { Link } from 'react-router-dom';
import { BuildingStorefrontIcon, CakeIcon, ScissorsIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const Solutions: React.FC = () => {
  const solutions = [
    {
      icon: BuildingStorefrontIcon,
      title: 'Retail',
      description: 'Perfect for clothing stores, electronics, and general retail businesses.',
      features: ['Inventory management', 'Barcode scanning', 'Customer loyalty programs', 'Multi-location support'],
      link: '/solutions/retail'
    },
    {
      icon: CakeIcon,
      title: 'Restaurant',
      description: 'Designed for restaurants, cafes, and food service businesses.',
      features: ['Table management', 'Kitchen display', 'Order tracking', 'Split billing'],
      link: '/solutions/restaurant'
    },
    {
      icon: ScissorsIcon,
      title: 'Salon & Spa',
      description: 'Tailored for beauty salons, spas, and wellness centers.',
      features: ['Appointment booking', 'Service packages', 'Staff scheduling', 'Client profiles'],
      link: '/solutions/salon'
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Multi-location',
      description: 'Manage multiple stores or locations from one central dashboard.',
      features: ['Centralized reporting', 'Inventory sync', 'Staff management', 'Performance analytics'],
      link: '/solutions/multi-location'
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
              <Link to="/solutions" className="text-blue-600 font-medium">Solutions</Link>
              <Link to="/resources" className="text-gray-600 hover:text-blue-600 transition-colors">Resources</Link>
              <Link to="/support" className="text-gray-600 hover:text-blue-600 transition-colors">Support</Link>
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
            Solutions for Every Business
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover how our POS system adapts to your specific industry needs and business requirements.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <solution.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{solution.title}</h3>
                <p className="text-gray-600 mb-4">{solution.description}</p>
                <ul className="space-y-2 mb-6">
                  {solution.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={solution.link} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Solutions;
