import Link from 'next/link';

export default function DisclaimerSection() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-8 text-center">
      <div className="mb-6">
        <p className="text-sm text-gray-600 leading-relaxed max-w-3xl mx-auto">
          <strong>Important:</strong> These are estimates only. Actual costs and coverage may vary based on your specific circumstances,
          health status, and chosen providers. We strongly recommend consulting with a licensed insurance advisor
          to discuss your individual needs and ensure proper coverage across all your residences.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/calculator"
          className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-lg w-full sm:w-auto"
        >
          ← Start Over
        </Link>
        <Link
          href="/contact"
          className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors text-lg shadow-lg w-full sm:w-auto"
        >
          Contact Us →
        </Link>
      </div>
    </div>
  );
}
