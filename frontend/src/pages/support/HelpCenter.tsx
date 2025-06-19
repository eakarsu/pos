import React from 'react';
import { Link } from 'react-router-dom';

const HelpCenter: React.FC = () => {
  const categories = [
    {
      title: 'Getting Started',
      articles: [
        'Setting up your POS system',
        'Adding your first products',
        'Processing your first sale',
        'Setting up payment methods'
      ]
    },
    {
      title: 'Inventory Management',
      articles: [
        'Adding and editing products',
        'Managing stock levels',
        'Setting up suppliers',
        'Inventory reports'
      ]
    },
    {
      title: 'Sales & Payments',
      articles: [
        'Processing different payment types',
        'Handling returns and refunds',
        'Managing discounts',
        'Split payments'
      ]
    },
    {
      title: 'Reports & Analytics',
      articles: [
        'Understanding sales reports',
        'Inventory reports',
        'Customer analytics',
        'Exporting data'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl font-bold text-blue-600">POS Pro</Link>
            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Help Center</h1>
          <p className="text-xl text-gray-600 mb-12">
            Find answers to common questions and learn how to get the most out of your POS system.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link to="#" className="text-blue-600 hover:text-blue-700">
                        {article}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;
