export type LenderType = "Bank" | "NBFC" | "Housing Finance Company" | "Financial Institution";

export type LoanRateItem = {
  id: string;
  name: string;
  rate: string;
  display_rate: string;
  tenure: string;
  is_active: boolean;
  sort_order: number;
};

export type LenderItem = {
  id: string;
  name: string;
  type: LenderType;
  logo_url?: string | null;
  alt_text?: string | null;
  website_url?: string | null;
  supported_loans?: string[] | null;
  display_text?: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type FinancialStatistics = {
  funding_facilitated: string;
  median_sanction_time: string;
  lender_relationships: string;
  best_secured_rate: string;
};

export type FinancialShowcaseConfig = {
  statistics: FinancialStatistics;
  emi: {
    default_rate: number;
    min_amount: number;
    max_amount: number;
    min_years: number;
    max_years: number;
    disclaimer: string;
  };
  rates: LoanRateItem[];
  rate_note: string;
  rate_disclaimer: string;
  partnerships_heading: string;
  partnerships_description: string;
  lenders: LenderItem[];
};

export const DEFAULT_FINANCIAL_STATISTICS: FinancialStatistics = {
  funding_facilitated: "₹150 Cr",
  median_sanction_time: "15 days",
  lender_relationships: "86+",
  best_secured_rate: "7.5%",
};

export const DEFAULT_LOAN_RATES: LoanRateItem[] = [
  {
    id: "rate-home-loan",
    name: "Home Loan",
    rate: "7.50%",
    display_rate: "7.50% onwards",
    tenure: "Up to 30 years",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "rate-business-loan",
    name: "Business Loan",
    rate: "9.90%",
    display_rate: "9.90% onwards",
    tenure: "Up to 7 years",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "rate-lap",
    name: "Loan Against Property",
    rate: "8.50%",
    display_rate: "8.50% onwards",
    tenure: "Up to 15 years",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "rate-msme",
    name: "MSME / Working Capital",
    rate: "9.50%",
    display_rate: "9.50% onwards",
    tenure: "Renewable",
    is_active: true,
    sort_order: 4,
  },
  {
    id: "rate-personal-loan",
    name: "Personal Loan",
    rate: "9.90%",
    display_rate: "9.90% onwards",
    tenure: "Up to 5 years",
    is_active: true,
    sort_order: 5,
  },
  {
    id: "rate-vehicle-loan",
    name: "Vehicle / Car Loan",
    rate: "8.40%",
    display_rate: "8.40% onwards",
    tenure: "Up to 7 years",
    is_active: true,
    sort_order: 6,
  },
];

export const DEFAULT_LENDERS: LenderItem[] = [
  {
    id: "lender-sbi",
    name: "SBI",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 1,
  },
  {
    id: "lender-hdfc",
    name: "HDFC Bank",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 2,
  },
  {
    id: "lender-icici",
    name: "ICICI Bank",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 3,
  },
  {
    id: "lender-axis",
    name: "Axis Bank",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 4,
  },
  {
    id: "lender-bob",
    name: "Bank of Baroda",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 5,
  },
  {
    id: "lender-kotak",
    name: "Kotak Mahindra Bank",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 6,
  },
  {
    id: "lender-pnb",
    name: "Punjab National Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 7,
  },
  {
    id: "lender-canara",
    name: "Canara Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 8,
  },
  {
    id: "lender-union",
    name: "Union Bank of India",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 9,
  },
  {
    id: "lender-boi",
    name: "Bank of India",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 10,
  },
  {
    id: "lender-bom",
    name: "Bank of Maharashtra",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 11,
  },
  {
    id: "lender-indian",
    name: "Indian Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 12,
  },
  {
    id: "lender-cbi",
    name: "Central Bank of India",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 13,
  },
  {
    id: "lender-idbi",
    name: "IDBI Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 14,
  },
  {
    id: "lender-indusind",
    name: "IndusInd Bank",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 15,
  },
  {
    id: "lender-federal",
    name: "Federal Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 16,
  },
  {
    id: "lender-rbl",
    name: "RBL Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 17,
  },
  {
    id: "lender-yes",
    name: "Yes Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 18,
  },
  {
    id: "lender-sib",
    name: "South Indian Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 19,
  },
  {
    id: "lender-dcb",
    name: "DCB Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 20,
  },
  {
    id: "lender-bandhan",
    name: "Bandhan Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 21,
  },
  {
    id: "lender-au",
    name: "AU Small Finance Bank",
    type: "Bank",
    is_active: true,
    is_featured: true,
    sort_order: 22,
  },
  {
    id: "lender-kvb",
    name: "Karur Vysya Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 23,
  },
  {
    id: "lender-karnataka",
    name: "Karnataka Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 24,
  },
  {
    id: "lender-ujjivan",
    name: "Ujjivan Small Finance Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 25,
  },
  {
    id: "lender-utkarsh",
    name: "Utkarsh Small Finance Bank",
    type: "Bank",
    is_active: true,
    is_featured: false,
    sort_order: 26,
  },
  {
    id: "lender-tata",
    name: "Tata Capital",
    type: "NBFC",
    is_active: true,
    is_featured: true,
    sort_order: 27,
  },
  {
    id: "lender-bajaj",
    name: "Bajaj Finance",
    type: "NBFC",
    is_active: true,
    is_featured: true,
    sort_order: 28,
  },
  {
    id: "lender-aditya-birla",
    name: "Aditya Birla Finance",
    type: "NBFC",
    is_active: true,
    is_featured: true,
    sort_order: 29,
  },
  {
    id: "lender-poonawalla",
    name: "Poonawalla Fincorp",
    type: "NBFC",
    is_active: true,
    is_featured: false,
    sort_order: 30,
  },
  {
    id: "lender-lt",
    name: "L&T Finance",
    type: "NBFC",
    is_active: true,
    is_featured: false,
    sort_order: 31,
  },
  {
    id: "lender-mahindra",
    name: "Mahindra Finance",
    type: "NBFC",
    is_active: true,
    is_featured: false,
    sort_order: 32,
  },
  {
    id: "lender-shriram",
    name: "Shriram Finance",
    type: "NBFC",
    is_active: true,
    is_featured: false,
    sort_order: 33,
  },
  {
    id: "lender-chola",
    name: "Cholamandalam Finance",
    type: "NBFC",
    is_active: true,
    is_featured: false,
    sort_order: 34,
  },
];

export const DEFAULT_FINANCIAL_CONFIG: FinancialShowcaseConfig = {
  statistics: DEFAULT_FINANCIAL_STATISTICS,
  emi: {
    default_rate: 8.9,
    min_amount: 200000,
    max_amount: 20000000,
    min_years: 1,
    max_years: 30,
    disclaimer:
      "Indicative only. Final rate depends on applicant profile, credit score, loan type and lender policy.",
  },
  rates: DEFAULT_LOAN_RATES,
  rate_note:
    "Starting rates shown for indicative comparison. Final pricing depends on lender and applicant profile.",
  rate_disclaimer:
    "Interest rates shown are indicative starting rates and may vary based on lender, applicant profile, credit score, income, loan amount, tenure and other applicable conditions. Final rate is subject to lender approval.",
  partnerships_heading: "Bank Partnerships",
  partnerships_description:
    "We work with a wide network of banks and financial institutions across Gujarat and India to help match customers with suitable loan options.",
  lenders: DEFAULT_LENDERS,
};
