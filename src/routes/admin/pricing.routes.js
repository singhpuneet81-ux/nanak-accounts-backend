const express = require('express');
const router = express.Router();
const pricingController = require('../../controllers/pricing.controller');
const packageSeeder = require("../../seeds/businessFormationPackages");


router.get('/', pricingController.getAllServices);
router.get('/:key', pricingController.getService);
router.post('/reset', pricingController.resetPricing);  // BEFORE /:key
router.post('/', pricingController.createService);
router.put('/:key', pricingController.updateService);
router.delete('/:key', pricingController.deleteService);
// router.post('/reset', pricingController.resetPricing);

router.post("/pricing/seed-packages", auth, packageSeeder.seedPackagePlans);
router.delete("/pricing/clear-packages", auth, packageSeeder.clearPackagePlans);




module.exports = router;
