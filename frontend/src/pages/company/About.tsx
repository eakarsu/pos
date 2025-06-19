import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About POS Pro</h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-8">
              We're on a mission to empower businesses of all sizes with powerful, easy-to-use point-of-sale technology.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="mb-6">
              Founded in 2020, POS Pro was born from the frustration of dealing with outdated, complicated POS systems. 
              Our founders, experienced entrepreneurs themselves, knew there had to be a better way.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-6">
              To provide businesses with intuitive, powerful POS solutions that help them grow, succeed, and focus on what they do best.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Customer-first approach</li>
              <li>Continuous innovation</li>
              <li>Transparency and honesty</li>
              <li>Reliability and security</li>
              <li>Empowering small businesses</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
