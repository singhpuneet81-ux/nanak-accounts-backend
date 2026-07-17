// Seeds sample usage records for the ATO Benchmark Usage and Deduction Usage modules:
//   node src/seeds/toolSessions.seed.js
//
// Creates 3 ATO Benchmark checks and 3 Deduction interviews attributed to the
// seeded test users, so the usage pages have data to show. Re-running skips
// entries that already exist (matched by tool + title).

require('dotenv').config();
const { connectDB } = require('../config/db');
const User = require('../models/User');
const ToolSession = require('../models/ToolSession');

// Payload shapes mirror what the admin frontend saves, so every seeded entry
// can be reloaded inside the tool. Industry names and occupation/item keys
// must match the frontend datasets (atoBenchmarks.ts / deductionEngine.ts).

const ATO_SESSIONS = (by) => [
  {
    tool: 'ato-benchmark',
    title: 'Sunrise Bakery Pty Ltd · Bakeries and hot bread shops',
    summary: {
      clientName: 'Sunrise Bakery Pty Ltd',
      preparedBy: by[0].name,
      industryName: 'Bakeries and hot bread shops',
      incomeYear: '2024-25',
      turnover: '420000',
    },
    payload: {
      clientName: 'Sunrise Bakery Pty Ltd',
      preparedBy: by[0].name,
      incomeYear: '2024-25',
      fullYear: true,
      industryName: 'Bakeries and hot bread shops',
      figures: { to: '420000', cos: '148000', labour: '92000', rent: '38000', mv: '8500', totexp: '352000' },
    },
    user: by[0],
  },
  {
    tool: 'ato-benchmark',
    title: 'SecureHome Alarms · Alarm systems installation - fire and security',
    summary: {
      clientName: 'SecureHome Alarms',
      preparedBy: by[1].name,
      industryName: 'Alarm systems installation - fire and security',
      incomeYear: '2024-25',
      turnover: '265000',
    },
    payload: {
      clientName: 'SecureHome Alarms',
      preparedBy: by[1].name,
      incomeYear: '2024-25',
      fullYear: true,
      industryName: 'Alarm systems installation - fire and security',
      figures: { to: '265000', cos: '89000', labour: '61000', rent: '12000', mv: '14500', totexp: '182000' },
    },
    user: by[1],
  },
  {
    tool: 'ato-benchmark',
    title: "City Style Barbers · Barber and men's hairdressing",
    summary: {
      clientName: 'City Style Barbers',
      preparedBy: by[2].name,
      industryName: "Barber and men's hairdressing",
      incomeYear: '2023-24',
      turnover: '138000',
    },
    payload: {
      clientName: 'City Style Barbers',
      preparedBy: by[2].name,
      incomeYear: '2023-24',
      fullYear: true,
      industryName: "Barber and men's hairdressing",
      figures: { to: '138000', cos: '9500', labour: '31000', rent: '26000', mv: '', totexp: '98000' },
    },
    user: by[2],
  },
];

const line = (over = {}) => ({
  clientAnswer: 'yes',
  evidenceStatus: 'none',
  treatmentStatus: 'pending',
  reimbursed: 'no',
  ...over,
});

const DEDUCTION_SESSIONS = (by) => [
  {
    tool: 'deduction',
    title: 'Raj Sharma · Carpenter (Fit-out) · FY 2025-26',
    summary: {
      clientName: 'Raj Sharma',
      preparedBy: by[0].name,
      occId: 'carpenter',
      occName: 'Carpenter',
      subtype: 'Fit-out',
      year: '2025-26',
      answered: 4,
      potential: 4,
      totalAmount: 3120,
    },
    payload: {
      clientName: 'Raj Sharma',
      preparedBy: by[0].name,
      occId: 'carpenter',
      occName: 'Carpenter',
      year: '2025-26',
      subtype: 'Fit-out',
      state: {
        'CARPENTER.POWER_TOOLS': line({ amount: '1850', evidenceStatus: 'received', workUsePercent: '100', staffNote: 'Nail gun + track saw, receipts on file' }),
        'CARPENTER.CONSUMABLES': line({ amount: '380', evidenceStatus: 'received' }),
        'TOOLS.PURCHASES': line({ amount: '890', evidenceStatus: 'requested', workUsePercent: '90' }),
        'TOOLS.INSURANCE': line({ clientAnswer: 'no' }),
      },
    },
    user: by[0],
  },
  {
    tool: 'deduction',
    title: 'Amanpreet Singh · Electrician (Solar accredited) · FY 2025-26',
    summary: {
      clientName: 'Amanpreet Singh',
      preparedBy: by[1].name,
      occId: 'electrician',
      occName: 'Electrician',
      subtype: 'Solar accredited',
      year: '2025-26',
      answered: 3,
      potential: 3,
      totalAmount: 1420,
    },
    payload: {
      clientName: 'Amanpreet Singh',
      preparedBy: by[1].name,
      occId: 'electrician',
      occName: 'Electrician',
      year: '2025-26',
      subtype: 'Solar accredited',
      state: {
        'ELECTRICIAN.TEST_INSTRUMENTS': line({ amount: '980', evidenceStatus: 'received', workUsePercent: '100' }),
        'ELECTRICIAN.STANDARDS_CODES': line({ amount: '440', evidenceStatus: 'received' }),
        'CAR.TOLLS_PARKING': line({ evidenceStatus: 'requested', staffNote: 'Toll statement requested from client' }),
      },
    },
    user: by[1],
  },
  {
    tool: 'deduction',
    title: 'Devinder Kaur · Construction labourer · FY 2024-25',
    summary: {
      clientName: 'Devinder Kaur',
      preparedBy: by[2].name,
      occId: 'construction-labourer',
      occName: 'Construction labourer',
      subtype: null,
      year: '2024-25',
      answered: 2,
      potential: 2,
      totalAmount: 310,
    },
    payload: {
      clientName: 'Devinder Kaur',
      preparedBy: by[2].name,
      occId: 'construction-labourer',
      occName: 'Construction labourer',
      year: '2024-25',
      subtype: null,
      state: {
        'CONSTRUCTION_LABOURER.TICKET_RENEWALS': line({ amount: '120', evidenceStatus: 'received' }),
        'TOOLS.PURCHASES': line({ amount: '190', evidenceStatus: 'received', workUsePercent: '100' }),
      },
    },
    user: by[2],
  },
];

async function run() {
  await connectDB();

  // Attribute sessions to the seeded test users; fall back to any active user.
  const emails = ['admin@nanak.com', 'manager@nanak.com', 'staff@nanak.com'];
  const users = [];
  for (const email of emails) {
    const u = await User.findOne({ email });
    if (u) users.push(u);
  }
  if (users.length === 0) {
    const anyUser = await User.findOne({ active: true });
    if (!anyUser) {
      console.error('No users found — create a user first, then re-run this seeder.');
      process.exit(1);
    }
    users.push(anyUser);
  }
  while (users.length < 3) users.push(users[users.length % users.length]);

  const sessions = [...ATO_SESSIONS(users), ...DEDUCTION_SESSIONS(users)];
  for (const s of sessions) {
    const existing = await ToolSession.findOne({ tool: s.tool, title: s.title });
    if (existing) {
      console.log(`♻️  Already exists, skipped: [${s.tool}] ${s.title}`);
      continue;
    }
    await ToolSession.create({
      tool: s.tool,
      title: s.title,
      summary: s.summary,
      payload: s.payload,
      createdBy: s.user._id,
      createdByName: s.user.name,
    });
    console.log(`✅ Seeded: [${s.tool}] ${s.title} (by ${s.user.name})`);
  }

  console.log('\nDone. Open ATO Benchmark Usage / Deduction Usage in the admin panel to see the records.');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
