'use client';

import { useState } from 'react';
import { getMedicareResources, getEstimatedMedicareCosts } from '@/lib/medicareApi';

interface MedicarePlanFinderLinkProps {
  zipCode: string;
  recommendationType: 'advantage' | 'medigap' | 'both';
}

export default function MedicarePlanFinderLink({ zipCode, recommendationType }: MedicarePlanFinderLinkProps) {
  const [showDetails, setShowDetails] = useState(false);
  const resources = getMedicareResources(zipCode);
  const estimatedCosts = getEstimatedMedicareCosts();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 shadow-xl p-6 md:p-8 space-y-6">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      {/* Premium Header */}
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
          <span className="text-3xl md:text-4xl">🏥</span>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Find Real Medicare Plans in Your Area
          </h3>
          <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed">
            Medicare plan data is not available via API. Use the official Medicare Plan Finder to search real plans.
          </p>
        </div>
      </div>

      {/* Premium Estimated Costs */}
      <div className="relative bg-white rounded-xl p-5 md:p-6 border-2 border-blue-200 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md rotate-3">
            💰
          </div>
          <h4 className="text-base md:text-lg font-bold text-gray-900">Estimated Medicare Costs (National Averages)</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="font-bold text-gray-900 mb-1">Part B Premium</div>
            <div className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-1">
              ${estimatedCosts.partB.monthlyPremium}/month
            </div>
            <div className="text-xs text-gray-600 font-medium">Standard 2025 rate</div>
          </div>

          {recommendationType === 'medigap' || recommendationType === 'both' ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="font-bold text-gray-900 mb-1">Medigap Plan G</div>
              <div className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-1">
                ${estimatedCosts.medigapPlanG.monthlyPremium.low} - ${estimatedCosts.medigapPlanG.monthlyPremium.high}/month
              </div>
              <div className="text-xs text-gray-600 font-medium">{estimatedCosts.medigapPlanG.note}</div>
            </div>
          ) : null}

          {recommendationType === 'advantage' || recommendationType === 'both' ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="font-bold text-gray-900 mb-1">Medicare Advantage</div>
              <div className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-1">
                ${estimatedCosts.medicareAdvantage.monthlyPremium.low} - ${estimatedCosts.medicareAdvantage.monthlyPremium.high}/month
              </div>
              <div className="text-xs text-gray-600 font-medium">{estimatedCosts.medicareAdvantage.note}</div>
            </div>
          ) : null}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="font-bold text-gray-900 mb-1">Part D (Drug Coverage)</div>
            <div className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-1">
              ${estimatedCosts.partD.monthlyPremium.low} - ${estimatedCosts.partD.monthlyPremium.high}/month
            </div>
            <div className="text-xs text-gray-600 font-medium">{estimatedCosts.partD.note}</div>
          </div>
        </div>
      </div>

      {/* Premium Action Buttons */}
      <div className="relative space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm shadow-md rotate-3">
            ✓
          </div>
          <div className="text-base font-bold text-gray-900">Find Plans on Medicare.gov:</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(recommendationType === 'advantage' || recommendationType === 'both') && (
            <a
              href={resources.planFinder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md"
            >
              <span>Medicare Advantage Plans</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}

          {(recommendationType === 'medigap' || recommendationType === 'both') && (
            <a
              href={resources.medigapFinder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
            >
              <span>Medigap Plans</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          )}

          <a
            href={resources.partDFinder}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-5 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
          >
            <span>Part D Drug Plans</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Premium Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="relative w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 text-blue-700 hover:text-blue-900 hover:border-blue-300 font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-sm hover:shadow-md"
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
        <span>{showDetails ? 'Hide' : 'Show'} Medicare Resources & Help</span>
      </button>

      {/* Premium Detailed Resources */}
      {showDetails && (
        <div className="relative space-y-4 animate-fadeIn">
          {/* Premium Help & Support */}
          <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md rotate-3">
                📞
              </div>
              <h4 className="text-base font-bold text-gray-900">Get Free Help</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="font-bold text-gray-900 mb-1">Medicare Helpline</div>
                <a href="tel:1-800-633-4227" className="text-blue-700 hover:underline font-semibold text-base">
                  {resources.helplines.medicare}
                </a>
                <div className="text-xs text-gray-600 mt-1 font-medium">TTY users: 1-877-486-2048</div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <div className="font-bold text-gray-900 mb-1">{resources.helplines.ship.name}</div>
                <div className="text-gray-700 mb-2">{resources.helplines.ship.description}</div>
                <a
                  href={resources.helplines.ship.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  Find your local SHIP
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Premium Important Deadlines */}
          <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md rotate-3">
                📅
              </div>
              <h4 className="text-base font-bold text-gray-900">Important Deadlines</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="font-bold text-gray-900 mb-1">Initial Enrollment Period</div>
                <div className="text-gray-700 leading-relaxed">{resources.deadlines.initialEnrollment}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <div className="font-bold text-gray-900 mb-1">Annual Enrollment Period</div>
                <div className="text-gray-700 leading-relaxed">{resources.deadlines.annualEnrollment}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 text-white text-xs font-bold">
                    !
                  </span>
                  <div className="font-bold text-yellow-900 text-sm">Important</div>
                </div>
                <div className="text-yellow-800 text-sm font-medium leading-relaxed pl-7">{resources.deadlines.lateEnrollmentPenalty}</div>
              </div>
            </div>
          </div>

          {/* Premium Useful Links */}
          <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md rotate-3">
                🔗
              </div>
              <h4 className="text-base font-bold text-gray-900">Useful Resources</h4>
            </div>
            <div className="space-y-2.5 text-sm">
              <a
                href={resources.importantLinks.handbookPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 rounded-lg p-3 border border-blue-200 transition-colors group"
              >
                <span className="font-semibold text-blue-700 group-hover:text-blue-900">📘 Medicare & You Handbook (PDF)</span>
                <svg className="w-5 h-5 text-blue-700 group-hover:text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <a
                href={resources.importantLinks.glossary}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 rounded-lg p-3 border border-indigo-200 transition-colors group"
              >
                <span className="font-semibold text-indigo-700 group-hover:text-indigo-900">📖 Medicare Glossary</span>
                <svg className="w-5 h-5 text-indigo-700 group-hover:text-indigo-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <a
                href={resources.importantLinks.preventiveCare}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-purple-50 hover:bg-purple-100 rounded-lg p-3 border border-purple-200 transition-colors group"
              >
                <span className="font-semibold text-purple-700 group-hover:text-purple-900">🏥 Preventive Care Services</span>
                <svg className="w-5 h-5 text-purple-700 group-hover:text-purple-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Premium Footer Note */}
      <div className="relative bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-100 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm shadow-md rotate-3 flex-shrink-0">
            ℹ️
          </div>
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong className="font-bold">Why no real-time API?</strong> Unlike Healthcare.gov, CMS does not provide a public API for Medicare plan comparison.
            Plan data is published as downloadable files. See <strong className="font-bold">MEDICARE_DATA.md</strong> for implementation details.
          </p>
        </div>
      </div>
    </div>
  );
}
