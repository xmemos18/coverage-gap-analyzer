/**
 * INTEGRATION EXAMPLE
 *
 * This file shows how to integrate the redesigned components into
 * the existing results page (app/results/page.tsx)
 *
 * STEPS:
 * 1. Import new components
 * 2. Replace existing components
 * 3. Add ResultsHeader at the top
 * 4. Use improved responsive styles
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useEffect, useState } from 'react';
import { useInsuranceAnalysis } from '@/hooks/useInsuranceAnalysis';

// NEW IMPORTS - Add these
import ResultsHeader from '@/components/results/ResultsHeader';
import EnhancedHeroSummary from '@/components/results/EnhancedHeroSummary';
import { ImprovedTabNavigation, TabPanel, TabId } from '@/components/results/ImprovedTabNavigation';

// Existing imports
import CostAnalysis from '@/components/results/CostAnalysis';
import NextStepsSection from '@/components/results/NextStepsSection';
import AlternativeOptions from '@/components/results/AlternativeOptions';
import AddOnInsuranceSection from '@/components/results/AddOnInsuranceSection';
import DisclaimerSection from '@/components/results/DisclaimerSection';
import ResultsSkeleton from '@/components/results/ResultsSkeleton';
import ValidationError from '@/components/results/ValidationError';

function ResultsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  // ... (existing URL parameter parsing code - no changes needed)
  // ... (existing validation code - no changes needed)
  // ... (existing form data reconstruction - no changes needed)
  // ... (existing insurance analysis - no changes needed)

  // Example: Get recommendation from hook
  const { recommendation, medicareAdvantageAnalysis, cobraAnalysis, hsaAnalysis } = useInsuranceAnalysis({
    /* ...existing params... */
  });

  if (!recommendation) return null;

  // Count specialized analyses
  const specializedCount = [medicareAdvantageAnalysis, cobraAnalysis, hsaAnalysis].filter(Boolean).length;

  // Build tabs dynamically
  const tabs = [
    { id: 'summary' as TabId, label: 'Summary', icon: '📋', ariaLabel: 'Summary tab' },
    { id: 'costs' as TabId, label: 'Costs', icon: '💰', ariaLabel: 'Cost analysis tab' },
    recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0
      ? {
          id: 'alternatives' as TabId,
          label: 'Alternatives',
          icon: '🔍',
          badge: recommendation.alternativeOptions.length,
          ariaLabel: `Alternative options tab, ${recommendation.alternativeOptions.length} options available`
        }
      : null,
    specializedCount > 0
      ? {
          id: 'specialized' as TabId,
          label: 'Specialized',
          icon: '🏥',
          badge: specializedCount,
          ariaLabel: `Specialized analysis tab, ${specializedCount} analyses available`
        }
      : null,
    recommendation.addOnInsuranceAnalysis
      ? {
          id: 'addons' as TabId,
          label: 'Add-Ons',
          icon: '➕',
          badge: recommendation.addOnInsuranceAnalysis.highPriority.length,
          ariaLabel: `Add-on insurance tab, ${recommendation.addOnInsuranceAnalysis.highPriority.length} recommendations`
        }
      : null,
    { id: 'steps' as TabId, label: 'Next Steps', icon: '✅', ariaLabel: 'Next steps tab' },
  ].filter(Boolean) as Array<{ id: TabId; label: string; icon: string; badge?: number; ariaLabel?: string }>;

  // Action handlers for header
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Existing share logic or implement new one
    console.log('Share functionality');
  };

  const handleExport = () => {
    // Existing export logic or implement new one
    console.log('Export functionality');
  };

  return (
    <>
      {/* NEW: Add Results Header */}
      <ResultsHeader
        recommendation={recommendation}
        formData={{
          residences: [], // pass your actual formData
          numAdults: 0,
          numChildren: 0,
          adultAges: [],
          childAges: [],
          budget: '',
          incomeRange: '',
        }}
        onShare={handleShare}
        onPrint={handlePrint}
        onExport={handleExport}
      />

      {/* Main Content - Use mobile-padding for consistent spacing */}
      <main className="min-h-screen bg-gray-50 mobile-padding">
        <div className="container-max">
          {/* Print-only header - Keep existing */}
          <div className="hidden print:block mb-8">
            <div className="border-b-2 border-gray-300 pb-4 mb-4">
              <h1 className="text-2xl font-bold">Key Insurance Matters Results</h1>
              <p className="text-sm text-gray-600">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Page Header - Keep existing but add fade-in */}
          <div className="text-center mb-6 md:mb-8 print:hidden fade-in">
            <h1 className="heading-1 mb-3">
              Your Personalized Insurance Recommendations
            </h1>
            <p className="body-text text-gray-600">
              Based on your household situation and coverage needs
            </p>
          </div>

          {/* Trust Signals Bar - Keep existing */}
          <div className="card mb-6 md:mb-8 fade-in">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-xl">🔒</span>
                <span className="text-gray-700 font-medium">HIPAA Compliant</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-gray-700 font-medium">CMS Data Verified</span>
              </div>
            </div>
          </div>

          {/* REPLACE: Use Enhanced Hero Summary */}
          <EnhancedHeroSummary
            coverageGapScore={recommendation.coverageGapScore}
            recommendedInsurance={recommendation.recommendedInsurance}
            householdBreakdown={recommendation.householdBreakdown}
            estimatedMonthlyCost={recommendation.estimatedMonthlyCost}
            reasoning={recommendation.reasoning}
          />

          {/* REPLACE: Use Improved Tab Navigation */}
          <ImprovedTabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stickyOffset={64} // Height of ResultsHeader
          >
            {/* SUMMARY TAB */}
            <TabPanel value="summary" activeTab={activeTab}>
              <div className="mobile-gap">
                {/* Current Insurance Comparison */}
                {recommendation.currentInsuranceSummary && recommendation.costComparison && (
                  <div className="glass-card-accent mobile-padding">
                    <h3 className="heading-3 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      <span>Current vs Recommended</span>
                    </h3>

                    {/* Use new comparison layout */}
                    <div className="comparison-row">
                      <div className="comparison-col">
                        <div className="text-sm text-gray-600 mb-1">Current Plan</div>
                        <div className="stat-value text-gray-900">
                          ${recommendation.costComparison.current}
                        </div>
                        <div className="stat-label">per month</div>
                      </div>

                      <div className="comparison-col-highlight">
                        <div className="comparison-badge">RECOMMENDED</div>
                        <div className="text-sm text-blue-900 mb-1">New Plan</div>
                        <div className="stat-value text-blue-600">
                          ${recommendation.estimatedMonthlyCost.low}-${recommendation.estimatedMonthlyCost.high}
                        </div>
                        <div className="stat-label">per month</div>
                      </div>
                    </div>

                    {recommendation.costComparison.monthlySavings && (
                      <div className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                        <div className="text-sm text-green-900 font-medium mb-1">Potential Savings</div>
                        <div className="text-3xl font-bold text-green-700">
                          ${recommendation.costComparison.monthlySavings}
                          <span className="text-lg">/month</span>
                        </div>
                        <div className="text-sm text-green-800 mt-1">
                          ${recommendation.costComparison.annualSavings}/year
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Personalized Suggestions */}
                {recommendation.suggestions && recommendation.suggestions.length > 0 && (
                  <div className="card mobile-padding">
                    <h3 className="heading-3 mb-4">💡 Personalized Tips</h3>
                    <div className="responsive-grid-2">
                      {recommendation.suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className={`
                            p-4 rounded-lg border-2
                            ${suggestion.priority === 'high' ? 'bg-blue-50 border-blue-300' : ''}
                            ${suggestion.priority === 'medium' ? 'bg-gray-50 border-gray-300' : ''}
                            ${suggestion.priority === 'low' ? 'bg-gray-50 border-gray-200' : ''}
                          `}
                        >
                          <h4 className="font-semibold text-gray-900 mb-2">{suggestion.title}</h4>
                          <p className="text-sm text-gray-700">{suggestion.description}</p>
                          {suggestion.potentialSavings && (
                            <div className="mt-2 text-green-700 font-semibold text-sm">
                              💰 Save ${suggestion.potentialSavings}/month
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* COSTS TAB */}
            <TabPanel value="costs" activeTab={activeTab}>
              <CostAnalysis
                monthlyCost={recommendation.estimatedMonthlyCost}
                budget={''} // pass actual budget
                currentCost={undefined} // pass if available
                subsidyAmount={recommendation.subsidyAnalysis?.estimatedMonthlySubsidy}
                costAfterSubsidy={recommendation.subsidyAnalysis?.estimatedAfterSubsidyCost}
              />
            </TabPanel>

            {/* ALTERNATIVES TAB */}
            <TabPanel value="alternatives" activeTab={activeTab}>
              <div className="mobile-gap">
                <AlternativeOptions options={recommendation.alternativeOptions || []} />
              </div>
            </TabPanel>

            {/* SPECIALIZED TAB */}
            <TabPanel value="specialized" activeTab={activeTab}>
              <div className="mobile-gap">
                {/* Medicare, COBRA, HSA analyses - keep existing implementations */}
              </div>
            </TabPanel>

            {/* ADD-ONS TAB */}
            <TabPanel value="addons" activeTab={activeTab}>
              {recommendation.addOnInsuranceAnalysis && (
                <AddOnInsuranceSection analysis={recommendation.addOnInsuranceAnalysis} />
              )}
            </TabPanel>

            {/* NEXT STEPS TAB */}
            <TabPanel value="steps" activeTab={activeTab}>
              <div className="mobile-gap">
                <NextStepsSection actionItems={recommendation.actionItems} />
                <DisclaimerSection />
              </div>
            </TabPanel>
          </ImprovedTabNavigation>

          {/* Methodology Section - Keep existing */}
          <div className="mt-8 card-info print:hidden">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span>How We Calculate Recommendations</span>
            </h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Our recommendations are based on your household size, location, income, health needs, and budget.
              We analyze coverage options using data from CMS, state insurance departments, and major carriers.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function Results() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsContent />
    </Suspense>
  );
}

/**
 * MIGRATION CHECKLIST
 *
 * ✅ 1. Created new components (ResultsHeader, EnhancedHeroSummary, ImprovedTabNavigation)
 * ✅ 2. Added new CSS utilities to globals.css
 * ✅ 3. Created integration example (this file)
 *
 * TODO:
 * □ 4. Test on mobile devices (iPhone, Android)
 * □ 5. Test on tablets (iPad)
 * □ 6. Test accessibility (screen reader, keyboard navigation)
 * □ 7. Test print functionality
 * □ 8. Run Lighthouse audit
 * □ 9. Update E2E tests (e2e/results.spec.ts)
 * □ 10. Deploy to staging for QA
 *
 * ROLLBACK PLAN:
 * If issues arise, you can easily rollback by:
 * 1. Keep old components (don't delete CollapsibleHeroSummary, TabNavigation)
 * 2. Switch imports back to old components
 * 3. The CSS additions won't break anything (they're additive)
 */
