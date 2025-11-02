/**
 * State Medicaid Resources
 * Application URLs and contact information for all 50 states + DC
 */

export interface MedicaidResource {
  state: string;
  stateName: string;
  hasExpansion: boolean;
  applicationUrl: string;
  phoneNumber: string;
  notes?: string;
}

export const MEDICAID_RESOURCES: Record<string, MedicaidResource> = {
  AL: {
    state: 'AL',
    stateName: 'Alabama',
    hasExpansion: false,
    applicationUrl: 'https://www.medicaid.alabama.gov/',
    phoneNumber: '1-888-373-5437',
  },
  AK: {
    state: 'AK',
    stateName: 'Alaska',
    hasExpansion: true,
    applicationUrl: 'https://www.medicaidalaska.com/',
    phoneNumber: '1-888-318-8890',
  },
  AZ: {
    state: 'AZ',
    stateName: 'Arizona',
    hasExpansion: true,
    applicationUrl: 'https://www.azahcccs.gov/',
    phoneNumber: '1-855-432-7587',
  },
  AR: {
    state: 'AR',
    stateName: 'Arkansas',
    hasExpansion: true,
    applicationUrl: 'https://medicaid.mmis.arkansas.gov/',
    phoneNumber: '1-855-372-1363',
  },
  CA: {
    state: 'CA',
    stateName: 'California',
    hasExpansion: true,
    applicationUrl: 'https://www.dhcs.ca.gov/services/medi-cal',
    phoneNumber: '1-916-552-9200',
  },
  CO: {
    state: 'CO',
    stateName: 'Colorado',
    hasExpansion: true,
    applicationUrl: 'https://www.healthfirstcolorado.com/',
    phoneNumber: '1-800-221-3943',
  },
  CT: {
    state: 'CT',
    stateName: 'Connecticut',
    hasExpansion: true,
    applicationUrl: 'https://portal.ct.gov/DSS/Health-And-Home-Care/Medicaid',
    phoneNumber: '1-855-626-6632',
  },
  DE: {
    state: 'DE',
    stateName: 'Delaware',
    hasExpansion: true,
    applicationUrl: 'https://dhss.delaware.gov/dhss/dmma/',
    phoneNumber: '1-800-372-2022',
  },
  DC: {
    state: 'DC',
    stateName: 'District of Columbia',
    hasExpansion: true,
    applicationUrl: 'https://dhcf.dc.gov/service/medicaid',
    phoneNumber: '1-202-727-5355',
  },
  FL: {
    state: 'FL',
    stateName: 'Florida',
    hasExpansion: false,
    applicationUrl: 'https://www.myflfamilies.com/service-programs/access/medicaid.shtml',
    phoneNumber: '1-866-762-2237',
  },
  GA: {
    state: 'GA',
    stateName: 'Georgia',
    hasExpansion: false,
    applicationUrl: 'https://medicaid.georgia.gov/',
    phoneNumber: '1-877-423-4746',
  },
  HI: {
    state: 'HI',
    stateName: 'Hawaii',
    hasExpansion: true,
    applicationUrl: 'https://medquest.hawaii.gov/',
    phoneNumber: '1-800-316-8005',
  },
  ID: {
    state: 'ID',
    stateName: 'Idaho',
    hasExpansion: true,
    applicationUrl: 'https://healthandwelfare.idaho.gov/health-coverage-assistance/medicaid-health-coverage',
    phoneNumber: '1-877-456-1233',
  },
  IL: {
    state: 'IL',
    stateName: 'Illinois',
    hasExpansion: true,
    applicationUrl: 'https://www.illinois.gov/hfs/medicalprograms.html',
    phoneNumber: '1-800-843-6154',
  },
  IN: {
    state: 'IN',
    stateName: 'Indiana',
    hasExpansion: true,
    applicationUrl: 'https://www.in.gov/medicaid/',
    phoneNumber: '1-800-403-0864',
  },
  IA: {
    state: 'IA',
    stateName: 'Iowa',
    hasExpansion: true,
    applicationUrl: 'https://dhs.iowa.gov/ime/members',
    phoneNumber: '1-800-338-8366',
  },
  KS: {
    state: 'KS',
    stateName: 'Kansas',
    hasExpansion: false,
    applicationUrl: 'https://www.kancare.ks.gov/',
    phoneNumber: '1-800-792-4884',
  },
  KY: {
    state: 'KY',
    stateName: 'Kentucky',
    hasExpansion: true,
    applicationUrl: 'https://chfs.ky.gov/agencies/dms/Pages/default.aspx',
    phoneNumber: '1-855-459-6328',
  },
  LA: {
    state: 'LA',
    stateName: 'Louisiana',
    hasExpansion: true,
    applicationUrl: 'https://ldh.la.gov/index.cfm/subhome/1/n/91',
    phoneNumber: '1-888-342-6207',
  },
  ME: {
    state: 'ME',
    stateName: 'Maine',
    hasExpansion: true,
    applicationUrl: 'https://www.maine.gov/dhhs/ofi/programs-services/mainecare',
    phoneNumber: '1-855-797-4357',
  },
  MD: {
    state: 'MD',
    stateName: 'Maryland',
    hasExpansion: true,
    applicationUrl: 'https://mmcp.health.maryland.gov/',
    phoneNumber: '1-800-492-5231',
  },
  MA: {
    state: 'MA',
    stateName: 'Massachusetts',
    hasExpansion: true,
    applicationUrl: 'https://www.mass.gov/masshealth',
    phoneNumber: '1-800-841-2900',
  },
  MI: {
    state: 'MI',
    stateName: 'Michigan',
    hasExpansion: true,
    applicationUrl: 'https://www.michigan.gov/mdhhs/assistance-programs/medicaid',
    phoneNumber: '1-800-642-3195',
  },
  MN: {
    state: 'MN',
    stateName: 'Minnesota',
    hasExpansion: true,
    applicationUrl: 'https://mn.gov/dhs/people-we-serve/children-and-families/health-care/health-care-programs/programs-and-services/ma.jsp',
    phoneNumber: '1-800-657-3739',
  },
  MS: {
    state: 'MS',
    stateName: 'Mississippi',
    hasExpansion: false,
    applicationUrl: 'https://medicaid.ms.gov/',
    phoneNumber: '1-800-421-2408',
  },
  MO: {
    state: 'MO',
    stateName: 'Missouri',
    hasExpansion: true,
    applicationUrl: 'https://dss.mo.gov/mhd/',
    phoneNumber: '1-855-373-4636',
  },
  MT: {
    state: 'MT',
    stateName: 'Montana',
    hasExpansion: true,
    applicationUrl: 'https://dphhs.mt.gov/medicaid',
    phoneNumber: '1-800-362-8312',
  },
  NE: {
    state: 'NE',
    stateName: 'Nebraska',
    hasExpansion: true,
    applicationUrl: 'https://dhhs.ne.gov/Pages/Medicaid-Services.aspx',
    phoneNumber: '1-855-632-7633',
  },
  NV: {
    state: 'NV',
    stateName: 'Nevada',
    hasExpansion: true,
    applicationUrl: 'https://dwss.nv.gov/Medicaid/NevadaMedicaid/',
    phoneNumber: '1-800-992-0900',
  },
  NH: {
    state: 'NH',
    stateName: 'New Hampshire',
    hasExpansion: true,
    applicationUrl: 'https://www.dhhs.nh.gov/programs-services/medicaid',
    phoneNumber: '1-844-275-3447',
  },
  NJ: {
    state: 'NJ',
    stateName: 'New Jersey',
    hasExpansion: true,
    applicationUrl: 'https://www.state.nj.us/humanservices/dmahs/clients/',
    phoneNumber: '1-800-356-1561',
  },
  NM: {
    state: 'NM',
    stateName: 'New Mexico',
    hasExpansion: true,
    applicationUrl: 'https://www.hsd.state.nm.us/medical-assistance-division/',
    phoneNumber: '1-888-997-2583',
  },
  NY: {
    state: 'NY',
    stateName: 'New York',
    hasExpansion: true,
    applicationUrl: 'https://www.health.ny.gov/health_care/medicaid/',
    phoneNumber: '1-800-541-2831',
  },
  NC: {
    state: 'NC',
    stateName: 'North Carolina',
    hasExpansion: true,
    applicationUrl: 'https://medicaid.ncdhhs.gov/',
    phoneNumber: '1-888-245-0179',
  },
  ND: {
    state: 'ND',
    stateName: 'North Dakota',
    hasExpansion: true,
    applicationUrl: 'https://www.hhs.nd.gov/medicaid',
    phoneNumber: '1-844-854-4825',
  },
  OH: {
    state: 'OH',
    stateName: 'Ohio',
    hasExpansion: true,
    applicationUrl: 'https://medicaid.ohio.gov/',
    phoneNumber: '1-800-324-8680',
  },
  OK: {
    state: 'OK',
    stateName: 'Oklahoma',
    hasExpansion: false,
    applicationUrl: 'https://oklahoma.gov/ohca.html',
    phoneNumber: '1-800-987-7767',
  },
  OR: {
    state: 'OR',
    stateName: 'Oregon',
    hasExpansion: true,
    applicationUrl: 'https://www.oregon.gov/oha/hsd/ohp/pages/index.aspx',
    phoneNumber: '1-800-699-9075',
  },
  PA: {
    state: 'PA',
    stateName: 'Pennsylvania',
    hasExpansion: true,
    applicationUrl: 'https://www.dhs.pa.gov/Services/Assistance/Pages/MA-General.aspx',
    phoneNumber: '1-800-692-7462',
  },
  RI: {
    state: 'RI',
    stateName: 'Rhode Island',
    hasExpansion: true,
    applicationUrl: 'https://eohhs.ri.gov/initiatives/medicaid',
    phoneNumber: '1-855-840-4774',
  },
  SC: {
    state: 'SC',
    stateName: 'South Carolina',
    hasExpansion: false,
    applicationUrl: 'https://www.scdhhs.gov/',
    phoneNumber: '1-888-549-0820',
  },
  SD: {
    state: 'SD',
    stateName: 'South Dakota',
    hasExpansion: true,
    applicationUrl: 'https://dss.sd.gov/medicaid/',
    phoneNumber: '1-800-452-7691',
  },
  TN: {
    state: 'TN',
    stateName: 'Tennessee',
    hasExpansion: false,
    applicationUrl: 'https://www.tn.gov/tenncare.html',
    phoneNumber: '1-855-259-0701',
  },
  TX: {
    state: 'TX',
    stateName: 'Texas',
    hasExpansion: false,
    applicationUrl: 'https://www.hhs.texas.gov/services/health/medicaid-chip',
    phoneNumber: '1-800-252-8263',
  },
  UT: {
    state: 'UT',
    stateName: 'Utah',
    hasExpansion: true,
    applicationUrl: 'https://medicaid.utah.gov/',
    phoneNumber: '1-800-662-9651',
  },
  VT: {
    state: 'VT',
    stateName: 'Vermont',
    hasExpansion: true,
    applicationUrl: 'https://dvha.vermont.gov/healthcare-coverage/medicaid-services',
    phoneNumber: '1-800-250-8427',
  },
  VA: {
    state: 'VA',
    stateName: 'Virginia',
    hasExpansion: true,
    applicationUrl: 'https://www.dmas.virginia.gov/',
    phoneNumber: '1-855-242-8282',
  },
  WA: {
    state: 'WA',
    stateName: 'Washington',
    hasExpansion: true,
    applicationUrl: 'https://www.hca.wa.gov/health-care-services-supports/apple-health-medicaid-coverage',
    phoneNumber: '1-800-562-3022',
  },
  WV: {
    state: 'WV',
    stateName: 'West Virginia',
    hasExpansion: true,
    applicationUrl: 'https://dhhr.wv.gov/bms/Pages/default.aspx',
    phoneNumber: '1-877-716-1212',
  },
  WI: {
    state: 'WI',
    stateName: 'Wisconsin',
    hasExpansion: true,
    applicationUrl: 'https://www.dhs.wisconsin.gov/badgercareplus/index.htm',
    phoneNumber: '1-800-362-3002',
  },
  WY: {
    state: 'WY',
    stateName: 'Wyoming',
    hasExpansion: false,
    applicationUrl: 'https://health.wyo.gov/healthcarefin/medicaid/',
    phoneNumber: '1-855-294-2127',
  },
};

/**
 * Get Medicaid resource for a specific state
 */
export function getMedicaidResource(stateCode: string): MedicaidResource | null {
  return MEDICAID_RESOURCES[stateCode.toUpperCase()] || null;
}

/**
 * Get application URL for a state
 */
export function getMedicaidApplicationUrl(stateCode: string): string {
  const resource = getMedicaidResource(stateCode);
  return resource?.applicationUrl || 'https://www.healthcare.gov';
}
