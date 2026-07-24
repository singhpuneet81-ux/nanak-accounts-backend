/**
 * One-shot / idempotent data migration for Client Management v4.
 * Safe to call on every seed or meta request.
 */
const PracticeClient = require('../../models/PracticeClient');

async function migrateClientManagementV4() {
  // Individual → Sole Trader
  await PracticeClient.updateMany({ type: 'Individual' }, { $set: { type: 'Sole Trader' } });

  // Normalize QuickBooks flag
  await PracticeClient.updateMany(
    { qb: { $in: ['Not Required', 'Not Connected', null, ''] } },
    { $set: { qb: 'Not Connected' } }
  );
  await PracticeClient.updateMany({ qb: { $nin: ['Connected', 'Not Connected'] } }, { $set: { qb: 'Not Connected' } });

  // Soft-deleted → Inactive with exit reason
  await PracticeClient.updateMany(
    { active: false, $or: [{ status: { $exists: false } }, { status: 'Active' }] },
    {
      $set: {
        status: 'Inactive',
        exit: {
          reason: 'No longer requires our services',
          detail: null,
          date: new Date().toISOString().slice(0, 10),
          by: 'System migration',
          byId: null,
        },
      },
    }
  );

  // Ensure status default for docs missing it
  await PracticeClient.updateMany({ status: { $exists: false } }, { $set: { status: 'Active' } });

  // Ensure software field exists
  await PracticeClient.updateMany({ software: { $exists: false } }, { $set: { software: '' } });

  // Unset office so it no longer appears in lean docs / exports
  await PracticeClient.updateMany({ office: { $exists: true } }, { $unset: { office: 1 } });

  return { ok: true };
}

module.exports = { migrateClientManagementV4 };
