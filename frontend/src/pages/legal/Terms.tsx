import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { DocumentTextIcon, ScaleIcon, ExclamationTriangleIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const Terms: React.FC = () => {
  const lastUpdated = "December 20, 2024";

  const sections = [
    {
      title: "Service Description",
      icon: DocumentTextIcon,
      content: [
        "POS Pro provides cloud-based point-of-sale software and related services",
        "Features include transaction processing, inventory management, and reporting",
        "Services are provided on a subscription basis with various plan options",
        "We reserve the right to modify or discontinue features with notice",
        "Service availability is subject to maintenance windows and updates",
        "Third-party integrations are subject to their respective terms"
      ]
    },
    {
      title: "User Responsibilities",
      icon: ScaleIcon,
      content: [
        "Provide accurate account and business information",
        "Maintain the security of your login credentials",
        "Use the service in compliance with applicable laws and regulations",
        "Not attempt to reverse engineer or compromise our systems",
        "Report security vulnerabilities or bugs promptly",
        "Ensure your staff is properly trained on the system"
      ]
    },
    {
      title: "Payment Terms",
      icon: CreditCardIcon,
      content: [
        "Subscription fees are billed monthly or annually in advance",
        "Transaction fees apply to payment processing services",
        "All fees are non-refundable except as required by law",
        "Price changes require 30 days advance notice",
        "Accounts may be suspended for non-payment after 15 days",
        "You're responsible for all taxes related to your use of the service"
      ]
    },
    {
      title: "Limitations and Disclaimers",
      icon: ExclamationTriangleIcon,
      content: [
        "Service is provided 'as is' without warranties of any kind",
        "We don't guarantee 100% uptime or error-free operation",
        "Our liability is limited to the amount paid in the preceding 12 months",
        "We're not liable for indirect, consequential, or punitive damages",
        "You're responsible for maintaining backups of your data",
        "Force majeure events may affect service availability"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            These terms govern your use of POS Pro services. Please read them carefully.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of ElitePos's software, services, and website. 
              By using our services, you agree to be bound by these Terms. If you don't agree to these Terms, 
              please don't use our services.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                    <section.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Additional Sections */}
          <div className="mt-12 space-y-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Termination</h2>
              <p className="text-gray-700 mb-4">
                Either party may terminate the service agreement under the following conditions:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• You may cancel your subscription at any time with 30 days notice</li>
                <li>• We may suspend or terminate accounts for violation of these Terms</li>
                <li>• We may terminate the service with 90 days notice</li>
                <li>• Upon termination, you have 30 days to export your data</li>
                <li>• All outstanding fees become immediately due upon termination</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                Ownership and licensing of intellectual property:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• POS Pro retains all rights to our software, trademarks, and content</li>
                <li>• You retain ownership of your business data and customer information</li>
                <li>• You grant us a license to process your data to provide our services</li>
                <li>• You may not copy, modify, or distribute our software</li>
                <li>• Any feedback you provide may be used to improve our services</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your data rights and our responsibilities:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• We process your data in accordance with our Privacy Policy</li>
                <li>• You're responsible for the accuracy of data you input</li>
                <li>• We implement industry-standard security measures</li>
                <li>• You must comply with applicable data protection laws</li>
                <li>• We provide data export tools upon request</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">
                You may not use our services for:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Illegal activities or violation of applicable laws</li>
                <li>• Processing payments for prohibited businesses (as defined by payment processors)</li>
                <li>• Attempting to gain unauthorized access to our systems</li>
                <li>• Interfering with other users' access to the service</li>
                <li>• Transmitting malware, viruses, or harmful code</li>
                <li>• Violating intellectual property rights of others</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                Resolution of disputes between you and ElitePos:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Most disputes can be resolved through our customer support</li>
                <li>• Formal disputes are subject to binding arbitration</li>
                <li>• Arbitration will be conducted under AAA Commercial Arbitration Rules</li>
                <li>• Class action lawsuits are waived</li>
                <li>• Governing law is the State of Delaware, USA</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700">
                We may modify these Terms from time to time. Material changes will be communicated via email or 
                through our service at least 30 days before they take effect. Your continued use of the service 
                after changes become effective constitutes acceptance of the new Terms.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About These Terms?</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about these Terms of Service, please contact our legal team:
            </p>
            <div className="space-y-2 text-gray-700">
              <p>Email: legal@elitepos.chat</p>
              <p>Phone: 1-800-ELITE-POS</p>
              <p>Address: 123 Business Ave, Suite 100, Tech City, TC 12345</p>
            </div>
            <div className="mt-6">
              <Link 
                to="/contact" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Legal Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
