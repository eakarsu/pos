import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import StructuredData from './StructuredData';

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQSectionProps {
  title?: string;
  description?: string;
  faqs: FAQItem[];
  className?: string;
  showStructuredData?: boolean;
}

const FAQSection: React.FC<FAQSectionProps> = ({
  title = 'Frequently Asked Questions',
  description = 'Find answers to common questions about ElitePos',
  faqs,
  className = '',
  showStructuredData = true
}) => {
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className={`py-12 ${className}`} aria-labelledby="faq-heading">
      {showStructuredData && (
        <StructuredData
          type="faq"
          faqItems={faqs.map(faq => ({
            question: faq.question,
            answer: faq.answer
          }))}
        />
      )}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openItems.has(index);
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <h3 className="text-lg font-medium text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  {isOpen ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="px-6 pb-4"
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    <div className="text-gray-700 leading-relaxed">
                      {faq.answer.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className={pIndex > 0 ? 'mt-3' : ''}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Still have questions?{' '}
            <a
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

// Default FAQ data for ElitePos
export const defaultFAQs: FAQItem[] = [
  {
    question: "What is ElitePos and how does it work?",
    answer: "ElitePos is a comprehensive point-of-sale system designed specifically for restaurants and food service businesses. It combines order management, inventory tracking, sales analytics, and customer management in one integrated platform. The system works by streamlining your entire operation from taking orders to processing payments and managing your inventory.",
    category: "general"
  },
  {
    question: "How much does ElitePos cost?",
    answer: "ElitePos offers flexible pricing plans to suit businesses of all sizes. Our basic plan starts at $49/month for small restaurants, with advanced plans available for larger operations. All plans include core POS functionality, with higher tiers offering additional features like advanced analytics, multi-location support, and priority customer support. Contact us for a custom quote based on your specific needs.",
    category: "pricing"
  },
  {
    question: "Can I try ElitePos before purchasing?",
    answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial. During this period, you can test all functionality, import your menu, and see how ElitePos works with your business operations. Our support team is available to help you get set up and answer any questions.",
    category: "trial"
  },
  {
    question: "Is my data secure with ElitePos?",
    answer: "Absolutely. We take data security very seriously. ElitePos uses bank-level encryption (SSL/TLS) for all data transmission, secure cloud storage with regular backups, and complies with PCI DSS standards for payment processing. Your customer data, sales information, and business analytics are protected with enterprise-grade security measures.",
    category: "security"
  },
  {
    question: "Does ElitePos work offline?",
    answer: "Yes, ElitePos includes offline functionality to ensure your business never stops. The system can process orders, accept payments, and track inventory even when your internet connection is down. Once connectivity is restored, all data automatically syncs to the cloud, ensuring you never lose any transactions or important business data.",
    category: "technical"
  },
  {
    question: "Can ElitePos integrate with my existing systems?",
    answer: "ElitePos offers extensive integration capabilities with popular business tools including accounting software (QuickBooks, Xero), delivery platforms (DoorDash, Uber Eats), payment processors, and inventory management systems. We also provide API access for custom integrations. Our team can help you connect ElitePos with your existing business ecosystem.",
    category: "integration"
  },
  {
    question: "What kind of support do you provide?",
    answer: "We provide comprehensive support including 24/7 customer service, live chat support, phone support during business hours, extensive documentation, video tutorials, and onboarding assistance. Premium plan customers receive priority support and dedicated account management. We're committed to ensuring your success with ElitePos.",
    category: "support"
  },
  {
    question: "How quickly can I get ElitePos set up?",
    answer: "Most restaurants can be up and running with ElitePos within 24-48 hours. This includes account setup, menu import, staff training, and hardware configuration if needed. Our onboarding team provides step-by-step guidance, and we offer expedited setup services for businesses that need to go live immediately.",
    category: "setup"
  }
];

export default FAQSection;
