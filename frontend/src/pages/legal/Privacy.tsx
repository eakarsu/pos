import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ShieldCheckIcon, EyeIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Privacy: React.FC = () => {
  const lastUpdated = "December 20, 2024";

  const sections = [
    {
      title: "Information We Collect",
      icon: EyeIcon,
      content: [
        "Account information (name, email, business details)",
        "Transaction data processed through our POS system",
        "Usage analytics and system performance data",
        "Customer data you input into our system",
        "Payment information (processed securely through our payment partners)",
        "Device and browser information for security purposes"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: UserGroupIcon,
      content: [
        "Provide and maintain our POS services",
        "Process transactions and generate reports",
        "Improve our software and user experience",
        "Provide customer support and technical assistance",
        "Send important service updates and notifications",
        "Comply with legal obligations and prevent fraud"
      ]
    },
    {
      title: "Data Protection",
      icon: ShieldCheckIcon,
      content: [
        "All data is encrypted in transit and at rest",
        "Regular security audits and penetration testing",
        "SOC 2 Type II compliance",
        "PCI DSS Level 1 certification for payment data",
        "Access controls and employee background checks",
        "Automated backup and disaster recovery systems"
      ]
    },
    {
      title: "Your Rights",
      icon: LockClosedIcon,
      content: [
        "Access your personal data at any time",
        "Request correction of inaccurate information",
        "Delete your account and associated data",
        "Export your data in standard formats",
        "Opt-out of non-essential communications",
        "File complaints with data protection authorities"
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
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
              At ElitePos, we are committed to protecting your privacy and ensuring the security of your personal and business data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              point-of-sale software and related services.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Third Parties</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• With your explicit consent</li>
                <li>• To comply with legal obligations or court orders</li>
                <li>• With trusted service providers who assist in our operations (under strict confidentiality agreements)</li>
                <li>• In connection with a business transfer or acquisition</li>
                <li>• To protect our rights, property, or safety, or that of our users</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Account data: Retained while your account is active</li>
                <li>• Transaction data: Retained for 7 years for tax and compliance purposes</li>
                <li>• Usage analytics: Aggregated and anonymized after 2 years</li>
                <li>• Support communications: Retained for 3 years</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-700">
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards 
                are in place, including Standard Contractual Clauses approved by the European Commission and adequacy decisions 
                where applicable.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children under 18. If we become aware that we have collected such information, we will 
                take steps to delete it promptly.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by email 
                or through our service. Your continued use of our services after such modifications constitutes your 
                acknowledgment and acceptance of the updated policy.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About This Policy?</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p>Email: privacy@elitepos.chat</p>
              <p>Phone: 1-800-ELITE-POS</p>
              <p>Address: 123 Business Ave, Suite 100, Tech City, TC 12345</p>
            </div>
            <div className="mt-6">
              <Link 
                to="/contact" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
