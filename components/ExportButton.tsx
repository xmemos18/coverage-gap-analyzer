'use client';

import { useState } from 'react';

interface ExportButtonProps {
  data: unknown;
  filename?: string;
  className?: string;
  label?: string;
}

/**
 * Export button component that downloads data as JSON
 * Useful for saving results or sharing with advisors
 */
export default function ExportButton({
  data,
  filename = 'insurance-results',
  className = '',
  label = 'Export as JSON'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    try {
      setIsExporting(true);

      // Convert data to JSON string with formatting
      const jsonString = JSON.stringify(data, null, 2);

      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => setIsExporting(false), 500);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-accent hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed no-print ${className}`}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      {isExporting ? 'Exporting...' : label}
    </button>
  );
}
