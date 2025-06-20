import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small businesses just getting started',
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        'Up to 1 location',
        'Up to 3 users',
        'Basic POS functionality',
        'Inventory management',
        'Sales reporting',
        'Customer management',
        'Email support',
        'Mobile app access'
      ],
      limitations: [
        'Advanced analytics',
        'Multi-location support',
        'API access',
        'Custom integrations'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Professional',
      description: 'Ideal for growing businesses with advanced needs',
      monthlyPrice: 79,
      yearlyPrice: 790,
      features: [
        'Up to 5 locations',
        'Unlimited users',
        'Advanced POS features',
        'Advanced inventory management',
        'Detailed analytics & reporting',
        'Customer loyalty programs',
        'Priority support',
        'Mobile app access',
        'API access',
        'Third-party integrations',
        'Employee time tracking',
        'Custom receipt templates'
      ],
      limitations: [
        'White-label options',
        'Dedicated account manager'
      ],
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      description: 'For large businesses with complex requirements',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      features: [
        'Unlimited locations',
        'Unlimited users',
        'All POS features',
        'Advanced inventory & supply chain',
        'Custom analytics & reporting',
        'Advanced customer management',
        '24/7 dedicated support',
        'Mobile app access',
        'Full API access',
        'Custom integrations',
        'Employee management suite',
        'White-label options',
        'Dedicated account manager',
        'Custom training & onboarding',
        'SLA guarantees'
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const addOns = [
    {
      name: 'Additional Location',
      monthlyPrice: 15,
      description: 'Add extra locations to your plan'
    },
    {
      name: 'Advanced Analytics',
      monthlyPrice: 25,
      description: 'Deep insights and custom reporting'
    },
    {
      name: 'E-commerce Integration',
      monthlyPrice: 35,
      description: 'Sync with online stores and marketplaces'
    },
    {
      name: 'Accounting Integration',
      monthlyPrice: 20,
      description: 'Connect with QuickBooks, Xero, and more'
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: typeof plans[0]) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const yearlyCost = plan.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your business size and needs. All plans include a 30-day free trial.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Save up to 17%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-lg border-2 p-8 ${
                  plan.popular
                    ? 'border-blue-600 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${getPrice(plan)}
                    </span>
                    <span className="text-gray-600">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-600">
                      Save ${getSavings(plan)} per year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <li key={limitationIndex} className="flex items-center">
                      <XMarkIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-400">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.cta === 'Contact Sales' ? '/contact' : '/app/dashboard'}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Add-ons & Extensions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enhance your POS system with additional features and integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addOn, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{addOn.name}</h3>
                <p className="text-gray-600 mb-4">{addOn.description}</p>
                <div className="text-2xl font-bold text-blue-600">
                  ${addOn.monthlyPrice}/month
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No, there are no setup fees. You can start using our POS system immediately after signing up.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards and ACH bank transfers for annual plans.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a contract or can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                No contracts required. You can cancel your subscription at any time with 30 days notice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your 30-day free trial today. No credit card required.
          </p>
          <Link 
            to="/app/dashboard" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
