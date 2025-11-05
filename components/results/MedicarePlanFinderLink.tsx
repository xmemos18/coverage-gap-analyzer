'use client';

import { useState } from 'react';
import { getMedicarePlanFinderUrl, getMedicareResources, getEstimatedMedicareCosts } from '@/lib/medicareApi';

interface MedicarePlanFinderLinkProps {
  zipCode: string;
  recommendationType: 'advantage' | 'medigap' | 'both';
}

export default function MedicarePlanFinderLink({ zipCode, recommendationType }: MedicarePlanFinderLinkProps) {
  const [showDetails, setShowDetails] = useState(false);
  const resources = getMedicareResources(zipCode);
  const estimatedCosts = getEstimatedMedicareCosts();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-2xl">🏥</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Find Real Medicare Plans in Your Area
          </h3>
          <p className="text-sm text-gray-700">
            Medicare plan data is not available via API. Use the official Medicare Plan Finder to search real plans.
          </p>
        </div>
      </div>

      {/* Estimated Costs */}
      <div className="bg-white rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Estimated Medicare Costs (National Averages)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium text-gray-700">Part B Premium</div>
            <div className="text-lg font-bold text-accent">${estimatedCosts.partB.monthlyPremium}/month</div>
            <div className="text-xs text-gray-600">Standard 2025 rate</div>
          </div>

          {recommendationType === 'medigap' || recommendationType === 'both' ? (
            <div>
              <div className="font-medium text-gray-700">Medigap Plan G</div>
              <div className="text-lg font-bold text-accent">
                ${estimatedCosts.medigapPlanG.monthlyPremium.low} - ${estimatedCosts.medigapPlanG.monthlyPremium.high}/month
              </div>
              <div className="text-xs text-gray-600">{estimatedCosts.medigapPlanG.note}</div>
            </div>
          ) : null}

          {recommendationType === 'advantage' || recommendationType === 'both' ? (
            <div>
              <div className="font-medium text-gray-700">Medicare Advantage</div>
              <div className="text-lg font-bold text-accent">
                ${estimatedCosts.medicareAdvantage.monthlyPremium.low} - ${estimatedCosts.medicareAdvantage.monthlyPremium.high}/month
              </div>
              <div className="text-xs text-gray-600">{estimatedCosts.medicareAdvantage.note}</div>
            </div>
          ) : null}

          <div>
            <div className="font-medium text-gray-700">Part D (Drug Coverage)</div>
            <div className="text-lg font-bold text-accent">
              ${estimatedCosts.partD.monthlyPremium.low} - ${estimatedCosts.partD.monthlyPremium.high}/month
            </div>
            <div className="text-xs text-gray-600">{estimatedCosts.partD.note}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-900 mb-2">Find Plans on Medicare.gov:</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(recommendationType === 'advantage' || recommendationType === 'both') && (
            <a
              href={resources.planFinder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
            >
              <span>Medicare Advantage Plans</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}

          {(recommendationType === 'medigap' || recommendationType === 'both') && (
            <a
              href={resources.medigapFinder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-white border-2 border-accent text-accent font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>Medigap Plans</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}

          <a
            href={resources.partDFinder}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>Part D Drug Plans</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-sm font-medium text-blue-700 hover:text-blue-900 py-2 flex items-center justify-center gap-2"
      >
        {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} Medicare Resources & Help
      </button>

      {/* Detailed Resources */}
      {showDetails && (
        <div className="space-y-4 animate-fadeIn">
          {/* Help & Support */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">📞 Get Free Help</h4>
            <div className="space-y-2 text-sm">
              <div>
                <div className="font-medium text-gray-900">Medicare Helpline</div>
                <a href="tel:1-800-633-4227" className="text-blue-700 hover:underline">
                  {resources.helplines.medicare}
                </a>
                <div className="text-xs text-gray-600">TTY users: 1-877-486-2048</div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="font-medium text-gray-900">{resources.helplines.ship.name}</div>
                <div className="text-gray-700">{resources.helplines.ship.description}</div>
                <a
                  href={resources.helplines.ship.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  Find your local SHIP →
                </a>
              </div>
            </div>
          </div>

          {/* Important Deadlines */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">📅 Important Deadlines</h4>
            <div className="space-y-2 text-sm">
              <div>
                <div className="font-medium text-gray-900">Initial Enrollment Period</div>
                <div className="text-gray-700">{resources.deadlines.initialEnrollment}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Annual Enrollment Period</div>
                <div className="text-gray-700">{resources.deadlines.annualEnrollment}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                <div className="font-medium text-yellow-900 text-xs">⚠️ Important</div>
                <div className="text-yellow-800 text-xs">{resources.deadlines.lateEnrollmentPenalty}</div>
              </div>
            </div>
          </div>

          {/* Useful Links */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">🔗 Useful Resources</h4>
            <div className="space-y-2 text-sm">
              <a
                href={resources.importantLinks.handbookPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-blue-700 hover:underline"
              >
                <span>📘 Medicare & You Handbook (PDF)</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <a
                href={resources.importantLinks.glossary}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-blue-700 hover:underline"
              >
                <span>📖 Medicare Glossary</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <a
                href={resources.importantLinks.preventiveCare}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-blue-700 hover:underline"
              >
                <span>🏥 Preventive Care Services</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          <strong>Why no real-time API?</strong> Unlike Healthcare.gov, CMS does not provide a public API for Medicare plan comparison.
          Plan data is published as downloadable files. See <strong>MEDICARE_DATA.md</strong> for implementation details.
        </p>
      </div>
    </div>
  );
}
