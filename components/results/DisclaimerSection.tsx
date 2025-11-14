import Link from 'next/link';

export default function DisclaimerSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 border-2 border-gray-200 shadow-2xl p-8 md:p-10 text-center mb-12 md:mb-16">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      {/* Premium Disclaimer Text */}
      <div className="relative mb-8">
        <div className="flex items-start justify-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 text-white text-xl shadow-md rotate-3">
            ℹ️
          </div>
        </div>
        <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-3xl mx-auto font-medium">
          <strong className="text-gray-900 font-bold">Important:</strong> These are estimates only. Actual costs and coverage may vary based on your specific circumstances,
          health status, and chosen providers. We strongly recommend consulting with a licensed insurance advisor
          to discuss your individual needs and ensure proper coverage across all your residences.
        </p>
      </div>

      {/* Premium Action Buttons */}
      <div className="relative flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/calculator"
          className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 text-lg w-full sm:w-auto shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          ← Start Over
        </Link>
        <Link
          href="/contact"
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 text-lg shadow-lg w-full sm:w-auto hover:-translate-y-0.5"
        >
          Contact Us →
        </Link>
      </div>
    </div>
  );
}
