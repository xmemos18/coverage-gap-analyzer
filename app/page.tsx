import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
            Find the Right Health Insurance Coverage for Your Lifestyle.
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto">
            Whether you have one home or many, we&apos;ll help you find the right coverage in 3 minutes.
          </p>
          <Link
            href="/calculator"
            className="inline-block bg-accent hover:bg-accent-light text-white font-bold text-lg px-10 py-4 rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Analyze My Coverage
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Benefit 1: Retirees & Snowbirds */}
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Retirees &amp; Snowbirds
              </h3>
              <p className="text-gray-600 text-lg">
                Winter in Florida, summer up north? We&apos;ll help you find coverage that follows you.
              </p>
            </div>

            {/* Benefit 2: Remote Workers */}
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Remote Workers
              </h3>
              <p className="text-gray-600 text-lg">
                Multi-state lifestyle? Your insurance should follow you wherever work takes you.
              </p>
            </div>

            {/* Benefit 3: Families */}
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Families
              </h3>
              <p className="text-gray-600 text-lg">
                Vacation home? Don&apos;t leave coverage gaps that could cost you thousands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 bg-accent text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Tell us where you live
                </h3>
                <p className="text-gray-600 text-lg">
                  Enter your location(s). Whether you have one home or multiple properties, we&apos;ll analyze your coverage needs.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 bg-accent text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Share household details
                </h3>
                <p className="text-gray-600 text-lg">
                  Provide basic information about your household size, ages, and health needs.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 bg-accent text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Get recommendations
                </h3>
                <p className="text-gray-600 text-lg">
                  Receive personalized insurance options tailored to your household and location(s).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
            <div className="bg-blue-50 rounded-lg p-8">
              <div className="text-5xl font-bold text-primary mb-2">
                50
              </div>
              <p className="text-xl text-gray-700">
                Helping families across all 50 states
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-8">
              <div className="text-5xl font-bold text-success mb-2">
                $3,600
              </div>
              <p className="text-xl text-gray-700">
                Average savings per year
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Is this free?
              </h3>
              <p className="text-gray-700 text-lg">
                Yes, completely free. No hidden charges, no credit card required.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Do I need an account?
              </h3>
              <p className="text-gray-700 text-lg">
                No account needed. Just answer a few questions and get your recommendations instantly.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                How accurate are the cost estimates?
              </h3>
              <p className="text-gray-700 text-lg">
                Costs are based on current market averages and typical plan pricing. Actual costs may vary based on your specific health status, chosen provider, and location.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Can I use this if I only have one home?
              </h3>
              <p className="text-gray-700 text-lg">
                Absolutely! The calculator works for anyone, whether you have one home or up to 5 properties. We&apos;ll provide personalized insurance recommendations based on your specific situation.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Do you sell insurance?
              </h3>
              <p className="text-gray-700 text-lg">
                No, we&apos;re an independent educational tool designed to help you understand your options. We may refer you to licensed brokers who can help you purchase coverage.
              </p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <Link
              href="/calculator"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold text-lg px-10 py-4 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
