import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  KeyIcon, 
  EyeSlashIcon,
  ServerIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

const Security: React.FC = () => {
  const lastUpdated = "December 20, 2024";

  const securityFeatures = [
    {
      title: "Data Encryption",
      icon: LockClosedIcon,
      description: "All data is encrypted in transit and at rest using industry-standard AES-256 encryption",
      features: [
        "TLS 1.3 for all data transmission",
        "AES-256 encryption for data at rest",
        "End-to-end encryption for sensitive data",
        "Encrypted database backups",
        "Secure key management with HSMs"
      ]
    },
    {
      title: "Access Controls",
      icon: KeyIcon,
      description: "Comprehensive access management and authentication systems",
      features: [
        "Multi-factor authentication (MFA)",
        "Role-based access control (RBAC)",
        "Single sign-on (SSO) integration",
        "Session management and timeout",
        "API key authentication and rotation"
      ]
    },
    {
      title: "Infrastructure Security",
      icon: ServerIcon,
      description: "Secure cloud infrastructure with multiple layers of protection",
      features: [
        "AWS/Azure enterprise-grade hosting",
        "Network segmentation and firewalls",
        "DDoS protection and mitigation",
        "Intrusion detection and prevention",
        "24/7 security monitoring"
      ]
    },
    {
      title: "Privacy Protection",
      icon: EyeSlashIcon,
      description: "Strong privacy controls to protect your business and customer data",
      features: [
        "Data minimization principles",
        "Anonymization and pseudonymization",
        "Right to be forgotten compliance",
        "Data portability and export",
        "Privacy by design architecture"
      ]
    }
  ];

  const certifications = [
    {
      name: "SOC 2 Type II",
      description: "Annual third-party audits of our security controls and processes",
      status: "Certified"
    },
    {
      name: "PCI DSS Level 1",
      description: "Highest level of payment card industry data security compliance",
      status: "Certified"
    },
    {
      name: "ISO 27001",
      description: "International standard for information security management systems",
      status: "In Progress"
    },
    {
      name: "GDPR Compliant",
      description: "Full compliance with European General Data Protection Regulation",
      status: "Compliant"
    },
    {
      name: "CCPA Compliant",
      description: "California Consumer Privacy Act compliance for US customers",
      status: "Compliant"
    },
    {
      name: "HIPAA Ready",
      description: "Healthcare data protection capabilities for medical practices",
      status: "Available"
    }
  ];

  const securityPractices = [
    "Regular penetration testing by third-party security firms",
    "Vulnerability scanning and automated security testing",
    "Employee security training and background checks",
    "Incident response plan with 24/7 security team",
    "Regular security audits and compliance reviews",
    "Secure software development lifecycle (SSDLC)",
    "Data backup and disaster recovery procedures",
    "Physical security controls at data centers"
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Security & Compliance
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Your data security is our top priority. Learn about our comprehensive security measures and compliance certifications.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Security Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We implement multiple layers of security to protect your business data, customer information, 
              and payment transactions with industry-leading standards and practices.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Certifications & Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We maintain the highest standards of security and compliance with regular audits and certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    cert.status === 'Certified' || cert.status === 'Compliant' 
                      ? 'bg-green-100 text-green-800' 
                      : cert.status === 'In Progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {cert.status}
                  </span>
                </div>
                <p className="text-gray-600">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Security Practices
            </h2>
            <p className="text-xl text-gray-600">
              Our comprehensive approach to security includes these key practices and procedures.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityPractices.map((practice, index) => (
                <div key={index} className="flex items-start">
                  <DocumentCheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{practice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Incident Response</h2>
            <p className="text-gray-700 mb-6">
              In the unlikely event of a security incident, we have a comprehensive response plan:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">1</div>
                <h4 className="font-semibold text-gray-900 mb-2">Detection</h4>
                <p className="text-sm text-gray-600">24/7 monitoring systems detect potential threats</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">2</div>
                <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                <p className="text-sm text-gray-600">Immediate containment and investigation</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">3</div>
                <h4 className="font-semibold text-gray-900 mb-2">Notification</h4>
                <p className="text-sm text-gray-600">Affected customers notified within 72 hours</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">4</div>
                <h4 className="font-semibold text-gray-900 mb-2">Recovery</h4>
                <p className="text-sm text-gray-600">Systems restored and improvements implemented</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Contact */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Questions or Concerns?</h2>
            <p className="text-gray-700 mb-6">
              Our security team is available to address any questions about our security practices or to receive security reports.
            </p>
            <div className="space-y-2 text-gray-700 mb-6">
              <p>Security Team: security@pospro.com</p>
              <p>Bug Bounty: security-reports@pospro.com</p>
              <p>Emergency Hotline: 1-800-POS-SEC1</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Security Team
              </Link>
              <a 
                href="mailto:security-reports@pospro.com"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Report Security Issue
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Security;
