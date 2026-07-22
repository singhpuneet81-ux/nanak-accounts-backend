const router = require('express').Router();
const { protect } = require('../../middleware/auth');
const { requireModule } = require('../../middleware/roles');
const c = require('../../controllers/sales-commission.controller');

router.use(protect);
router.use(requireModule('sales-commission'));

router.get('/meta', c.getMeta);
router.get('/badges', c.getBadges);
router.get('/dashboard', c.getDashboard);
router.get('/staff', c.listStaff);

router.get('/deals', c.listDeals);
router.post('/deals', c.bookDeal);
router.get('/deals/:id', c.getDeal);
router.post('/deals/:id/sign', c.markSigned);
router.post('/deals/:id/milestone', c.setMilestone);
router.post('/deals/:id/payments', c.addPayment);
router.post('/deals/:id/cancel', c.cancelDeal);
router.post('/deals/:id/void', c.voidDeal);

router.get('/payments/awaiting', c.listAwaiting);
router.get('/payments/verified', c.listVerified);
router.post('/payments/:id/verify', c.verifyPayment);
router.post('/payments/:id/reject', c.rejectPayment);
router.post('/payments/:id/refund', c.refundPayment);

router.get('/ledger', c.getLedger);

router.get('/payout-batches', c.listBatches);
router.post('/payout-batches', c.createBatch);
router.get('/payout-batches/:id', c.getBatch);
router.post('/payout-batches/:id/advance', c.advanceBatch);
router.get('/payout-batches/:id/export.csv', c.exportBatchCsv);

router.get('/clawbacks', c.listClawbacks);
router.post('/clawbacks/:id/waive', c.waiveClawback);

router.get('/queries', c.listQueries);
router.post('/queries', c.raiseQuery);
router.post('/queries/:id/reply', c.replyQuery);
router.post('/queries/:id/resolve', c.resolveQuery);

router.get('/targets', c.listTargets);
router.post('/targets', c.setTarget);

router.get('/settings', c.getSettings);
router.patch('/settings', c.updateSettings);
router.post('/plans', c.addRate);

router.get('/audit', c.listAudit);
router.post('/preview', c.preview);
router.post('/acceptance-tests/run', c.runAcceptance);

module.exports = router;
