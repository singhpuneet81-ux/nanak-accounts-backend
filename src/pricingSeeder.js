require('dotenv').config();
const mongoose = require('mongoose');
const PricingService = require('./models/PricingService');
const MONGO_URI = process.env.MONGODB_URI;

const pricingData = [
  {
    key: "abn",
    label: "ABN Registration",
    foundation: {
      title: "Foundation Setup",
      price: 99,
      features: [
        "ABN Registration with ATO",
        "Business Name Availability Check",
        "GST Registration Assessment",
        "Tax File Number (TFN) Setup",
        "Business Structure Consultation",
        "ATO Portal Access & Setup",
        "Record Keeping Requirements Guide",
        "Business Banking Setup Advice",
        "Compliance Calendar & Reminders",
      ],
    },
    accounting: {
      includes: [
        "Monthly Bookkeeping & Bank Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Tax Return Preparation",
        "GST Reconciliation & Compliance",
      ],
      extraCount: 8,
    },
  },

  {
    key: "business_name",
    label: "Business Name",
    foundation: {
      title: "Foundation Setup",
      price: 149,
      features: [
        "ASIC Business Name Registration",
        "Nationwide Name Availability Check",
        "Trademark Conflict Search",
        "Domain Name Availability Check",
        "ABN & TFN Registration Included",
        "Business Name Certificate",
        "1 or 3 Year Registration Options",
        "ASIC Renewal Reminders",
        "Brand Protection Advice",
      ],
    },
    accounting: {
      includes: [
        "Monthly Bookkeeping & Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Tax Return Preparation",
        "GST Registration & Compliance",
      ],
      extraCount: 8,
    },
  },

  {
    key: "family_trust",
    label: "Family Trust",
    foundation: {
      title: "Foundation Setup",
      price: 1199,
      features: [
        "Professional Trust Deed Preparation",
        "Trustee Structure Setup (Individual or Corporate)",
        "ABN & TFN Registration for Trust",
        "Trust Bank Account Setup Guidance",
        "Beneficiary Designation & Documentation",
        "Appointor & Guardian Appointment",
        "TFN Applications for Beneficiaries",
        "Asset Protection Strategy Review",
        "Stamp Duty Advice (State-specific)",
        "Trust Resolutions & Minutes Templates",
        "Compliance Calendar Setup",
        "ATO Registration & Tax Setup",
      ],
    },
    accounting: {
      includes: [
        "Monthly Bookkeeping & Trust Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Trust Tax Return Preparation",
        "Trust Distribution Calculations",
      ],
      extraCount: 10,
    },
  },

  {
    key: "gst",
    label: "GST Registration",
    foundation: {
      title: "Foundation Setup",
      price: 129,
      features: [
        "GST Registration with ATO",
        "ABN Validation & Update",
        "GST Reporting Method Setup (Monthly/Quarterly)",
        "BAS Agent Registration",
        "GST Accounting System Setup",
        "Input Tax Credit Advice",
        "GST Compliance Calendar",
        "Record Keeping Requirements Guide",
        "First BAS Lodgement Assistance",
      ],
    },
    accounting: {
      includes: [
        "Monthly Bookkeeping & Bank Reconciliation",
        "Quarterly or Monthly BAS Preparation",
        "BAS Lodgement with ATO",
        "GST Reconciliation & Reporting",
      ],
      extraCount: 8,
    },
  },

  {
    key: "charity",
    label: "Charity Setup",
    foundation: {
      title: "Foundation Setup",
      price: 899,
      features: [
        "ACNC Charity Registration",
        "DGR Status Application (if eligible)",
        "Charity Constitution & Governing Documents",
        "ABN & TFN Registration for Charity",
        "Charity Subtype Selection & Classification",
        "Responsible Persons Registration",
        "Public Charity Register Listing",
        "Tax Concession Applications",
        "GST Concession Registration",
        "FBT & Payroll Tax Exemptions",
        "Fundraising Permit Guidance",
        "Compliance Framework Setup",
      ],
    },
    accounting: {
      includes: [
        "Charity Bookkeeping & Fund Accounting",
        "Annual Financial Statement Preparation (ACNC)",
        "ACNC Annual Information Statement",
        "Donor Receipt & Tax Deduction Management",
      ],
      extraCount: 10,
    },
  },

  {
    key: "company",
    label: "Company Registration",
    foundation: {
      title: "Foundation Setup",
      price: 399,
      features: [
        "ASIC Company Registration",
        "ACN & TFN Application",
        "ABN Registration",
        "GST Registration (if required)",
        "Company Constitution",
        "Share Certificates",
        "ASIC Annual Review Setup",
        "Company Compliance Guide",
        "Free Name Availability Check",
      ],
    },
    accounting: {
      includes: [
        "Monthly Bookkeeping & Bank Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Financial Statements",
        "Annual Tax Return Lodgement",
      ],
      extraCount: 8,
    },
  },

  {
    key: "smsf",
    label: "SMSF Setup",
    foundation: {
      title: "Foundation Setup",
      price: 799,
      features: [
        "Professional SMSF Trust Deed",
        "Corporate Trustee Company Setup",
        "SMSF ABN & TFN Registration",
        "ATO SMSF Registration & Regulator Notification",
        "Electronic Service Address (ESA) Setup",
        "SMSF Bank Account Setup Guidance",
        "Comprehensive Investment Strategy Document",
        "Rollover Request Documentation",
        "Member Benefit Statements",
        "Trustee Resolution Templates",
        "Compliance Calendar & Checklist",
        "SMSF Accounting System Setup",
      ],
    },
    accounting: {
      includes: [
        "SMSF Bookkeeping & Transaction Recording",
        "Annual SMSF Tax Return Lodgement",
        "Annual SMSF Financial Statements",
        "Independent SMSF Audit Coordination",
      ],
      extraCount: 10,
    },
  },

  {
    key: "partnership",
    label: "Partnership",
    foundation: {
      title: "Foundation Setup",
      price: 299,
      features: [
        "Professional Partnership Agreement",
        "ABN & TFN Registration for Partnership",
        "Partner Capital Account Setup",
        "Profit & Loss Sharing Structure",
        "Partnership Name Registration (ASIC)",
        "Banking Setup Guidance",
        "Tax Registration & ATO Setup",
        "Partner Entry/Exit Provisions",
        "Dispute Resolution Framework",
        "Partnership Dissolution Terms",
        "Partner Roles & Responsibilities Documentation",
        "Compliance Calendar Setup",
      ],
    },
    accounting: {
      includes: [
        "Monthly Partnership Bookkeeping",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Partnership Tax Return",
        "Partner Distribution Statements",
      ],
      extraCount: 10,
    },
  },

  {
    key: "unit_trust",
    label: "Unit Trust",
    foundation: {
      title: "Foundation Setup",
      price: 1199,
      features: [
        "Professional Unit Trust Deed Preparation",
        "Trustee Structure Setup (Individual or Corporate)",
        "ABN & TFN Registration for Trust",
        "Unit Certificates & Register",
        "Unitholder Agreement Documentation",
        "Trust Bank Account Setup Guidance",
        "Stamp Duty Advice (State-specific)",
        "Trust Resolutions & Minutes Templates",
        "ATO Registration & Tax Setup",
        "Compliance Calendar Setup",
      ],
    },
    accounting: {
      includes: [
        "Monthly Bookkeeping & Trust Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Trust Tax Return Preparation",
        "Unit Distribution Calculations",
      ],
      extraCount: 10,
    },
  },

  {
    key: "bare_trust",
    label: "Bare Trust",
    foundation: {
      title: "Foundation Setup",
      price: 2000,
      features: [
        "Bare Trust Deed Preparation",
        "LRBA Documentation & Compliance",
        "Trustee Appointment & Resolutions",
        "ABN Registration (if required)",
        "Property Holding Structure Setup",
        "Loan Agreement Review & Documentation",
        "ATO Compliance Guide",
        "Settlement Coordination Support",
        "Trust Resolutions & Minutes",
        "Ongoing Compliance Checklist",
      ],
    },
    accounting: {
      includes: [
        "Bare Trust Bookkeeping & Reconciliation",
        "Annual Bare Trust Tax Return",
        "LRBA Compliance Monitoring",
        "Property Income & Expense Tracking",
      ],
      extraCount: 8,
    },
  },
  {
  "key": "business_plan",
  "label": "Business Plan",
  "foundation": { "title": "Business Plan", "price": 990, "features": [] },
  "accounting": { "includes": [], "extraCount": 0 },
  "meta": {
    "plans": [
      {
        "id": "startup",
        "label": "Startup",
        "subtitle": "Pre-launch or just established",
        "badge": "Pre-launch / Startup stage",
        "price": 990,
        "delivery": "5-8 business days delivery",
        "recommended": false,
        "features": [
          "3-5 year financial projections (P&L, Cash Flow)",
          "Market analysis & competitor research",
          "Executive summary & business overview",
          "Marketing & sales strategy",
          "Professional graphic design",
          "Unlimited revisions (30 days)"
        ]
      },
      {
        "id": "growth",
        "label": "Growth",
        "subtitle": "Established and scaling operations",
        "badge": "1-3 years in business",
        "price": 1299,
        "delivery": "5-8 business days delivery",
        "recommended": true,
        "features": [
          "3-5 year comprehensive financial projections",
          "In-depth market & competitor analysis",
          "Growth strategy & expansion roadmap",
          "Marketing plan with customer acquisition",
          "Operational & organizational structure",
          "Premium graphic design & formatting",
          "Unlimited revisions (30 days)"
        ]
      },
      {
        "id": "established",
        "label": "Established",
        "subtitle": "Mature business seeking funding",
        "badge": "3+ years in business",
        "price": 1499,
        "delivery": "5-8 business days delivery",
        "recommended": false,
        "features": [
          "Comprehensive 3-5 year financial projections",
          "Historical performance analysis",
          "Advanced market positioning & strategy",
          "Detailed marketing & growth plan",
          "Risk assessment & mitigation strategies",
          "Management & operations analysis",
          "Premium design + Pitch deck included",
          "Unlimited revisions (30 days)"
        ]
      }
    ],
    "addons": [
      { "id": "pitch_deck", "label": "Investor Pitch Deck", "price": 750 },
      { "id": "excel_model", "label": "Excel Financial Model", "price": 500 },
      { "id": "pitch_training", "label": "Investor Presentation Training", "price": 650 },
      { "id": "rush_delivery", "label": "Rush Delivery (3-4 business days)", "price": 500 }
    ]
  }
},
{
  "key": "business_valuation",
  "label": "Business Valuation",
  "foundation": { "title": "Business Valuation", "price": 1399, "features": [] },
  "accounting": { "includes": [], "extraCount": 0 },
  "meta": {
    "plans": [
      {
        "id": "appraisal",
        "label": "Appraisal Report",
        "subtitle": "Estimate of business value for internal use and general purposes",
        "badge": null,
        "price": 1399,
        "delivery": "7-10 business days delivery",
        "recommended": false,
        "features": [
          "Short-form Business Appraisal Report",
          "Estimate of business value",
          "Industry benchmarking analysis",
          "Pre-release discussion with experts",
          "Business & industry risk assessment"
        ]
      },
      {
        "id": "standard",
        "label": "Standard Business Valuation",
        "subtitle": "Comprehensive report for sale, divorce, disputes, or court proceedings",
        "badge": "MOST POPULAR · COURT ACCEPTED",
        "price": 3159,
        "delivery": "7-10 business days delivery",
        "recommended": true,
        "features": [
          "Detailed Business Valuation Report",
          "Comprehensive financial statement analysis",
          "Detailed industry & market analysis",
          "Pre-release discussion with experts",
          "Risk analysis & adjustment factors",
          "Court-acceptable documentation",
          "Multiple valuation methodologies"
        ]
      }
    ]
  }
},
{
  "key": "business_due_diligence",
  "label": "Business Due Diligence",
  "foundation": { "title": "Business Due Diligence", "price": 500, "features": [] },
  "accounting": { "includes": [], "extraCount": 0 },
  "meta": {
    "plans": [
      {
        "id": "snapshot",
        "label": "Financial Snapshot Review",
        "subtitle": "Essential Review",
        "badge": null,
        "price": 500,
        "delivery": "3-5 business days",
        "recommended": false,
        "features": [
          "2 year financial statement analysis",
          "Revenue & profit trend review",
          "Expense and margin analysis",
          "Basic cash flow review",
          "Working capital health check",
          "Industry ratio comparison",
          "Risk flag summary report",
          "30 min strategy call"
        ]
      },
      {
        "id": "comprehensive",
        "label": "Comprehensive Financial DD",
        "subtitle": "Full Analysis & Valuation",
        "badge": "RECOMMENDED",
        "price": 1500,
        "delivery": "5-7 business days",
        "recommended": true,
        "features": [
          "3-5 year deep financial analysis",
          "Normalised earnings adjustment (EBITDA correction)",
          "Valuation using EBITDA multiple, revenue multiple, DCF",
          "Tax risk exposure analysis",
          "Owner add-backs review",
          "Cash flow sustainability modelling",
          "Break-even sensitivity modelling",
          "Financial risk heat map",
          "Negotiation support insights",
          "Written valuation opinion report",
          "60-min strategic advisory call"
        ]
      }
    ]
  }
}
];

async function seedPricing() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("Clearing old pricing...");
    await PricingService.deleteMany({});

    console.log("Seeding pricing...");
    await PricingService.insertMany(pricingData);

    console.log("Pricing seeded successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedPricing();
