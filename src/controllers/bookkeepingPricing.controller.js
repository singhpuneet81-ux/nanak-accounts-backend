const BookkeepingPricing = require("../models/BookkeepingPricing.model");

exports.getAll = async (req, res) => {
  try {
    const docs = await BookkeepingPricing.find().lean();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.upsert = async (req, res) => {
  try {
    const data = req.body;
    if (!data.serviceKey)
      return res.status(400).json({ success: false, message: "serviceKey required" });
    const doc = await BookkeepingPricing.findOneAndUpdate(
      { serviceKey: data.serviceKey },
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await BookkeepingPricing.deleteMany({});
    res.json({ success: true, message: "All bookkeeping pricing deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
