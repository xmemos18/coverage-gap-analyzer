import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Footer Links */}
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <Link
            href="/about"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            Privacy
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-500 text-sm">
          <p>&copy; 2025 Key Insurance Matters. All rights reserved.</p>
          <p className="mt-2">Powered by Netter Products</p>
        </div>
      </div>
    </footer>
  );
}
