import React from 'react';
import { Link } from 'react-router-dom';
import { ChatBubbleOvalLeftEllipsisIcon, PhoneIcon, EnvelopeIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Support: React.FC = () => {
  const supportOptions = [
    {
      icon: ChatBubbleOvalLeftEllipsisIcon,
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
      <Header />

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

      <Footer />
    </div>
  );
};

export default Support;
