/**
 * Tooltip content for add-on insurance types
 * Provides explanatory information for each insurance category
 */

import type { AddOnInsuranceCategory } from '@/types/addOnInsurance';

export const ADD_ON_TOOLTIPS: Record<AddOnInsuranceCategory, {
  title: string;
  description: string;
  example: string;
}> = {
  'dental': {
    title: 'Dental Insurance',
    description: 'Covers preventive care (cleanings, exams), basic procedures (fillings, extractions), and major work (crowns, root canals). Most health plans don\'t include dental coverage.',
    example: 'Typical plan: 100% preventive, 80% basic, 50% major procedures after deductible'
  },
  'vision': {
    title: 'Vision Insurance',
    description: 'Covers eye exams, prescription glasses, and contact lenses. Usually includes discounts on LASIK surgery. Vision care is rarely included in standard health insurance.',
    example: 'Annual exam covered, $150 allowance for frames, contact lens fitting included'
  },
  'accident': {
    title: 'Accident Insurance',
    description: 'Pays cash benefits directly to you for covered accidents like fractures, dislocations, burns, or emergency room visits. Complements health insurance by covering out-of-pocket costs.',
    example: 'Broken bone: $1,000, ER visit: $250, Ambulance: $400 cash benefits'
  },
  'critical-illness': {
    title: 'Critical Illness Insurance',
    description: 'Provides a lump-sum payment if diagnosed with covered conditions like cancer, heart attack, or stroke. Use the money for any purpose - medical bills, living expenses, or travel.',
    example: 'Cancer diagnosis: $25,000 lump sum, Heart attack: $25,000, Stroke: $25,000'
  },
  'hospital-indemnity': {
    title: 'Hospital Indemnity Insurance',
    description: 'Pays cash benefits for hospital stays, ICU confinement, and related expenses. Helps cover deductibles, copays, and non-medical costs like childcare or transportation.',
    example: 'Hospital admission: $1,000, Daily hospital stay: $200/day, ICU: $400/day'
  },
  'disability': {
    title: 'Disability Insurance',
    description: 'Replaces a portion of your income if illness or injury prevents you from working. Typically covers 50-70% of your salary for short-term (90 days-2 years) or long-term (2+ years) disability.',
    example: 'Earn $60,000/year → Receive $3,000/month tax-free during disability'
  },
  'long-term-care': {
    title: 'Long-Term Care Insurance',
    description: 'Covers costs of nursing homes, assisted living, or home healthcare when you can\'t perform basic activities of daily living. Medicare doesn\'t cover most long-term care expenses.',
    example: 'Nursing home: $280/day benefit, Home care: $175/day, 3-year benefit period'
  },
  'life': {
    title: 'Term Life Insurance',
    description: 'Provides a death benefit to your beneficiaries if you pass away during the policy term. Protects your family financially by replacing lost income, paying off debts, or funding future expenses.',
    example: '$500,000 coverage for 20 years at ~$30/month (age 35, non-smoker)'
  }
};

/**
 * Get age-specific insights for why a particular insurance is recommended
 */
export function getAgeSpecificInsights(
  category: AddOnInsuranceCategory,
  age: number
): {
  keyFactor: string;
  insights: string[];
  statistics: string[];
} {
  const insights: { [key in AddOnInsuranceCategory]: (age: number) => {
    keyFactor: string;
    insights: string[];
    statistics: string[];
  } } = {
    'dental': (age) => {
      if (age < 18) {
        return {
          keyFactor: 'Pediatric Dental Development',
          insights: [
            'Children need regular checkups every 6 months for optimal oral health',
            'Cavities are the most common chronic childhood disease',
            'Early orthodontic assessment can prevent future complications',
            'Dental sealants can reduce cavities by up to 80%'
          ],
          statistics: [
            '42% of children ages 2-11 have cavities in primary teeth',
            'Average cost of untreated dental issues: $1,600 per child annually',
            'Regular dental care reduces emergency dental visits by 40%'
          ]
        };
      } else if (age >= 65) {
        return {
          keyFactor: 'Senior Oral Health',
          insights: [
            'Original Medicare doesn\'t cover routine dental care',
            'Risk of gum disease increases significantly with age',
            'Tooth loss affects nutrition and quality of life',
            'Regular care prevents costly emergency procedures'
          ],
          statistics: [
            '68% of adults 65+ have periodontal disease',
            'Nearly 1 in 5 seniors have untreated tooth decay',
            'Average annual dental expenses for seniors: $1,092'
          ]
        };
      } else {
        return {
          keyFactor: 'Adult Preventive Care',
          insights: [
            'Preventive care costs less than treatment',
            'Gum disease linked to heart disease and diabetes',
            'Regular cleanings prevent costly procedures',
            'Most health insurance excludes dental coverage'
          ],
          statistics: [
            '64% of adults skip dental care due to cost',
            'Average root canal costs $1,500 without insurance',
            'Regular checkups reduce long-term costs by 50%'
          ]
        };
      }
    },

    'vision': (age) => {
      if (age < 18) {
        return {
          keyFactor: 'Vision Development in Children',
          insights: [
            '25% of school-age children have vision problems',
            'Undetected vision issues can affect learning and development',
            'Annual eye exams detect problems early',
            'Children\'s prescriptions change frequently as they grow'
          ],
          statistics: [
            '80% of learning is visual',
            'Only 14% of children under 6 receive eye exams',
            'Average cost of children\'s glasses: $200-300 annually'
          ]
        };
      } else if (age >= 40) {
        return {
          keyFactor: 'Age-Related Vision Changes',
          insights: [
            'Presbyopia (difficulty focusing close-up) begins around age 40',
            'Risk of cataracts, glaucoma, and macular degeneration increases',
            'Regular exams detect diseases before symptoms appear',
            'Progressive lenses often needed for multiple vision zones'
          ],
          statistics: [
            '90% of people over 40 need vision correction',
            '1 in 3 adults 65+ have vision-impairing eye disease',
            'Early glaucoma detection prevents 95% of vision loss'
          ]
        };
      } else {
        return {
          keyFactor: 'Digital Eye Strain Prevention',
          insights: [
            'Extended screen time increases eye strain and fatigue',
            'Computer vision syndrome affects 60% of workers',
            'Anti-reflective coatings and blue light filters help',
            'Regular exams maintain optimal workplace productivity'
          ],
          statistics: [
            'Average adult spends 7+ hours daily on screens',
            'Vision problems reduce productivity by 20%',
            'Proper prescription glasses improve work performance'
          ]
        };
      }
    },

    'accident': (age) => {
      if (age >= 18 && age <= 30) {
        return {
          keyFactor: 'Active Lifestyle Risk',
          insights: [
            'Young adults have highest accident rates',
            'Sports injuries, vehicle accidents, and workplace injuries common',
            'Out-of-pocket costs can derail financial goals',
            'Cash benefits help cover deductibles and copays'
          ],
          statistics: [
            'Leading cause of death for ages 18-30: unintentional injuries',
            'Average ER visit for fracture: $2,500-5,000',
            '40% of young adults have less than $400 in emergency savings'
          ]
        };
      } else if (age >= 65) {
        return {
          keyFactor: 'Fall Prevention and Recovery',
          insights: [
            '1 in 3 adults 65+ fall each year',
            'Falls are the leading cause of injury in seniors',
            'Recovery time longer, requiring additional support',
            'Benefits help cover home modifications and care'
          ],
          statistics: [
            'Falls cause 95% of hip fractures in seniors',
            'Average hospitalization for fall injury: $35,000',
            '20-30% of falls cause moderate to severe injuries'
          ]
        };
      } else {
        return {
          keyFactor: 'Family Protection',
          insights: [
            'Accidents happen unexpectedly, causing financial strain',
            'Benefits supplement health insurance coverage',
            'Cash payments help with childcare during recovery',
            'No waiting period for coverage to begin'
          ],
          statistics: [
            '31 million Americans injured annually requiring medical treatment',
            'Average out-of-pocket accident costs: $1,800',
            'Accident insurance helps 76% avoid medical debt'
          ]
        };
      }
    },

    'critical-illness': (age) => {
      if (age < 40) {
        return {
          keyFactor: 'Early Protection',
          insights: [
            'Premiums are lowest when you\'re younger and healthier',
            'Family history can increase risk regardless of age',
            'Financial protection for unexpected diagnosis',
            'Lump sum helps maintain lifestyle during treatment'
          ],
          statistics: [
            '1 in 2 men and 1 in 3 women will develop cancer in lifetime',
            'Average age of first heart attack: 66 (men), but 4-10% occur before 45',
            'Critical illness costs average $150,000-200,000'
          ]
        };
      } else if (age >= 50) {
        return {
          keyFactor: 'Increased Risk Profile',
          insights: [
            'Risk of heart disease, stroke, and cancer increases significantly',
            'May need time off work for treatment and recovery',
            'Lump-sum benefit provides financial flexibility',
            'Can use for experimental treatments not covered by insurance'
          ],
          statistics: [
            '90% of heart disease occurs in people over 40',
            'Cancer risk doubles every 5 years after age 50',
            'Average time off work for cancer treatment: 4-6 months'
          ]
        };
      } else {
        return {
          keyFactor: 'Financial Security',
          insights: [
            'Protects savings and retirement accounts from medical expenses',
            'Covers expenses health insurance won\'t pay',
            'Helps maintain mortgage and bill payments during illness',
            'Peace of mind for you and your family'
          ],
          statistics: [
            '42% of cancer patients deplete life savings within 2 years',
            'Average out-of-pocket costs for cancer: $16,000+ annually',
            'Critical illness bankruptcy filed by 66% of affected families'
          ]
        };
      }
    },

    'hospital-indemnity': (age) => {
      if (age < 30) {
        return {
          keyFactor: 'High-Deductible Plan Supplement',
          insights: [
            'Young adults often choose HDHPs to save on premiums',
            'Unexpected hospitalization can create financial hardship',
            'Cash benefits help meet high deductibles',
            'Covers expenses beyond medical bills (rent, food, transportation)'
          ],
          statistics: [
            'Average hospital stay costs $11,700',
            'HDHP deductibles average $4,500 per person',
            '28% of young adults couldn\'t afford a $1,000 emergency'
          ]
        };
      } else if (age >= 65) {
        return {
          keyFactor: 'Medicare Gap Coverage',
          insights: [
            'Original Medicare has copays for hospital stays',
            'Days 61-90: $408/day copay (2024)',
            'After 90 days: $816/day "lifetime reserve days"',
            'Hospital indemnity fills these gaps with cash benefits'
          ],
          statistics: [
            'Average Medicare beneficiary hospitalized 0.7 times/year',
            'Average hospital stay for 65+: 5.5 days',
            'Out-of-pocket hospital costs for seniors: $2,200/year average'
          ]
        };
      } else {
        return {
          keyFactor: 'Financial Protection',
          insights: [
            'Hospitalization often means lost wages',
            'Benefits help cover household expenses during recovery',
            'No coordination with health insurance - pays in addition',
            'Covers family members under same policy'
          ],
          statistics: [
            '1 in 9 Americans hospitalized annually',
            'Average hospital stay: 4.6 days',
            'Lost wages during hospitalization average $2,800'
          ]
        };
      }
    },

    'disability': (age) => {
      if (age >= 25 && age <= 50) {
        return {
          keyFactor: 'Peak Earning Years Protection',
          insights: [
            'Your income is your most valuable asset',
            'More likely to become disabled than to die during working years',
            'Social Security disability has strict requirements and long waits',
            'Replaces 50-70% of income if you can\'t work'
          ],
          statistics: [
            '1 in 4 workers will experience a disability before retirement',
            'Average long-term disability lasts 2.5 years',
            'Only 33% of workers have disability insurance'
          ]
        };
      } else if (age < 25) {
        return {
          keyFactor: 'Career Foundation',
          insights: [
            'Lowest premiums when you\'re young and healthy',
            'Protects income from unexpected illness or injury',
            'Student loans still require payment during disability',
            'Easier to qualify before developing health conditions'
          ],
          statistics: [
            'Accidents cause 92% of long-term disabilities in people under 30',
            'Average student loan debt: $37,000+',
            'Disability insurance costs 1-3% of annual income'
          ]
        };
      } else {
        return {
          keyFactor: 'Pre-Retirement Security',
          insights: [
            'Protects retirement savings from early depletion',
            'Some policies include retirement contributions during disability',
            'Higher salary means higher benefit amount',
            'Bridge income until Social Security eligibility'
          ],
          statistics: [
            'Over 50% of disabilities occur to workers over 50',
            'Average retirement savings lost to disability: $120,000',
            'Disability lasting 6+ months depletes 74% of savings'
          ]
        };
      }
    },

    'long-term-care': (age) => {
      if (age < 50) {
        return {
          keyFactor: 'Future Planning',
          insights: [
            'Premiums are significantly lower when purchased younger',
            'Easier to qualify before age-related health issues develop',
            'Protects assets and retirement savings for future needs',
            'Peace of mind for both you and your family'
          ],
          statistics: [
            'Average LTC premium at 40: $1,500/year vs $5,000/year at 65',
            '70% of people over 65 will need long-term care',
            'Average nursing home cost: $100,000+ per year'
          ]
        };
      } else if (age >= 50 && age < 65) {
        return {
          keyFactor: 'Critical Planning Window',
          insights: [
            'Last opportunity for affordable coverage before Medicare age',
            'Risk of needing care increases significantly after 65',
            'Protects retirement assets from being depleted',
            'Prevents financial burden on adult children'
          ],
          statistics: [
            '52% of people turning 65 will need long-term care',
            'Average cost of 3 years in nursing home: $300,000+',
            'Medicaid only covers LTC after spending down assets to $2,000'
          ]
        };
      } else {
        return {
          keyFactor: 'Immediate Protection Needed',
          insights: [
            'Very high likelihood of needing care in next 10-20 years',
            'Medicare covers minimal long-term care costs',
            'Helps maintain independence and choice of care setting',
            'Protects spouse from impoverishment due to care costs'
          ],
          statistics: [
            '70% of 65-year-olds will need long-term care',
            'Women need care for average of 3.7 years, men 2.2 years',
            'Average total LTC costs: $138,000 (over lifetime)'
          ]
        };
      }
    },

    'life': (age) => {
      if (age < 30) {
        return {
          keyFactor: 'Lowest Premiums Available',
          insights: [
            'Lock in low rates while you\'re young and healthy',
            'Protects future family even before having children',
            'Covers final expenses and outstanding debts',
            'Can be increased later as family grows'
          ],
          statistics: [
            '20-year $500K term policy at 25: ~$20/month',
            'Same policy at 40: ~$45/month (125% increase)',
            '56% of millennials have no life insurance'
          ]
        };
      } else if (age >= 30 && age <= 50) {
        return {
          keyFactor: 'Family Income Protection',
          insights: [
            'Replace 5-10 years of income for dependents',
            'Cover mortgage, education, and living expenses',
            'Critical protection during peak financial responsibility',
            'Peace of mind for your loved ones'
          ],
          statistics: [
            'Average American has $193,000 in debt (mortgage, loans)',
            'Cost to raise a child to 18: $310,000+',
            '48% of families would struggle financially within 6 months of breadwinner\'s death'
          ]
        };
      } else {
        return {
          keyFactor: 'Final Expense and Legacy',
          insights: [
            'Covers funeral costs, medical bills, and estate taxes',
            'Prevents financial burden on adult children',
            'Can leave legacy for grandchildren or charities',
            'Term policies more affordable than whole life'
          ],
          statistics: [
            'Average funeral costs: $7,000-12,000',
            'Final medical expenses can exceed $25,000',
            '30% of seniors have no life insurance coverage'
          ]
        };
      }
    }
  };

  return insights[category](age);
}
