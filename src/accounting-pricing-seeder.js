const mongoose = require("mongoose");
const dotenv = require("dotenv");
const AccountingPricing = require("./models/accounting-pricing.model");
const seederData = require("../data/accountingPricingData");

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await AccountingPricing.deleteMany({});
    await AccountingPricing.insertMany(seederData);

    console.log("Seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();