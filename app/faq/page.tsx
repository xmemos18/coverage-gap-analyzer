'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFAQFeedback } from '@/hooks/useFAQFeedback';
import ScrollToTop from '@/components/ScrollToTop';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Multi-State Coverage
  {
    category: 'Multi-State Coverage',
    question: 'Can I have health insurance that works in multiple states?',
    answer: 'Yes! Original Medicare works everywhere in the US. For private insurance, look for national PPO plans that have networks in all your states. Avoid HMO and Medicare Advantage plans if you split time between states, as they typically only work in one area.',
  },
  {
    category: 'Multi-State Coverage',
    question: 'What if I spend 6 months in Florida and 6 months in New York?',
    answer: 'This is a classic snowbird situation. Original Medicare + Medigap is ideal if you\'re 65+. Under 65, choose a national PPO plan. Make sure to update your primary residence with your insurer for billing purposes.',
  },
  {
    category: 'Multi-State Coverage',
    question: 'Do I need separate insurance for each state?',
    answer: 'No! That would be expensive and complicated. Instead, get ONE plan with nationwide coverage like Medicare + Medigap (65+) or a national PPO plan (under 65). Avoid state-specific plans if you travel.',
  },

  // Medicare
  {
    category: 'Medicare',
    question: 'What\'s the difference between Original Medicare and Medicare Advantage?',
    answer: 'Original Medicare (Parts A & B) works everywhere with any doctor. Medicare Advantage is a private plan that may have lower premiums but restricts you to specific networks. For multi-state residents, Original Medicare + Medigap is almost always better.',
  },
  {
    category: 'Medicare',
    question: 'What is Medigap and do I need it?',
    answer: 'Medigap (Medicare Supplement) covers the gaps in Original Medicare - like the 20% coinsurance. Plan G covers almost everything and costs $125-200/month. It works nationwide with any Medicare doctor. Highly recommended for multi-state residents.',
  },
  {
    category: 'Medicare',
    question: 'Can I switch from Medicare Advantage back to Original Medicare?',
    answer: 'Yes! During Medicare Open Enrollment (Oct 15 - Dec 7), you can switch. However, getting Medigap may require medical underwriting if you\'re past your guaranteed issue period. Best to start with Original Medicare + Medigap if you travel.',
  },

  // Costs & Subsidies
  {
    category: 'Costs & Subsidies',
    question: 'How much does health insurance cost if I have multiple homes?',
    answer: 'Costs are similar to single-home residents - $400-800/month for individuals, $1,200-2,000/month for families. The key difference is you need plans that work in all locations, which may cost slightly more than local HMO plans.',
  },
  {
    category: 'Costs & Subsidies',
    question: 'Can I get subsidies if I live in multiple states?',
    answer: 'Yes! ACA subsidies are based on your household income, not where you live. Apply through the marketplace in your primary tax residence state. Subsidies can reduce premiums by 50-90% if your income qualifies.',
  },
  {
    category: 'Costs & Subsidies',
    question: 'What counts as income for subsidy purposes?',
    answer: 'Modified Adjusted Gross Income (MAGI) from your tax return. This includes wages, self-employment income, Social Security, investment income, rental income, etc. It does NOT include gifts, loans, or Roth IRA withdrawals.',
  },

  // Enrollment
  {
    category: 'Enrollment',
    question: 'When can I enroll in health insurance?',
    answer: 'ACA Marketplace: Nov 1 - Jan 15 annually. Medicare: Initial Enrollment Period (3 months before/after turning 65) and Annual Enrollment (Oct 15 - Dec 7). Special Enrollment Periods available for life changes like moving, job loss, marriage.',
  },
  {
    category: 'Enrollment',
    question: 'What happens if I miss Open Enrollment?',
    answer: 'You\'ll need a Special Enrollment Period (SEP) qualifying event like moving, losing job coverage, marriage, birth of child. Otherwise, you must wait until next Open Enrollment. Consider short-term insurance as a temporary bridge.',
  },
  {
    category: 'Enrollment',
    question: 'Which state\'s marketplace do I use if I have homes in multiple states?',
    answer: 'Use the marketplace for your PRIMARY tax residence - the state where you file taxes and spend the most time. You only enroll in ONE state\'s marketplace, but the coverage should work in your other states.',
  },

  // Coverage Details
  {
    category: 'Coverage Details',
    question: 'Will my insurance cover emergency care in all states?',
    answer: 'Yes! All ACA plans and Medicare cover emergency care nationwide. Emergency rooms must treat you regardless of network status. Non-emergency care needs to be in-network (PPO gives you more flexibility).',
  },
  {
    category: 'Coverage Details',
    question: 'What\'s the difference between HMO, PPO, and EPO plans?',
    answer: 'HMO: Lowest cost, must use network doctors, need referrals, only works in one area. PPO: Higher cost, large network, no referrals, works in multiple states (BEST for snowbirds). EPO: Middle ground, network required but no referrals.',
  },
  {
    category: 'Coverage Details',
    question: 'Do I need travel insurance if I have health insurance?',
    answer: 'For domestic US travel between your homes: No, your health insurance covers you. For international travel: Yes, consider travel medical insurance as most US plans don\'t cover care outside the country.',
  },

  // Special Situations
  {
    category: 'Special Situations',
    question: 'I work remotely from different states. How does this affect my insurance?',
    answer: 'Get a national PPO plan that covers all the states you work from. Your employer plan may work, or you may need marketplace coverage. Establish one state as your primary residence for tax purposes.',
  },
  {
    category: 'Special Situations',
    question: 'What if my spouse and I live in different states?',
    answer: 'If truly in different states most of the year, you may need separate state plans. More commonly, couples share a primary residence and get one national plan covering both states.',
  },
  {
    category: 'Special Situations',
    question: 'Can I have both employer insurance and marketplace insurance?',
    answer: 'Yes, but you likely won\'t qualify for marketplace subsidies if employer coverage is "affordable" (costs less than 9.12% of income). Compare costs carefully. You can\'t have subsidies + employer coverage.',
  },

  // Medigap Specific
  {
    category: 'Medigap',
    question: 'What\'s the best Medigap plan for people with multiple homes?',
    answer: 'Plan G is the most popular and comprehensive. Plan N is slightly cheaper with small copays. Both work nationwide with any Medicare doctor. Avoid Medicare Advantage for multi-state living.',
  },
  {
    category: 'Medigap',
    question: 'When is the best time to buy Medigap?',
    answer: 'Within 6 months of enrolling in Medicare Part B (usually age 65). This is your "guaranteed issue" period - you can buy any Medigap plan without medical underwriting. After this, you may be denied or charged more.',
  },
  {
    category: 'Medigap',
    question: 'Can I switch Medigap companies to get a lower rate?',
    answer: 'Yes! Medigap Plan G is standardized - all insurance companies offer identical coverage. Shop rates annually and switch to the cheapest company. May require medical underwriting depending on your state.',
  },
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const { saveFeedback, getFeedback } = useFAQFeedback();

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about multi-state health insurance
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results count */}
        {searchQuery && (
          <div className="mb-4 text-gray-600">
            Found {filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'}
          </div>
        )}

        {/* FAQ Items */}
        <div className="space-y-4 mb-12">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-8 text-center">
              <p className="text-xl text-gray-600 mb-4">No questions found matching your search.</p>
              <p className="text-gray-500">Try different keywords or browse all categories.</p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-xs text-blue-600 font-semibold mb-1">{faq.category}</div>
                  <div className="text-lg font-semibold text-gray-900">{faq.question}</div>
                </div>
                <span className="text-2xl text-blue-600 ml-4">
                  {expandedItems.has(index) ? '−' : '+'}
                </span>
              </button>

              {expandedItems.has(index) && (
                <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200">
                  <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>

                  {/* Feedback buttons */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-300">
                    <span className="text-sm text-gray-600">Was this helpful?</span>
                    <button
                      onClick={() => saveFeedback(index, true)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        getFeedback(index) === 'helpful'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                      aria-label="Mark as helpful"
                    >
                      👍 Yes
                    </button>
                    <button
                      onClick={() => saveFeedback(index, false)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        getFeedback(index) === 'not-helpful'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                      aria-label="Mark as not helpful"
                    >
                      👎 No
                    </button>
                  </div>
                </div>
              )}
            </div>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-lg mb-6">
            Try our free calculator to get personalized recommendations for your situation
          </p>
          <Link
            href="/calculator"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Calculator
          </Link>
        </div>
      </div>

      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  );
}
