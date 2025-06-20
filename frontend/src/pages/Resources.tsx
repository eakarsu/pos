import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, VideoCameraIcon, AcademicCapIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Resources: React.FC = () => {
  const resources = [
    {
      icon: DocumentTextIcon,
      title: 'Documentation',
      description: 'Complete guides and API documentation to help you get the most out of our POS system.',
      link: '/docs'
    },
    {
      icon: VideoCameraIcon,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides covering all features and best practices.',
      link: '/tutorials'
    },
    {
      icon: AcademicCapIcon,
      title: 'Training Center',
      description: 'Comprehensive training materials for you and your staff.',
      link: '/training'
    },
    {
      icon: ChatBubbleOvalLeftEllipsisIcon,
      title: 'Community Forum',
      description: 'Connect with other users, share tips, and get answers to your questions.',
      link: '/community'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Resources & Learning Center
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Everything you need to succeed with our POS system. From documentation to training materials.
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resources.map((resource, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <resource.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Link to={resource.link} className="text-blue-600 hover:text-blue-700 font-medium">
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Resources;
