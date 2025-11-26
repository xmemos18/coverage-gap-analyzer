'use client';

/**
 * Shared Scenario Page
 *
 * Displays a shared coverage scenario and allows users to load it.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  decodeScenario,
  isValidEncodedScenario,
  getScenarioSummary,
  type ShareableScenario,
} from '@/lib/sharing';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [scenario, setScenario] = useState<ShareableScenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setError('No scenario code provided');
      setLoading(false);
      return;
    }

    if (!isValidEncodedScenario(code)) {
      setError('Invalid or expired share link');
      setLoading(false);
      return;
    }

    try {
      const decoded = decodeScenario(code);
      setScenario(decoded);
    } catch {
      setError('Failed to load scenario');
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleLoadScenario = () => {
    if (!scenario) return;

    // Store scenario in sessionStorage for the calculator to pick up
    sessionStorage.setItem('sharedScenario', JSON.stringify(scenario));
    router.push('/calculator?from=share');
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scenario...</p>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Scenario
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The shared scenario could not be found or has expired.'}
          </p>
          <Link
            href="/calculator"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Analysis
          </Link>
        </div>
      </div>
    );
  }

  const summary = getScenarioSummary(scenario);
  const createdDate = scenario.ts
    ? new Date(scenario.ts).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-xl font-semibold text-white">
              Shared Coverage Scenario
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Created {createdDate}
            </p>
          </div>

          {/* Summary */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Scenario Summary
            </h2>
            <p className="text-gray-700 text-lg">{summary}</p>
          </div>

          {/* Details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Location"
                value={`${scenario.zip}, ${scenario.state}`}
              />
              <DetailItem
                label="Household"
                value={`${scenario.adults} adult${scenario.adults > 1 ? 's' : ''}, ${scenario.children} child${scenario.children !== 1 ? 'ren' : ''}`}
              />
              <DetailItem
                label="Annual Income"
                value={`$${scenario.income.toLocaleString()}`}
              />
              {scenario.budget && (
                <DetailItem
                  label="Budget"
                  value={`$${scenario.budget}/month`}
                />
              )}
              <DetailItem
                label="Priority"
                value={formatPriority(scenario.priority)}
              />
              <DetailItem
                label="Plan Preference"
                value={scenario.planType.toUpperCase()}
              />
              {scenario.chronic && (
                <DetailItem
                  label="Chronic Conditions"
                  value="Yes"
                />
              )}
              {scenario.prescriptions > 0 && (
                <DetailItem
                  label="Prescriptions"
                  value={`${scenario.prescriptions} medications`}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLoadScenario}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Load This Scenario
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          This link contains your coverage scenario data. No personal information is stored on our servers.
        </p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  );
}

function formatPriority(priority: string): string {
  switch (priority) {
    case 'low-premium':
      return 'Lower Premium';
    case 'balanced':
      return 'Balanced';
    case 'comprehensive':
      return 'Comprehensive';
    default:
      return priority;
  }
}
