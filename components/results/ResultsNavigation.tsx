'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PDFDownloadButton } from '@/components/PDFReport';
import { InsuranceRecommendation } from '@/types';
import { useToast } from '@/hooks/useToast';

interface ResultsNavigationProps {
  recommendation: InsuranceRecommendation;
  formData: {
    residences: Array<{ zip: string; state: string }>;
    numAdults: number;
    numChildren: number;
    adultAges: number[];
    childAges: number[];
    budget: string;
    incomeRange: string;
  };
}

type DropdownType = 'print' | 'download' | 'email' | null;

export default function ResultsNavigation({ recommendation, formData }: ResultsNavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRefs = {
    print: useRef<HTMLDivElement>(null),
    download: useRef<HTMLDivElement>(null),
    email: useRef<HTMLDivElement>(null),
  };
  const { showError } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = Object.values(dropdownRefs).every(
        ref => ref.current && !ref.current.contains(event.target as Node)
      );
      if (clickedOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRefs]);

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  const handlePrint = (fullReport: boolean) => {
    if (fullReport) {
      // For full report, we'll add a class to the body to show everything
      document.body.classList.add('print-full-report');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('print-full-report');
      }, 100);
    } else {
      // Regular print
      window.print();
    }
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleEmail = (_fullReport: boolean) => {
    // TODO: Implement different email content for full report vs summary
    const subject = encodeURIComponent('My Health Insurance Analysis');
    const body = encodeURIComponent(
      `I wanted to share my health insurance analysis from Key Insurance Matters.\n\n` +
      `Recommendation: ${recommendation.recommendedInsurance}\n` +
      `Estimated Monthly Cost: $${recommendation.estimatedMonthlyCost.low}-${recommendation.estimatedMonthlyCost.high}\n\n` +
      `View full report: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
            <span className="text-2xl font-bold text-blue-600">
              Key Insurance Matters
            </span>
          </Link>

          {/* Desktop Navigation - Action Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Print Dropdown */}
            <div className="relative" ref={dropdownRefs.print}>
              <button
                onClick={() => toggleDropdown('print')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'print' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'print' && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handlePrint(false)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Print Current Page</div>
                    <div className="text-xs text-gray-600 mt-0.5">Print what&apos;s visible now</div>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => handlePrint(true)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Print Full Report</div>
                    <div className="text-xs text-gray-600 mt-0.5">Print complete analysis</div>
                  </button>
                </div>
              )}
            </div>

            {/* Download Dropdown */}
            <div className="relative" ref={dropdownRefs.download}>
              <button
                onClick={() => toggleDropdown('download')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'download' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'download' && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <PDFDownloadButton
                    recommendation={recommendation}
                    formData={formData}
                    onError={(error) => showError('Failed to generate PDF: ' + error.message)}
                    variant="dropdown-item"
                    label="Download Current View"
                    description="PDF of visible content"
                  />
                  <div className="border-t border-gray-100 my-1"></div>
                  <PDFDownloadButton
                    recommendation={recommendation}
                    formData={formData}
                    onError={(error) => showError('Failed to generate PDF: ' + error.message)}
                    variant="dropdown-item"
                    fullReport={true}
                    label="Download Full Report"
                    description="Complete analysis PDF"
                  />
                </div>
              )}
            </div>

            {/* Email Dropdown */}
            <div className="relative" ref={dropdownRefs.email}>
              <button
                onClick={() => toggleDropdown('email')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'email' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'email' && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleEmail(false)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Email Summary</div>
                    <div className="text-xs text-gray-600 mt-0.5">Send quick summary</div>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => handleEmail(true)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Email Full Report</div>
                    <div className="text-xs text-gray-600 mt-0.5">Send complete analysis</div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            {/* Print Section */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Print Options</div>
              <button
                onClick={() => handlePrint(false)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Print Current Page</div>
                    <div className="text-xs text-gray-600">Print what&apos;s visible</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handlePrint(true)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors mt-2"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Print Full Report</div>
                    <div className="text-xs text-gray-600">Complete analysis</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Download Section */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Download PDF</div>
              <div className="space-y-2">
                <PDFDownloadButton
                  recommendation={recommendation}
                  formData={formData}
                  onError={(error) => showError('Failed to generate PDF: ' + error.message)}
                  variant="mobile-menu-item"
                  label="Download Current View"
                  description="PDF of visible content"
                />
                <PDFDownloadButton
                  recommendation={recommendation}
                  formData={formData}
                  onError={(error) => showError('Failed to generate PDF: ' + error.message)}
                  variant="mobile-menu-item"
                  fullReport={true}
                  label="Download Full Report"
                  description="Complete analysis PDF"
                />
              </div>
            </div>

            {/* Email Section */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Email Options</div>
              <button
                onClick={() => handleEmail(false)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Email Summary</div>
                    <div className="text-xs text-gray-600">Send quick summary</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleEmail(true)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors mt-2"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Email Full Report</div>
                    <div className="text-xs text-gray-600">Complete analysis</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
