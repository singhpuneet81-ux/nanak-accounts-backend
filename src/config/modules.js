// Central registry of admin panel modules / tools.
// A user's effective access = role defaults, unless a custom
// `permissions` array has been saved on the user (admins always get everything).

const MODULE_KEYS = [
  'dashboard',
  'submissions',
  'team',
  'reports',
  'pricing',
  'careers',
  'webinars',
  'benchmarks',
  'benchmarks-usage',
  'deduction',
  'deduction-usage',
  'quote-pad',
  'quote-pad-pricing',
  'sales-commission',
];

const ROLE_DEFAULT_MODULES = {
  admin: [...MODULE_KEYS],
  manager: [
    'dashboard',
    'submissions',
    'reports',
    'benchmarks',
    'benchmarks-usage',
    'deduction',
    'deduction-usage',
    'quote-pad',
    'sales-commission',
  ],
  staff: ['dashboard', 'submissions', 'benchmarks', 'deduction', 'quote-pad', 'sales-commission'],
};

function effectiveModules(user) {
  if (!user) return [];
  if (user.role === 'admin') return [...MODULE_KEYS];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    const custom = user.permissions.filter((k) => MODULE_KEYS.includes(k));
    // Dashboard is always available so the user lands somewhere after login.
    if (!custom.includes('dashboard')) custom.unshift('dashboard');
    return custom;
  }
  return [...(ROLE_DEFAULT_MODULES[user.role] || ROLE_DEFAULT_MODULES.staff)];
}

module.exports = { MODULE_KEYS, ROLE_DEFAULT_MODULES, effectiveModules };
