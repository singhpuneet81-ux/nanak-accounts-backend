const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://singhpuneet81_db_user:gRVmCC577sxlO8j5@nanakcluster.qwrk1xu.mongodb.net/?appName=NanakCluster"; // replace this

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to DB");

    const db = mongoose.connection.db;
    const collection = db.collection("submissions");

    // Order numbers to KEEP
    const keepOrders = ["NA-2026-9520", "NA-2026-3682"];

    // Delete everything except these
    const result = await collection.deleteMany({
      orderNumber: { $nin: keepOrders }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} documents`);
    console.log("✅ Only required records are kept");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

run();
