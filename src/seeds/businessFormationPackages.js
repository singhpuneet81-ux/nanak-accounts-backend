/**
 * Business Formation Pricing Seeder
 * 
 * Seeds packagePlans (revenue brackets + tiered plan pricing)
 * into the general pricing collection for all Business Formation services.
 * 
 * Usage: POST /api/admin/pricing/seed-packages
 */

const PricingService = require("../models/PricingService"); // adjust path to your general pricing model

/* ===============================
   SHARED REVENUE BRACKETS
================================ */

const standardBrackets = [
  { id: "up-to-100k", label: "Up to $100K" },
  { id: "100k-300k", label: "$100K–$300K" },
  { id: "300k-500k", label: "$300K–$500K" },
  { id: "500k-1m", label: "$500K–$1M" },
  { id: "1m-2m", label: "$1M–$2M" },
  { id: "2m-5m", label: "$2M–$5M" }
];

/* ===============================
   HELPER — build tierPricing
================================ */

function buildTierPricing(prices) {
  // prices = [[standard, bundle], ...] mapped to standardBrackets
  const result = {};
  standardBrackets.forEach((b, i) => {
    result[b.id] = { standard: prices[i][0], bundle: prices[i][1] };
  });
  return result;
}

/* ===============================
   SERVICE PACKAGE PLANS
================================ */

const SERVICE_PACKAGES = {

  // ── Company Registration ──
  company: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "For early-stage businesses",
        features: [
          "Annual company tax return",
          "Quarterly BAS/IAS lodgement",
          "Standard bookkeeping",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [1200, 960], [1400, 1120], [1710, 1300],
          [1900, 1500], [2200, 1750], [2700, 2150]
        ])
      },
      {
        id: "founder-pro",
        name: "Founder Pro",
        badge: "MOST POPULAR",
        tagline: "For growing founders",
        features: [
          "Monthly bookkeeping",
          "Dedicated accountant",
          "Priority phone support",
          "Annual tax planning session"
        ],
        tierPricing: buildTierPricing([
          [1600, 1200], [1950, 1400], [2250, 1700],
          [2540, 1900], [3100, 2400], [3540, 3000]
        ])
      }
    ]
  },

  // ── ABN Registration ──
  abn: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Quick ABN setup & compliance",
        features: [
          "ABN registration",
          "TFN application",
          "GST registration assessment",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [800, 640], [950, 760], [1100, 880],
          [1300, 1040], [1500, 1200], [1800, 1440]
        ])
      },
      {
        id: "growth",
        name: "Growth",
        badge: "MOST POPULAR",
        tagline: "ABN + ongoing tax support",
        features: [
          "Everything in Essential",
          "Quarterly BAS lodgement",
          "Annual tax return",
          "Phone support"
        ],
        tierPricing: buildTierPricing([
          [1100, 880], [1300, 1040], [1500, 1200],
          [1750, 1400], [2000, 1600], [2400, 1920]
        ])
      }
    ]
  },

  // ── Business Name Registration ──
  business_name: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Simple business name setup",
        features: [
          "ASIC business name registration",
          "Name availability check",
          "Registration certificate",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [800, 640], [950, 760], [1100, 880],
          [1300, 1040], [1500, 1200], [1800, 1440]
        ])
      },
      {
        id: "growth",
        name: "Growth",
        badge: "RECOMMENDED",
        tagline: "Registration + ongoing compliance",
        features: [
          "Everything in Essential",
          "Annual renewal management",
          "Business structure advice",
          "Priority support"
        ],
        tierPricing: buildTierPricing([
          [1100, 880], [1300, 1040], [1500, 1200],
          [1750, 1400], [2000, 1600], [2400, 1920]
        ])
      }
    ]
  },

  // ── Family Trust ──
  family_trust: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Trust compliance essentials",
        features: [
          "Annual trust tax return",
          "Distribution minutes",
          "Beneficiary statements",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [1400, 1120], [1650, 1320], [1900, 1520],
          [2200, 1760], [2600, 2080], [3100, 2480]
        ])
      },
      {
        id: "premium",
        name: "Premium",
        badge: "MOST POPULAR",
        tagline: "Full trust management",
        features: [
          "Everything in Essential",
          "Monthly bookkeeping",
          "Quarterly BAS lodgement",
          "Dedicated accountant",
          "Tax planning review"
        ],
        tierPricing: buildTierPricing([
          [1900, 1520], [2200, 1760], [2600, 2080],
          [3000, 2400], [3500, 2800], [4200, 3360]
        ])
      }
    ]
  },

  // ── GST Registration ──
  gst: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "GST registration & BAS basics",
        features: [
          "GST registration with ATO",
          "BAS setup & first lodgement",
          "GST compliance guide",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [700, 560], [850, 680], [1000, 800],
          [1200, 960], [1400, 1120], [1700, 1360]
        ])
      },
      {
        id: "growth",
        name: "Growth",
        badge: "RECOMMENDED",
        tagline: "Ongoing BAS & GST management",
        features: [
          "Everything in Essential",
          "Quarterly BAS preparation & lodgement",
          "GST reconciliation",
          "Priority support"
        ],
        tierPricing: buildTierPricing([
          [1000, 800], [1200, 960], [1400, 1120],
          [1650, 1320], [1900, 1520], [2300, 1840]
        ])
      }
    ]
  },

  // ── Charity Registration ──
  charity: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "NFP registration & compliance",
        features: [
          "ACNC charity registration",
          "DGR application",
          "Tax concession applications",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [1500, 1200], [1750, 1400], [2000, 1600],
          [2300, 1840], [2700, 2160], [3200, 2560]
        ])
      },
      {
        id: "premium",
        name: "Premium",
        badge: "MOST POPULAR",
        tagline: "Full NFP accounting & compliance",
        features: [
          "Everything in Essential",
          "Annual financial statements",
          "ACNC annual reporting",
          "Dedicated accountant",
          "Priority support"
        ],
        tierPricing: buildTierPricing([
          [2000, 1600], [2400, 1920], [2800, 2240],
          [3200, 2560], [3700, 2960], [4400, 3520]
        ])
      }
    ]
  },

  // ── SMSF Setup ──
  smsf: {
    revenueBrackets: [
      { id: "under-200k", label: "Under $200K" },
      { id: "200k-500k", label: "$200K–$500K" },
      { id: "500k-1m", label: "$500K–$1M" },
      { id: "1m-2m", label: "$1M–$2M" },
      { id: "2m-plus", label: "$2M+" }
    ],
    plans: [
      {
        id: "standard",
        name: "Standard SMSF",
        badge: "",
        tagline: "Core SMSF compliance",
        features: [
          "SMSF establishment",
          "Trust deed preparation",
          "ATO registration",
          "Corporate trustee setup",
          "Investment strategy document"
        ],
        tierPricing: {
          "under-200k": { standard: 1999, bundle: 1599 },
          "200k-500k": { standard: 2399, bundle: 1919 },
          "500k-1m": { standard: 2799, bundle: 2239 },
          "1m-2m": { standard: 3499, bundle: 2799 },
          "2m-plus": { standard: 4499, bundle: 3599 }
        }
      },
      {
        id: "premium",
        name: "Premium SMSF",
        badge: "MOST POPULAR",
        tagline: "Full SMSF management",
        features: [
          "Everything in Standard",
          "Investment strategy review",
          "Pension planning support",
          "Rollover processing",
          "Priority support",
          "Dedicated SMSF accountant"
        ],
        tierPricing: {
          "under-200k": { standard: 2999, bundle: 2399 },
          "200k-500k": { standard: 3599, bundle: 2879 },
          "500k-1m": { standard: 4199, bundle: 3359 },
          "1m-2m": { standard: 5249, bundle: 4199 },
          "2m-plus": { standard: 6749, bundle: 5399 }
        }
      }
    ]
  },

  // ── Partnership ──
  partnership: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Partnership compliance basics",
        features: [
          "Partnership TFN & ABN registration",
          "Partnership agreement review",
          "Annual partnership tax return",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [1300, 1040], [1550, 1240], [1800, 1440],
          [2100, 1680], [2500, 2000], [3000, 2400]
        ])
      },
      {
        id: "premium",
        name: "Premium",
        badge: "RECOMMENDED",
        tagline: "Full partnership management",
        features: [
          "Everything in Essential",
          "Monthly bookkeeping",
          "Quarterly BAS lodgement",
          "Partner distribution statements",
          "Dedicated accountant"
        ],
        tierPricing: buildTierPricing([
          [1800, 1440], [2100, 1680], [2500, 2000],
          [2900, 2320], [3400, 2720], [4000, 3200]
        ])
      }
    ]
  },

  // ── Unit Trust ──
  unit_trust: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Unit trust compliance essentials",
        features: [
          "Unit trust registration",
          "Trust deed preparation",
          "Annual trust tax return",
          "Unit holder statements"
        ],
        tierPricing: buildTierPricing([
          [1400, 1120], [1650, 1320], [1900, 1520],
          [2200, 1760], [2600, 2080], [3100, 2480]
        ])
      },
      {
        id: "premium",
        name: "Premium",
        badge: "MOST POPULAR",
        tagline: "Full unit trust management",
        features: [
          "Everything in Essential",
          "Monthly bookkeeping",
          "Quarterly BAS lodgement",
          "Dedicated accountant",
          "Tax planning review"
        ],
        tierPricing: buildTierPricing([
          [1900, 1520], [2200, 1760], [2600, 2080],
          [3000, 2400], [3500, 2800], [4200, 3360]
        ])
      }
    ]
  },

  // ── Bare Trust ──
  bare_trust: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "Bare trust setup & compliance",
        features: [
          "Bare trust establishment",
          "Trust deed preparation",
          "Annual tax return",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [1300, 1040], [1500, 1200], [1750, 1400],
          [2000, 1600], [2400, 1920], [2900, 2320]
        ])
      },
      {
        id: "premium",
        name: "Premium",
        badge: "RECOMMENDED",
        tagline: "Ongoing bare trust management",
        features: [
          "Everything in Essential",
          "Annual compliance review",
          "Dedicated accountant",
          "Priority support"
        ],
        tierPricing: buildTierPricing([
          [1750, 1400], [2000, 1600], [2400, 1920],
          [2800, 2240], [3200, 2560], [3800, 3040]
        ])
      }
    ]
  },

  // ── Charity (Incorporated Association) ──
  charity_ia: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "IA registration & compliance",
        features: [
          "Incorporated association registration",
          "Constitution preparation",
          "Committee setup",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [1400, 1120], [1650, 1320], [1900, 1520],
          [2200, 1760], [2600, 2080], [3100, 2480]
        ])
      },
      {
        id: "premium",
        name: "Premium",
        badge: "MOST POPULAR",
        tagline: "Full IA management",
        features: [
          "Everything in Essential",
          "Annual financial statements",
          "AGM documentation",
          "Dedicated accountant",
          "Priority support"
        ],
        tierPricing: buildTierPricing([
          [1900, 1520], [2200, 1760], [2600, 2080],
          [3000, 2400], [3500, 2800], [4200, 3360]
        ])
      }
    ]
  },

  // ── Charity (Company Limited by Guarantee) ──
  charity_clg: {
    revenueBrackets: standardBrackets,
    plans: [
      {
        id: "essential",
        name: "Essential",
        badge: "",
        tagline: "CLG registration & compliance",
        features: [
          "CLG company registration",
          "ACNC registration",
          "Constitution & governance setup",
          "Email support"
        ],
        tierPricing: buildTierPricing([
          [1600, 1280], [1900, 1520], [2200, 1760],
          [2500, 2000], [2900, 2320], [3400, 2720]
        ])
      },
      {
        id: "premium",
        name: "Premium",
        badge: "MOST POPULAR",
        tagline: "Full CLG management & reporting",
        features: [
          "Everything in Essential",
          "Annual financial statements",
          "ACNC annual reporting",
          "DGR management",
          "Dedicated accountant"
        ],
        tierPricing: buildTierPricing([
          [2200, 1760], [2600, 2080], [3000, 2400],
          [3500, 2800], [4000, 3200], [4800, 3840]
        ])
      }
    ]
  }
};

/* ===============================
   SEED CONTROLLER
================================ */

/**
 * POST /api/admin/pricing/seed-packages
 * Seeds packagePlans into meta for all Business Formation services
 */
exports.seedPackagePlans = async (req, res) => {
  try {
    const results = [];

    for (const [key, packagePlans] of Object.entries(SERVICE_PACKAGES)) {
      const doc = await PricingService.findOne({ key });
      if (!doc) {
        results.push({ key, status: "not_found" });
        continue;
      }

      const safeMeta =
        doc.meta && typeof doc.meta === "object" && !Array.isArray(doc.meta)
          ? doc.meta
          : {};

      doc.set("meta", {
        ...safeMeta,
        packagePlans,
      });

      await doc.save();

      results.push({ key, status: "updated" });
    }

    return res.json({
      success: true,
      message: `Package plans seeded for ${results.filter((r) => r.status === "updated").length} services`,
      results,
    });
  } catch (err) {
    console.error("Error seeding package plans:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * DELETE /api/admin/pricing/clear-packages
 * Removes packagePlans from all services (optional utility)
 */
exports.clearPackagePlans = async (req, res) => {
  try {
    await PricingService.updateMany(
      { key: { $in: Object.keys(SERVICE_PACKAGES) } },
      { $unset: { "meta.packagePlans": "" } }
    );
    return res.json({ success: true, message: "All package plans cleared" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
