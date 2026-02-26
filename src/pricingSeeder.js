require('dotenv').config();
const mongoose = require('mongoose');
const PricingService = require('./models/PricingService');
const MONGO_URI = process.env.MONGODB_URI;


const pricingData = [  {
    "key": "abn",
    "category": "business_formation",
    "label": "ABN Registration",
    "foundation": {
      "title": "Foundation Setup",
      "price": 99,
      "features": [
        "ABN Registration with ATO",
        "Business Name Availability Check",
        "GST Registration Assessment",
        "Tax File Number (TFN) Setup",
        "Business Structure Consultation",
        "ATO Portal Access & Setup",
        "Record Keeping Requirements Guide",
        "Business Banking Setup Advice",
        "Compliance Calendar & Reminders"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Bookkeeping & Bank Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Tax Return Preparation",
        "GST Reconciliation & Compliance"
      ],
      "extraCount": 8
    }
  },
  {
    "key": "business_name",
    "category": "business_formation",
    "label": "Business Name",
    "foundation": {
      "title": "Foundation Setup",
      "price": 149,
      "features": [
        "ASIC Business Name Registration",
        "Nationwide Name Availability Check",
        "Trademark Conflict Search",
        "Domain Name Availability Check",
        "ABN & TFN Registration Included",
        "Business Name Certificate",
        "1 or 3 Year Registration Options",
        "ASIC Renewal Reminders",
        "Brand Protection Advice"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Bookkeeping & Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Tax Return Preparation",
        "GST Registration & Compliance"
      ],
      "extraCount": 8
    }
  },
  {
    "key": "family_trust",
    "category": "business_formation",
    "label": "Family Trust",
    "foundation": {
      "title": "Foundation Setup",
      "price": 1199,
      "features": [
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
        "ATO Registration & Tax Setup"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Bookkeeping & Trust Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Trust Tax Return Preparation",
        "Trust Distribution Calculations"
      ],
      "extraCount": 10
    }
  },
  {
    "key": "gst",
    "category": "business_formation",
    "label": "GST Registration",
    "foundation": {
      "title": "Foundation Setup",
      "price": 129,
      "features": [
        "GST Registration with ATO",
        "ABN Validation & Update",
        "GST Reporting Method Setup (Monthly/Quarterly)",
        "BAS Agent Registration",
        "GST Accounting System Setup",
        "Input Tax Credit Advice",
        "GST Compliance Calendar",
        "Record Keeping Requirements Guide",
        "First BAS Lodgement Assistance"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Bookkeeping & Bank Reconciliation",
        "Quarterly or Monthly BAS Preparation",
        "BAS Lodgement with ATO",
        "GST Reconciliation & Reporting"
      ],
      "extraCount": 8
    }
  },
  {
    "key": "charity",
    "category": "business_formation",
    "label": "Charity Setup",
    "foundation": {
      "title": "Foundation Setup",
      "price": 899,
      "features": [
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
        "Compliance Framework Setup"
      ]
    },
    "accounting": {
      "includes": [
        "Charity Bookkeeping & Fund Accounting",
        "Annual Financial Statement Preparation (ACNC)",
        "ACNC Annual Information Statement",
        "Donor Receipt & Tax Deduction Management"
      ],
      "extraCount": 10
    }
  },
  {
    "key": "charity_ia",
    "category": "business_formation",
    "label": "Incorporated Association",
    "foundation": {
      "title": "Incorporated Association Setup",
      "price": 1899,
      "features": [
        "ACNC Charity Registration",
        "DGR Status Application (if eligible)",
        "Charity Constitution & Governing Documents",
        "ABN & TFN Registration for Charity",
        "Responsible Persons Registration",
        "Public Charity Register Listing",
        "Tax Concession Applications",
        "GST Concession Registration",
        "FBT & Payroll Tax Exemptions",
        "Fundraising Permit Guidance",
        "Compliance Framework Setup",
        "State Association Incorporation"
      ]
    },
    "accounting": {
      "includes": [
        "Charity Bookkeeping & Fund Accounting",
        "Annual Financial Statement Preparation (ACNC)",
        "ACNC Annual Information Statement",
        "Donor Receipt & Tax Deduction Management"
      ],
      "extraCount": 10
    }
  },
  {
    "key": "charity_clg",
    "category": "business_formation",
    "label": "Company Limited by Guarantee",
    "foundation": {
      "title": "Company Limited by Guarantee Setup",
      "price": 2199,
      "features": [
        "ACNC Charity Registration",
        "ASIC Company (CLG) Registration",
        "DGR Status Application (if eligible)",
        "Charity Constitution & Governing Documents",
        "ABN & TFN Registration for Charity",
        "Director & Member Registration",
        "Public Charity Register Listing",
        "Tax Concession Applications",
        "GST Concession Registration",
        "FBT & Payroll Tax Exemptions",
        "Compliance Framework Setup"
      ]
    },
    "accounting": {
      "includes": [
        "Charity Bookkeeping & Fund Accounting",
        "Annual Financial Statement Preparation (ACNC)",
        "ACNC Annual Information Statement",
        "Donor Receipt & Tax Deduction Management"
      ],
      "extraCount": 10
    }
  },
  {
    "key": "company",
    "category": "business_formation",
    "label": "Company Registration",
    "foundation": {
      "title": "Foundation Setup",
      "price": 399,
      "features": [
        "ASIC Company Registration",
        "ACN & TFN Application",
        "ABN Registration",
        "GST Registration (if required)",
        "Company Constitution",
        "Share Certificates",
        "ASIC Annual Review Setup",
        "Company Compliance Guide",
        "Free Name Availability Check"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Bookkeeping & Bank Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Financial Statements",
        "Annual Tax Return Lodgement"
      ],
      "extraCount": 8
    }
  },
  {
    "key": "smsf",
    "category": "business_formation",
    "label": "SMSF Setup",
    "foundation": {
      "title": "Foundation Setup",
      "price": 799,
      "features": [
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
        "SMSF Accounting System Setup"
      ]
    },
    "accounting": {
      "includes": [
        "SMSF Bookkeeping & Transaction Recording",
        "Annual SMSF Tax Return Lodgement",
        "Annual SMSF Financial Statements",
        "Independent SMSF Audit Coordination"
      ],
      "extraCount": 10
    }
  },
  {
    "key": "partnership",
    "category": "business_formation",
    "label": "Partnership",
    "foundation": {
      "title": "Foundation Setup",
      "price": 299,
      "features": [
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
        "Compliance Calendar Setup"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Partnership Bookkeeping",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Partnership Tax Return",
        "Partner Distribution Statements"
      ],
      "extraCount": 10
    }
  },
  {
    "key": "unit_trust",
    "category": "business_formation",
    "label": "Unit Trust",
    "foundation": {
      "title": "Foundation Setup",
      "price": 1199,
      "features": [
        "Professional Unit Trust Deed Preparation",
        "Trustee Structure Setup (Individual or Corporate)",
        "ABN & TFN Registration for Trust",
        "Unit Certificates & Register",
        "Unitholder Agreement Documentation",
        "Trust Bank Account Setup Guidance",
        "Stamp Duty Advice (State-specific)",
        "Trust Resolutions & Minutes Templates",
        "ATO Registration & Tax Setup",
        "Compliance Calendar Setup"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Bookkeeping & Trust Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Trust Tax Return Preparation",
        "Unit Distribution Calculations"
      ],
      "extraCount": 10
    }
  },
  {
    "key": "bare_trust",
    "category": "business_formation",
    "label": "Bare Trust",
    "foundation": {
      "title": "Foundation Setup",
      "price": 2000,
      "features": [
        "Bare Trust Deed Preparation",
        "LRBA Documentation & Compliance",
        "Trustee Appointment & Resolutions",
        "ABN Registration (if required)",
        "Property Holding Structure Setup",
        "Loan Agreement Review & Documentation",
        "ATO Compliance Guide",
        "Settlement Coordination Support",
        "Trust Resolutions & Minutes",
        "Ongoing Compliance Checklist"
      ]
    },
    "accounting": {
      "includes": [
        "Bare Trust Bookkeeping & Reconciliation",
        "Annual Bare Trust Tax Return",
        "LRBA Compliance Monitoring",
        "Property Income & Expense Tracking"
      ],
      "extraCount": 8
    }
  },

  {
    "key": "individual_tax_return",
    "category": "accounting_tax",
    "label": "Individual Tax Return",
    "foundation": {
      "title": "Individual Tax Return",
      "price": 99,
      "features": [
        "Individual Tax Return Preparation & Lodgement",
        "Income & Deduction Assessment",
        "Medicare Levy Calculation",
        "Private Health Insurance Rebate",
        "Work-Related Expense Optimisation",
        "Rental Property Schedule",
        "Capital Gains Tax Calculation",
        "ATO Pre-fill Data Review",
        "Tax Offset Eligibility Check"
      ]
    },
    "accounting": {
      "includes": [
        "Ongoing Tax Advisory Support",
        "Prior Year Amendment Reviews",
        "ATO Correspondence Management",
        "Tax Planning Consultation"
      ],
      "extraCount": 4
    }
  },
  {
    "key": "sole_trader_tax_return",
    "category": "accounting_tax",
    "label": "Sole Trader Tax Return",
    "foundation": {
      "title": "Sole Trader Tax Return",
      "price": 160,
      "features": [
        "Sole Trader Tax Return Preparation",
        "Business Income & Expense Analysis",
        "Motor Vehicle Claims Calculation",
        "Home Office Expense Calculation",
        "Depreciation Schedule Preparation",
        "BAS Reconciliation & Review",
        "GST Reporting & Compliance",
        "ATO Pre-fill Data Review",
        "Business Loss Provisions Review"
      ]
    },
    "accounting": {
      "includes": [
        "Monthly Bookkeeping & Reconciliation",
        "Quarterly BAS Preparation & Lodgement",
        "Annual Tax Return Lodgement",
        "Tax Planning Consultation"
      ],
      "extraCount": 6
    }
  },
  {
    "key": "bundle_tax_return",
    "category": "accounting_tax",
    "label": "Bundle Tax Return",
    "foundation": {
      "title": "Bundle Tax Return Package",
      "price": 199,
      "features": [
        "Individual + Business Tax Return Package",
        "Combined Income Assessment",
        "Cross-Entity Tax Optimisation",
        "Trust Distribution Integration",
        "Company Dividend Integration",
        "Capital Gains Consolidation",
        "Multi-Entity BAS Review",
        "ATO Compliance Review",
        "Comprehensive Tax Planning"
      ]
    },
    "accounting": {
      "includes": [
        "Multi-Entity Bookkeeping",
        "Consolidated BAS Preparation",
        "All Entity Tax Returns",
        "Strategic Tax Advisory"
      ],
      "extraCount": 6
    }
  },
  {
    "key": "tfn",
    "category": "accounting_tax",
    "label": "TFN Registration",
    "foundation": {
      "title": "TFN Registration",
      "price": 120,
      "features": [
        "Tax File Number Application",
        "ATO Registration & Submission",
        "Identity Verification Assistance",
        "TFN Notification to Employers",
        "TFN Declaration Preparation",
        "ABN Linking (if applicable)"
      ]
    },
    "accounting": {
      "includes": [
        "Ongoing Tax Advisory Support",
        "ATO Correspondence Management",
        "Tax Return Preparation",
        "Compliance Monitoring"
      ],
      "extraCount": 4
    }
  },
  {
    "key": "rental_properties",
    "category": "accounting_tax",
    "label": "Rental Properties",
    "foundation": {
      "title": "Rental Properties",
      "price": 50,
      "features": [
        "Investment Property Tax Schedule",
        "Rental Income & Expense Tracking",
        "Depreciation Schedule Preparation",
        "Capital Gains Tax Calculation",
        "Negative Gearing Assessment",
        "Property Settlement Support"
      ]
    },
    "accounting": {
      "includes": [
        "Ongoing Rental Property Advisory",
        "Annual Rental Schedule Preparation",
        "Property Portfolio Review",
        "Capital Gains Planning"
      ],
      "extraCount": 4
    }
  },
  {
    "key": "asic_agent",
    "category": "accounting_tax",
    "label": "ASIC Annual Review Agent",
    "foundation": {
      "title": "ASIC Annual Review",
      "price": 180,
      "features": [
        "ASIC Annual Review Lodgement",
        "Company Details Verification",
        "Registered Office & Address Updates",
        "Director & Secretary Updates",
        "Share Structure Review",
        "Solvency Resolution Preparation",
        "ASIC Fee Payment Management",
        "Compliance Deadline Monitoring",
        "Change of Details Processing"
      ]
    },
    "accounting": {
      "includes": [
        "Ongoing ASIC Compliance Monitoring",
        "Annual Review Reminders",
        "Change Notifications",
        "ASIC Correspondence Management"
      ],
      "extraCount": 4
    }
  },
  {
    "_id": "699fe06ebc4f7dbc12b95cd4",
    "key": "company_accounting",
    "category": "accounting_tax",
    "label": "Company Accounting",
    "foundation": {
      "title": "Company Accounting Package",
      "price": 100,
      "features": [
        "Monthly Financial Reporting",
        "Bank & Credit Card Reconciliation",
        "Accounts Payable Management",
        "Accounts Receivable Management",
        "Payroll Processing",
        "BAS Preparation & Lodgement",
        "Annual Financial Statements",
        "Company Tax Return Lodgement",
        "ASIC Annual Review"
      ]
    },
    "accounting": {
      "includes": [
        "Dedicated Accountant",
        "Cloud Accounting Software Setup",
        "Monthly Management Reports",
        "Quarterly Review Meetings"
      ],
      "extraCount": 8
    },
    "meta": {
      "plans": {
        "essential": {
          "title": "Essential",
          "subtitle": "Compliance-focused accounting",
          "premiumMultiplier": 1,
          "features": [
            "Monthly Bookkeeping",
            "Quarterly BAS Lodgement",
            "Annual Tax Return"
          ]
        },
        "premium": {
          "title": "Premium",
          "subtitle": "Strategic tax planning included",
          "premiumMultiplier": 1.536,
          "badge": "⭐ MOST POPULAR",
          "features": [
            "Everything in Essential",
            "Tax Planning Session (Included)",
            "ASIC Compliance",
            "Priority Phone Support",
            "Payroll Processing Available"
          ]
        }
      },
      "billing": {
        "cycles": ["monthly", "annual"],
        "annualDiscountPercent": 20
      },
      "revenueRanges": [
        { "id": "up-to-75k", "label": "Up to $75K", "multiplier": 1.00 },
        { "id": "75k-200k", "label": "$75K - $200K", "multiplier": 1.34 },
        { "id": "200k-500k", "label": "$200K - $500K", "multiplier": 1.79 },
        { "id": "500k-1m", "label": "$500K - $1M", "multiplier": 2.60 },
        { "id": "1m-2m", "label": "$1M - $2M", "multiplier": 3.72 },
        { "id": "2m-5m", "label": "$2M - $5M+", "multiplier": 5.21 }
      ],
      "revenueLabel": "Annual Company Revenue",
      "addons": {
        "payroll": {
          "label": "Payroll Services",
          "description": "Full payroll processing including super, PAYG, and STP reporting",
          "pricePerEmployee": 120,
          "unit": "employee/year"
        }
      },
      "serviceStartDates": [
        { "id": "jul", "label": "1 Jul 2025", "months": 12 },
        { "id": "oct", "label": "1 Oct 2025", "months": 9, "recommended": true },
        { "id": "jan", "label": "1 Jan 2026", "months": 6 },
        { "id": "apr", "label": "1 Apr 2026", "months": 3 }
      ],
      "checkoutRoute": "/company-accounting",
      "pricingRoute": "/pricing?service=company_accounting"
    }
  },
  {
    "_id": "699fe06ebc4f7dbc12b95cd5",
    "key": "trust_accounting",
    "category": "accounting_tax",
    "label": "Trust Accounting",
    "foundation": {
      "title": "Trust Accounting Package",
      "price": 77,
      "features": [
        "Trust Transaction Recording",
        "Trust Distribution Calculations",
        "Beneficiary Statements",
        "Trust Tax Return Preparation",
        "BAS Preparation & Lodgement",
        "Trust Investment Reporting",
        "Trustee Resolution Documentation",
        "ATO Compliance Management",
        "Year-End Financial Statements"
      ]
    },
    "accounting": {
      "includes": [
        "Dedicated Trust Accountant",
        "Cloud Accounting Setup",
        "Quarterly Trust Reviews",
        "Annual Distribution Planning"
      ],
      "extraCount": 8
    },
    "meta": {
      "plans": {
        "essential": {
          "title": "Essential",
          "subtitle": "Compliance-focused trust accounting",
          "premiumMultiplier": 1,
          "features": [
            "Trust Tax Return Preparation",
            "Distribution Minutes",
            "Beneficiary Statements",
            "Quarterly BAS Lodgement"
          ]
        },
        "premium": {
          "title": "Premium",
          "subtitle": "Strategic distribution planning included",
          "premiumMultiplier": 1.536,
          "badge": "⭐ MOST POPULAR",
          "features": [
            "Everything in Essential",
            "Strategic Distribution Planning",
            "ASIC Compliance",
            "Tax Planning Sessions",
            "Priority Phone Support"
          ]
        }
      },
      "billing": {
        "cycles": ["monthly", "annual"],
        "annualDiscountPercent": 20
      },
      "trustTypes": [
        { "id": "family_trust", "label": "Family Trust (Discretionary)" },
        { "id": "unit_trust", "label": "Unit Trust" }
      ],
      "trustTypeConfig": {
        "family_trust": {
          "heading": "Family Trust Accounting & Tax",
          "subheading": "Professional family trust accounting with distribution minutes, beneficiary statements, and strategic tax planning.",
          "essentialFeatures": [
            "Trust Tax Return Preparation",
            "Distribution Minutes",
            "Beneficiary Statements",
            "Quarterly BAS Lodgement"
          ],
          "premiumFeatures": [
            "Trust Tax Return Preparation",
            "Distribution Minutes",
            "Beneficiary Statements",
            "Quarterly BAS Lodgement",
            "Strategic Distribution Planning",
            "Tax Planning Sessions",
            "Priority Support"
          ]
        },
        "unit_trust": {
          "heading": "Unit Trust Accounting & Tax",
          "subheading": "Specialist unit trust accounting with unitholder statements, distribution calculations, and compliance reporting.",
          "essentialFeatures": [
            "Trust Tax Return Preparation",
            "Unitholder Statements",
            "Distribution Calculations",
            "Quarterly BAS Lodgement"
          ],
          "premiumFeatures": [
            "Trust Tax Return Preparation",
            "Unitholder Statements",
            "Distribution Calculations",
            "Quarterly BAS Lodgement",
            "Capital Account Tracking",
            "Tax Planning Sessions",
            "Priority Support"
          ]
        }
      },
      "revenueRanges": [
        { "id": "up-to-75k", "label": "Up to $75K", "multiplier": 1.00 },
        { "id": "75k-200k", "label": "$75K - $200K", "multiplier": 1.34 },
        { "id": "200k-500k", "label": "$200K - $500K", "multiplier": 1.79 },
        { "id": "500k-1m", "label": "$500K - $1M", "multiplier": 2.60 },
        { "id": "1m-2m", "label": "$1M - $2M", "multiplier": 3.72 },
        { "id": "2m-5m", "label": "$2M - $5M+", "multiplier": 5.21 }
      ],
      "revenueLabel": "Annual Trust Revenue",
      "addons": {
        "payroll": {
          "label": "Payroll Services",
          "description": "Full payroll processing including super, PAYG, and STP reporting",
          "pricePerEmployee": 120,
          "unit": "employee/year"
        }
      },
      "serviceStartDates": [
        { "id": "jul", "label": "1 Jul 2025", "months": 12 },
        { "id": "oct", "label": "1 Oct 2025", "months": 9, "recommended": true },
        { "id": "jan", "label": "1 Jan 2026", "months": 6 },
        { "id": "apr", "label": "1 Apr 2026", "months": 3 }
      ],
      "checkoutRoute": "/trust-accounting",
      "pricingRoute": "/pricing?service=trust_accounting"
    }
  },
  {
    "_id": "699fe06ebc4f7dbc12b95cd6",
    "key": "nfp_accounting",
    "category": "accounting_tax",
    "label": "NFP Accounting",
    "foundation": {
      "title": "NFP Accounting Package",
      "price": 99,
      "features": [
        "NFP Financial Reporting",
        "Fund & Grant Tracking",
        "Donor Management & Receipting",
        "ACNC Annual Information Statement",
        "BAS Preparation & Lodgement",
        "Payroll Processing",
        "FBT Compliance",
        "Budget vs Actual Reporting",
        "Financial Audit Preparation"
      ]
    },
    "accounting": {
      "includes": [
        "Dedicated NFP Accountant",
        "Cloud Accounting Setup",
        "Monthly Financial Reports",
        "Grant Acquittal Support"
      ],
      "extraCount": 8
    },
    "meta": {
      "plans": {
        "essential": {
          "title": "Essential",
          "subtitle": "Compliance-focused NFP accounting",
          "premiumMultiplier": 1,
          "features": [
            "Monthly Bookkeeping",
            "Quarterly BAS Lodgement",
            "Annual Financial Statements",
            "ACNC Annual Information Statement",
            "Grant Acquittal Reporting"
          ]
        },
        "premium": {
          "title": "Premium",
          "subtitle": "Audit coordination & board reporting",
          "premiumMultiplier": 1.6,
          "badge": "⭐ RECOMMENDED",
          "features": [
            "Monthly Bookkeeping",
            "Quarterly BAS Lodgement",
            "Annual Financial Statements",
            "ACNC Annual Information Statement",
            "Grant Acquittal Reporting",
            "Audit Coordination",
            "Board Financial Reporting",
            "Payroll Processing Available"
          ]
        }
      },
      "billing": {
        "cycles": ["monthly", "annual"],
        "annualDiscountPercent": 20
      },
      "revenueRanges": [
        { "id": "under-100k", "label": "Under $100K", "multiplier": 1.00 },
        { "id": "100k-250k", "label": "$100K - $250K", "multiplier": 1.50 },
        { "id": "250k-1m", "label": "$250K - $1M", "multiplier": 2.00 },
        { "id": "1m-plus", "label": "Over $1M", "multiplier": 3.00 }
      ],
      "revenueLabel": "Annual Organisation Revenue",
      "nfpPackages": {
        "starter": {
          "name": "Community Starter",
          "revenueLabel": "Under $100K",
          "description": "For small community organizations",
          "prices": { "under-100k": 1200, "100k-250k": 1800, "250k-1m": 2400, "1m-plus": 3600 }
        },
        "standard": {
          "name": "Association Standard",
          "revenueLabel": "$100K - $500K",
          "description": "Complete compliance for growing associations",
          "recommended": true,
          "prices": { "under-100k": 2400, "100k-250k": 3200, "250k-1m": 4200, "1m-plus": 5800 }
        },
        "advanced": {
          "name": "Enterprise Advanced",
          "revenueLabel": "Over $500K",
          "description": "Full-service accounting for large NFPs",
          "prices": { "under-100k": 4500, "100k-250k": 5500, "250k-1m": 7000, "1m-plus": 9500 }
        }
      },
      "addons": {
        "payroll": {
          "label": "Payroll Services",
          "description": "Full payroll processing including super, PAYG, and STP reporting",
          "pricePerEmployee": 96,
          "unit": "employee/year"
        },
        "grant_funding": {
          "label": "Grant Funding Reporting",
          "description": "Detailed grant acquittal and reporting",
          "pricePerYear": 500
        },
        "audit": {
          "options": [
            { "id": "none", "label": "No Audit Required", "price": 0 },
            { "id": "financial_review", "label": "Financial Review", "price": 1500 },
            { "id": "statutory_audit", "label": "Statutory Audit", "price": 3500 }
          ]
        },
        "additional_services": [
          { "id": "grant_acquittal", "label": "Grant Acquittal", "price": 500 },
          { "id": "board_governance", "label": "Board Governance Support", "price": 1200 },
          { "id": "financial_controller", "label": "Virtual Financial Controller", "price": 2400 },
          { "id": "policy_docs", "label": "Policy Documentation", "price": 800 },
          { "id": "internal_controls", "label": "Internal Controls Review", "price": 1000 },
          { "id": "tax_return", "label": "Tax Return Preparation", "price": 400 },
          { "id": "fbt_return", "label": "FBT Return", "price": 600 },
          { "id": "grant_management", "label": "Grant Management", "price": 500 }
        ],
        "catch_up": {
          "label": "Catch-Up Pack",
          "description": "Historical records clean-up",
          "price": 600
        }
      },
      "serviceStartDates": [
        { "id": "jul", "label": "1 Jul 2025", "months": 12 },
        { "id": "oct", "label": "1 Oct 2025", "months": 9 },
        { "id": "jan", "label": "1 Jan 2026", "months": 6 },
        { "id": "apr", "label": "1 Apr 2026", "months": 3 }
      ],
      "checkoutRoute": "/nfp-accounting",
      "pricingRoute": "/pricing?service=nfp_accounting"
    }
  },
  {
    "key": "smsf_accounting",
    "category": "accounting_tax",
    "label": "SMSF Accounting",
    "foundation": {
      "title": "SMSF Accounting Package",
      "price": 99,
      "features": [
        "Annual Financial Statements",
        "SMSF Tax Return Lodgement",
        "Member Statements",
        "Audit Liaison & Lodgement",
        "Rollover Processing",
        "Pension Calculations",
        "Investment Reporting",
        "ATO Compliance Management",
        "Year-End Financial Statements"
      ]
    },
    "accounting": {
      "includes": [
        "Dedicated SMSF Accountant",
        "Cloud Accounting Setup",
        "Quarterly SMSF Reviews",
        "Annual Audit Coordination"
      ],
      "extraCount": 8
    },
    "meta": {
      "plans": {
        "essential": {
          "title": "Essential",
          "subtitle": "Compliance-focused SMSF accounting",
          "premiumMultiplier": 1,
          "features": [
            "Annual SMSF Tax Return",
            "Financial Statements",
            "Member Statements",
            "Audit Coordination"
          ]
        },
        "premium": {
          "title": "Premium",
          "subtitle": "Investment strategy review included",
          "premiumMultiplier": 1.536,
          "badge": "⭐ MOST POPULAR",
          "features": [
            "Everything in Essential",
            "Investment Strategy Review",
            "Pension Planning Support",
            "Rollover Processing",
            "Priority Phone Support"
          ]
        }
      },
      "billing": {
        "cycles": ["monthly", "annual"],
        "annualDiscountPercent": 20
      },
      "fundSizeRanges": [
        { "id": "under-200k", "label": "Under $200K", "multiplier": 1.00 },
        { "id": "200k-500k", "label": "$200K - $500K", "multiplier": 1.40 },
        { "id": "500k-1m", "label": "$500K - $1M", "multiplier": 1.90 },
        { "id": "1m-2m", "label": "$1M - $2M", "multiplier": 2.80 },
        { "id": "2m-5m", "label": "$2M - $5M+", "multiplier": 4.20 }
      ],
      "fundSizeLabel": "Total Fund Size",
      "addons": {
        "audit_coordination": {
          "label": "Independent Audit Coordination",
          "description": "We coordinate with an independent SMSF auditor on your behalf",
          "pricePerYear": 500
        },
        "catch_up": {
          "label": "Catch-Up Pack",
          "description": "Historical records & prior year statements clean-up",
          "price": 800
        }
      },
      "serviceStartDates": [
        { "id": "jul", "label": "1 Jul 2025", "months": 12 },
        { "id": "oct", "label": "1 Oct 2025", "months": 9, "recommended": true },
        { "id": "jan", "label": "1 Jan 2026", "months": 6 },
        { "id": "apr", "label": "1 Apr 2026", "months": 3 }
      ],
      "checkoutRoute": "/smsf-accounting",
      "pricingRoute": "/pricing?service=smsf_accounting"
    }
  },
  {
    "key": "partnership_tax",
    "category": "accounting_tax",
    "label": "Partnership Tax",
    "foundation": {
      "title": "Partnership Tax Package",
      "price": 85,
      "features": [
        "Partnership Tax Returns",
        "Profit Distribution",
        "Partner Capital Tracking",
        "Partnership BAS",
        "Partner Statements",
        "Capital Account Management",
        "Tax Planning Support",
        "ATO Compliance Management",
        "Year-End Financial Statements"
      ]
    },
    "accounting": {
      "includes": [
        "Dedicated Partnership Accountant",
        "Cloud Accounting Setup",
        "Quarterly Reviews",
        "Annual Tax Planning"
      ],
      "extraCount": 8
    },
    "meta": {
      "plans": {
        "essential": {
          "title": "Essential",
          "subtitle": "Compliance-focused partnership accounting",
          "premiumMultiplier": 1,
          "features": [
            "Partnership Tax Return",
            "Partner Distribution Statements",
            "BAS Preparation & Lodgement",
            "Quarterly Compliance Reports"
          ]
        },
        "premium": {
          "title": "Premium",
          "subtitle": "Strategic partner tax planning included",
          "premiumMultiplier": 1.536,
          "badge": "⭐ MOST POPULAR",
          "features": [
            "Everything in Essential",
            "Strategic Partner Tax Planning",
            "Capital Account Management",
            "Priority Phone Support",
            "Payroll Processing Available"
          ]
        }
      },
      "billing": {
        "cycles": ["monthly", "annual"],
        "annualDiscountPercent": 20
      },
      "revenueRanges": [
        { "id": "up-to-75k", "label": "Up to $75K", "multiplier": 1.00 },
        { "id": "75k-200k", "label": "$75K - $200K", "multiplier": 1.34 },
        { "id": "200k-500k", "label": "$200K - $500K", "multiplier": 1.79 },
        { "id": "500k-1m", "label": "$500K - $1M", "multiplier": 2.60 },
        { "id": "1m-2m", "label": "$1M - $2M", "multiplier": 3.72 },
        { "id": "2m-5m", "label": "$2M - $5M+", "multiplier": 5.21 }
      ],
      "revenueLabel": "Annual Partnership Revenue",
      "addons": {
        "payroll": {
          "label": "Payroll Services",
          "description": "Full payroll processing including super, PAYG, and STP reporting",
          "pricePerEmployee": 120,
          "unit": "employee/year"
        },
        "catch_up": {
          "label": "Catch-Up Pack",
          "description": "Historical records clean-up",
          "price": 600
        }
      },
      "serviceStartDates": [
        { "id": "jul", "label": "1 Jul 2025", "months": 12 },
        { "id": "oct", "label": "1 Oct 2025", "months": 9, "recommended": true },
        { "id": "jan", "label": "1 Jan 2026", "months": 6 },
        { "id": "apr", "label": "1 Apr 2026", "months": 3 }
      ],
      "checkoutRoute": "/partnership-tax",
      "pricingRoute": "/pricing?service=partnership_tax"
    }
  },

  {
    "key": "business_plan",
    "category": "business_advisory",
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
    "category": "business_advisory",
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
    "category": "business_advisory",
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
  },
  {
    "key": "business_wealth_structuring",
    "category": "business_advisory",
    "label": "Business & Wealth Structuring",
    "foundation": { "title": "Business & Wealth Structuring", "price": 500, "features": [] },
    "accounting": { "includes": [], "extraCount": 0 },
    "meta": {
      "plans": [
        {
          "id": "essential",
          "label": "Essential Strategy Session",
          "subtitle": "60-minute expert consultation",
          "badge": null,
          "price": 500,
          "delivery": "Within 5 business days",
          "recommended": false,
          "features": [
            "60-minute expert strategy session",
            "Current structure analysis",
            "Tax efficiency recommendations",
            "Asset protection overview",
            "Written summary & next steps"
          ]
        },
        {
          "id": "comprehensive",
          "label": "Comprehensive Structuring Plan",
          "subtitle": "Full structure review & implementation roadmap",
          "badge": "RECOMMENDED",
          "price": 2500,
          "delivery": "10-15 business days",
          "recommended": true,
          "features": [
            "Complete business structure audit",
            "Multi-entity tax optimisation plan",
            "Asset protection strategy",
            "Succession & estate planning overview",
            "Detailed implementation roadmap",
            "2× follow-up advisory sessions",
            "Priority ongoing support (90 days)"
          ]
        }
      ]
    }
  }
]


async function seedPricing() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🗑️  Clearing old pricing...");
    await PricingService.deleteMany({});
    console.log("🌱 Seeding pricing...");
    await PricingService.insertMany(pricingData);
    console.log(`✅ Pricing seeded successfully! (${pricingData.length} services)`);
    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedPricing();
