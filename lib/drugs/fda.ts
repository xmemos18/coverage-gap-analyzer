/**
 * FDA Drug API Integration
 *
 * Provides drug lookup functionality using the FDA openFDA API.
 * API Documentation: https://open.fda.gov/apis/drug/
 */

import { logger } from '@/lib/logger';

// FDA API Base URL
const FDA_API_BASE = 'https://api.fda.gov/drug';

// Types for FDA Drug Label API
export interface FDADrugLabelResult {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    product_ndc?: string[];
    rxcui?: string[];
    pharm_class_epc?: string[];
    substance_name?: string[];
    product_type?: string[];
    route?: string[];
    application_number?: string[];
  };
  purpose?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  warnings?: string[];
  active_ingredient?: string[];
  inactive_ingredient?: string[];
  drug_interactions?: string[];
  contraindications?: string[];
  pregnancy?: string[];
  nursing_mothers?: string[];
  pediatric_use?: string[];
  geriatric_use?: string[];
  adverse_reactions?: string[];
  overdosage?: string[];
  how_supplied?: string[];
  storage_and_handling?: string[];
}

export interface FDADrugSearchResponse {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: FDADrugLabelResult[];
}

// Types for FDA NDC (National Drug Code) API
export interface FDANDCResult {
  product_ndc: string;
  generic_name: string;
  labeler_name: string;
  brand_name?: string;
  active_ingredients: Array<{
    name: string;
    strength: string;
  }>;
  finished: boolean;
  packaging: Array<{
    package_ndc: string;
    description: string;
  }>;
  dosage_form: string;
  route: string[];
  marketing_category: string;
  application_number?: string;
  listing_expiration_date?: string;
  pharm_class?: string[];
}

export interface FDANDCSearchResponse {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: FDANDCResult[];
}

// Normalized drug type for application use
export interface Drug {
  /** Brand name(s) */
  brandNames: string[];
  /** Generic name(s) */
  genericNames: string[];
  /** Active ingredients */
  activeIngredients: string[];
  /** Manufacturer(s) */
  manufacturers: string[];
  /** National Drug Codes */
  ndcs: string[];
  /** RxCUI codes for RxNorm database */
  rxcuis: string[];
  /** Drug class/category */
  drugClasses: string[];
  /** Route of administration */
  routes: string[];
  /** Product type (OTC, prescription, etc.) */
  productTypes: string[];
  /** Primary indication/purpose */
  purpose?: string;
  /** Warnings summary */
  warnings?: string;
  /** Dosage information */
  dosage?: string;
}

export interface DrugSearchParams {
  /** Search by brand name */
  brandName?: string;
  /** Search by generic name */
  genericName?: string;
  /** Search by any name (brand or generic) */
  name?: string;
  /** Search by NDC code */
  ndc?: string;
  /** Search by manufacturer */
  manufacturer?: string;
  /** Search by drug class */
  drugClass?: string;
  /** Maximum results to return */
  limit?: number;
  /** Number of results to skip */
  skip?: number;
}

/**
 * Search for drugs using the FDA Drug Label API
 */
export async function searchDrugs(
  params: DrugSearchParams
): Promise<{ drugs: Drug[]; totalCount: number }> {
  try {
    // Build search query
    const searchTerms: string[] = [];

    if (params.brandName) {
      searchTerms.push(`openfda.brand_name:"${escapeQuery(params.brandName)}"`);
    }
    if (params.genericName) {
      searchTerms.push(`openfda.generic_name:"${escapeQuery(params.genericName)}"`);
    }
    if (params.name) {
      // Search both brand and generic names
      searchTerms.push(
        `(openfda.brand_name:"${escapeQuery(params.name)}" OR openfda.generic_name:"${escapeQuery(params.name)}")`
      );
    }
    if (params.ndc) {
      searchTerms.push(`openfda.product_ndc:"${escapeQuery(params.ndc)}"`);
    }
    if (params.manufacturer) {
      searchTerms.push(`openfda.manufacturer_name:"${escapeQuery(params.manufacturer)}"`);
    }
    if (params.drugClass) {
      searchTerms.push(`openfda.pharm_class_epc:"${escapeQuery(params.drugClass)}"`);
    }

    if (searchTerms.length === 0) {
      throw new Error('At least one search parameter is required');
    }

    const searchQuery = searchTerms.join(' AND ');
    const limit = Math.min(params.limit || 20, 100);
    const skip = params.skip || 0;

    const url = `${FDA_API_BASE}/label.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}&skip=${skip}`;

    logger.info('[FDA] Searching drugs', { params, url });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No results found
        return { drugs: [], totalCount: 0 };
      }
      throw new Error(`FDA API error: ${response.status} ${response.statusText}`);
    }

    const data: FDADrugSearchResponse = await response.json();

    // Normalize results
    const drugs = data.results.map(normalizeDrugLabel);

    return {
      drugs,
      totalCount: data.meta.results.total,
    };
  } catch (error) {
    logger.error('[FDA] Search error', {
      error: error instanceof Error ? error.message : String(error),
      params,
    });
    throw error;
  }
}

/**
 * Search for drugs by name (simplified search)
 */
export async function searchDrugsByName(
  name: string,
  limit: number = 20
): Promise<{ drugs: Drug[]; totalCount: number }> {
  return searchDrugs({ name, limit });
}

/**
 * Get drug details by NDC code
 */
export async function getDrugByNDC(ndc: string): Promise<Drug | null> {
  // Normalize NDC format (remove dashes)
  const normalizedNDC = ndc.replace(/-/g, '');

  const result = await searchDrugs({ ndc: normalizedNDC, limit: 1 });
  return result.drugs[0] || null;
}

/**
 * Search the FDA NDC Directory for product information
 */
export async function searchNDCDirectory(
  params: DrugSearchParams
): Promise<{ drugs: Drug[]; totalCount: number }> {
  try {
    // Build search query for NDC directory
    const searchTerms: string[] = [];

    if (params.brandName) {
      searchTerms.push(`brand_name:"${escapeQuery(params.brandName)}"`);
    }
    if (params.genericName) {
      searchTerms.push(`generic_name:"${escapeQuery(params.genericName)}"`);
    }
    if (params.name) {
      searchTerms.push(
        `(brand_name:"${escapeQuery(params.name)}" OR generic_name:"${escapeQuery(params.name)}")`
      );
    }
    if (params.ndc) {
      searchTerms.push(`product_ndc:"${escapeQuery(params.ndc.replace(/-/g, ''))}"`);
    }
    if (params.manufacturer) {
      searchTerms.push(`labeler_name:"${escapeQuery(params.manufacturer)}"`);
    }

    if (searchTerms.length === 0) {
      throw new Error('At least one search parameter is required');
    }

    const searchQuery = searchTerms.join(' AND ');
    const limit = Math.min(params.limit || 20, 100);
    const skip = params.skip || 0;

    const url = `${FDA_API_BASE}/ndc.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}&skip=${skip}`;

    logger.info('[FDA NDC] Searching drugs', { params });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { drugs: [], totalCount: 0 };
      }
      throw new Error(`FDA NDC API error: ${response.status} ${response.statusText}`);
    }

    const data: FDANDCSearchResponse = await response.json();

    // Normalize results
    const drugs = data.results.map(normalizeNDCResult);

    return {
      drugs,
      totalCount: data.meta.results.total,
    };
  } catch (error) {
    logger.error('[FDA NDC] Search error', {
      error: error instanceof Error ? error.message : String(error),
      params,
    });
    throw error;
  }
}

/**
 * Get drug interactions and warnings
 */
export async function getDrugInteractions(
  drugName: string
): Promise<{ interactions: string[]; warnings: string[] }> {
  try {
    const result = await searchDrugs({ name: drugName, limit: 1 });

    if (result.drugs.length === 0) {
      return { interactions: [], warnings: [] };
    }

    // Get detailed label information
    const url = `${FDA_API_BASE}/label.json?search=openfda.brand_name:"${escapeQuery(drugName)}"+OR+openfda.generic_name:"${escapeQuery(drugName)}"&limit=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { interactions: [], warnings: [] };
    }

    const data: FDADrugSearchResponse = await response.json();
    const label = data.results[0];

    if (!label) {
      return { interactions: [], warnings: [] };
    }

    return {
      interactions: label.drug_interactions || [],
      warnings: label.warnings || [],
    };
  } catch (error) {
    logger.error('[FDA] Drug interactions error', {
      error: error instanceof Error ? error.message : String(error),
      drugName,
    });
    return { interactions: [], warnings: [] };
  }
}

/**
 * Normalize FDA Drug Label API response to our Drug type
 */
function normalizeDrugLabel(result: FDADrugLabelResult): Drug {
  const openfda = result.openfda || {};

  return {
    brandNames: openfda.brand_name || [],
    genericNames: openfda.generic_name || [],
    activeIngredients: result.active_ingredient || openfda.substance_name || [],
    manufacturers: openfda.manufacturer_name || [],
    ndcs: openfda.product_ndc || [],
    rxcuis: openfda.rxcui || [],
    drugClasses: openfda.pharm_class_epc || [],
    routes: openfda.route || [],
    productTypes: openfda.product_type || [],
    purpose: result.purpose?.[0] || result.indications_and_usage?.[0],
    warnings: result.warnings?.[0],
    dosage: result.dosage_and_administration?.[0],
  };
}

/**
 * Normalize FDA NDC Directory response to our Drug type
 */
function normalizeNDCResult(result: FDANDCResult): Drug {
  return {
    brandNames: result.brand_name ? [result.brand_name] : [],
    genericNames: [result.generic_name],
    activeIngredients: result.active_ingredients.map(
      (ai) => `${ai.name} ${ai.strength}`
    ),
    manufacturers: [result.labeler_name],
    ndcs: [result.product_ndc],
    rxcuis: [],
    drugClasses: result.pharm_class || [],
    routes: result.route || [],
    productTypes: [result.marketing_category],
  };
}

/**
 * Escape special characters in FDA API query
 */
function escapeQuery(query: string): string {
  // Escape special characters for FDA API Lucene-based search
  return query
    .replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1')
    .replace(/\s+/g, '+');
}

/**
 * Common drug categories for quick lookup
 */
export const DRUG_CATEGORIES = {
  // Cardiovascular
  bloodPressure: 'Antihypertensive',
  cholesterol: 'Antilipemic',
  bloodThinner: 'Anticoagulant',

  // Diabetes
  diabetesOral: 'Antidiabetic',
  insulin: 'Insulin',

  // Pain/Inflammation
  nsaid: 'NSAID',
  opioid: 'Opioid',
  acetaminophen: 'Analgesic',

  // Mental Health
  antidepressant: 'Antidepressant',
  antianxiety: 'Antianxiety',
  antipsychotic: 'Antipsychotic',

  // Respiratory
  asthma: 'Bronchodilator',
  antihistamine: 'Antihistamine',

  // Gastrointestinal
  protonPump: 'Proton Pump Inhibitor',
  antacid: 'Antacid',

  // Antibiotics
  antibiotic: 'Antibiotic',
  antifungal: 'Antifungal',
  antiviral: 'Antiviral',

  // Thyroid
  thyroid: 'Thyroid',
};

/**
 * Get common brand names for a generic drug
 */
export const COMMON_GENERICS: Record<string, string[]> = {
  // Blood Pressure
  lisinopril: ['Prinivil', 'Zestril'],
  amlodipine: ['Norvasc'],
  metoprolol: ['Lopressor', 'Toprol-XL'],
  losartan: ['Cozaar'],
  hydrochlorothiazide: ['Microzide'],

  // Cholesterol
  atorvastatin: ['Lipitor'],
  simvastatin: ['Zocor'],
  rosuvastatin: ['Crestor'],

  // Diabetes
  metformin: ['Glucophage', 'Fortamet'],
  glipizide: ['Glucotrol'],
  sitagliptin: ['Januvia'],

  // Pain
  ibuprofen: ['Advil', 'Motrin'],
  naproxen: ['Aleve', 'Naprosyn'],
  gabapentin: ['Neurontin'],

  // Mental Health
  sertraline: ['Zoloft'],
  fluoxetine: ['Prozac'],
  escitalopram: ['Lexapro'],
  duloxetine: ['Cymbalta'],
  bupropion: ['Wellbutrin'],

  // Respiratory
  albuterol: ['ProAir', 'Ventolin', 'Proventil'],
  montelukast: ['Singulair'],

  // Gastrointestinal
  omeprazole: ['Prilosec'],
  pantoprazole: ['Protonix'],
  esomeprazole: ['Nexium'],

  // Thyroid
  levothyroxine: ['Synthroid', 'Levoxyl'],

  // Antibiotics
  amoxicillin: ['Amoxil'],
  azithromycin: ['Zithromax', 'Z-Pack'],
  ciprofloxacin: ['Cipro'],
};

/**
 * Estimate drug tier from drug characteristics
 */
export function estimateDrugTier(drug: Drug): 'generic' | 'preferred-brand' | 'non-preferred' | 'specialty' {
  // Check if it has both brand and generic names
  const hasBrand = drug.brandNames.length > 0;
  const hasGeneric = drug.genericNames.length > 0;

  // Check if the product type indicates OTC
  const isOTC = drug.productTypes.some((t) =>
    t.toLowerCase().includes('otc') || t.toLowerCase().includes('over-the-counter')
  );

  if (isOTC) {
    return 'generic';
  }

  // Check for specialty drug indicators
  const specialtyIndicators = [
    'biologic',
    'injectable',
    'infusion',
    'immunosuppressant',
    'oncology',
    'hepatitis',
    'hiv',
    'multiple sclerosis',
  ];

  const isSpecialty = specialtyIndicators.some(
    (indicator) =>
      drug.drugClasses.some((c) => c.toLowerCase().includes(indicator)) ||
      drug.purpose?.toLowerCase().includes(indicator) ||
      drug.routes.some((r) => r.toLowerCase().includes('injection'))
  );

  if (isSpecialty) {
    return 'specialty';
  }

  // If has a brand name, it's likely preferred-brand tier
  // (branded version of a drug, even if generic is available)
  if (hasBrand) {
    return 'preferred-brand';
  }

  // If generic only (no brand name), it's generic tier
  if (hasGeneric && !hasBrand) {
    return 'generic';
  }

  // If it's a common generic, it's generic tier
  const genericName = drug.genericNames[0]?.toLowerCase();
  if (genericName && Object.keys(COMMON_GENERICS).includes(genericName)) {
    return 'generic';
  }

  return 'generic';
}
