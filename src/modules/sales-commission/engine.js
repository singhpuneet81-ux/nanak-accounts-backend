/** Pure commission engine — ported from Nanak_Sales_Commission_Hub prototype. */

const { addMonths, addDays, daysBetween, todayISO } = require('./dates');

function eligibleNewCents(type, annualC, prevC) {
  if (type === 'new' || type === 'react') return annualC;
  if (type === 'upsell') return Math.max(0, annualC - (prevC || 0));
  return 0;
}

function incRatio(type, annualC, prevC) {
  if (annualC <= 0) return 0;
  return eligibleNewCents(type, annualC, prevC) / annualC;
}

function creditForPayment(netC, ratio, rate) {
  return Math.round(netC * ratio * rate);
}

function payoutNet(creditC, negC, openingOwedC) {
  const sub = creditC + negC;
  const net = sub - openingOwedC;
  return net < 0 ? { pay: 0, carry: -net } : { pay: net, carry: 0 };
}

function inrSnapshot(cents, fx) {
  return Math.round((cents / 100) * fx);
}

function money(cents) {
  const n = Number(cents) || 0;
  const sign = n < 0 ? '-' : '';
  return `${sign}$${(Math.abs(n) / 100).toFixed(2)}`;
}

function dollars(cents) {
  return Math.round((Number(cents) || 0) / 100);
}

function computeActivation(deal, firstVerifiedPaymentAt) {
  if (
    !deal.signedAt ||
    !deal.paymentSetupCompletedAt ||
    !deal.onboardingCompletedAt ||
    !firstVerifiedPaymentAt
  ) {
    return null;
  }
  return [deal.signedAt, deal.paymentSetupCompletedAt, deal.onboardingCompletedAt, firstVerifiedPaymentAt]
    .sort()
    .slice(-1)[0];
}

function applyActivationSnapshots(deal, actDate, settings) {
  deal.activationDate = actDate;
  deal.retentionDaysSnapshot = settings.retentionDays;
  deal.retentionMaturityDate = addDays(actDate, deal.retentionDaysSnapshot);
  deal.firstYearMonthsSnapshot = settings.firstYearMonths;
  deal.commissionWindowEndDate = addDays(addMonths(actDate, deal.firstYearMonthsSnapshot), -1);
  return deal;
}

function retState(deal, today) {
  const now = today || todayISO();
  if (deal.cancelDate) {
    if (!deal.activationDate) return 'cancelled-before';
    return deal.cancelDate < deal.retentionMaturityDate ? 'cancelled-in' : 'cancelled-after';
  }
  if (!deal.activationDate) return 'pending';
  return now < deal.retentionMaturityDate ? 'at-risk' : 'protected';
}

function inWindow(deal, payDate) {
  if (!deal.commissionWindowEndDate) return true;
  return payDate <= deal.commissionWindowEndDate;
}

function won(deal) {
  return !!deal.signedAt && !deal.voided;
}

function displayStage(deal, today) {
  if (deal.voided) return 'Voided';
  if (deal.cancelDate) {
    const rs = retState(deal, today);
    if (rs === 'cancelled-before') return 'Cancelled before activation';
    if (rs === 'cancelled-in') return 'Cancelled / within retention';
    return 'Cancelled / after retention';
  }
  if (!won(deal)) return deal.stage || 'Draft';
  if (deal.activationDate) {
    return retState(deal, today) === 'protected' ? 'Active / Protected' : 'Active / At risk';
  }
  if (!deal.paymentSetupCompletedAt) return 'Payment setup pending';
  if (!deal.onboardingCompletedAt) return 'Onboarding pending';
  return 'First payment pending';
}

function blocker(deal, unverifiedCount, today) {
  if (deal.voided) return 'Deal voided';
  if (deal.cancelDate) {
    const rs = retState(deal, today);
    if (rs === 'cancelled-before') return 'Client cancelled before activation';
    if (rs === 'cancelled-in') return 'Cancelled in retention — clawback applied';
    return 'Closed';
  }
  if (!won(deal)) {
    if (deal.stage === 'Proposal sent' || deal.stage === 'Awaiting acceptance') return 'Awaiting client signature';
    return 'Send Ignition proposal';
  }
  if (!deal.activationDate) {
    if (!deal.paymentSetupCompletedAt) return 'Set up direct debit / payment method';
    if (!deal.onboardingCompletedAt) return 'Complete onboarding';
    return 'First verified payment pending';
  }
  if (unverifiedCount) return `${unverifiedCount} payment(s) awaiting manager verification`;
  return retState(deal, today) === 'at-risk'
    ? `Commission at risk until ${deal.retentionMaturityDate}`
    : 'Retention protected';
}

function targetQualified(deal, today) {
  if (!won(deal) || deal.voided) return false;
  if (!deal.cancelDate) return true;
  const rs = retState(deal, today);
  return rs !== 'cancelled-in' && rs !== 'cancelled-before';
}

function entryStatus(entry, deal, batch, today) {
  if (entry.cancelled) return { label: 'Cancelled', tone: 'muted' };
  if (entry.kind === 'clawback') return { label: 'Clawback', tone: 'danger' };
  if (entry.kind === 'refund') return { label: 'Refund reversal', tone: 'danger' };
  if (entry.kind === 'adjustment') return { label: 'Adjustment', tone: 'warn' };
  if (entry.paid) return { label: 'Paid', tone: 'success' };
  if (deal && !deal.activationDate) return { label: 'Pending activation', tone: 'warn' };
  if (entry.batchId && batch) {
    const period = (batch.period || '').split('-').pop() || '';
    return { label: `Reserved · ${period}`, tone: 'muted' };
  }
  const rs = deal ? retState(deal, today) : 'pending';
  return rs === 'protected'
    ? { label: 'Protected — payout eligible', tone: 'success' }
    : { label: 'At risk — payout eligible', tone: 'warn' };
}

function previewCommission({ type, annualFeeCents, prevFeeCents, rate }) {
  const eligible = eligibleNewCents(type, annualFeeCents, prevFeeCents);
  const ratio = incRatio(type, annualFeeCents, prevFeeCents);
  const annualCredit = creditForPayment(annualFeeCents, ratio, rate);
  return {
    eligibleNewCents: eligible,
    incRatio: ratio,
    rate,
    estimatedAnnualCommissionCents: annualCredit,
    note: 'Estimate — earned only when payments are collected, verified and the deal is activated.',
  };
}

module.exports = {
  eligibleNewCents,
  incRatio,
  creditForPayment,
  payoutNet,
  inrSnapshot,
  money,
  dollars,
  computeActivation,
  applyActivationSnapshots,
  retState,
  inWindow,
  won,
  displayStage,
  blocker,
  targetQualified,
  entryStatus,
  previewCommission,
  addMonths,
  addDays,
  daysBetween,
};
