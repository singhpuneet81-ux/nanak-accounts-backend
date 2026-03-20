

// const PayrollPricing = require("../models/PayrollPricing.model");

const payrollController = {
  getAll: async (req, res) => {
    try {
      const docs = await PayrollPricing.find().lean();
      res.json({ success: true, data: docs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  upsert: async (req, res) => {
    try {
      const data = req.body;
      if (!data.serviceKey)
        return res.status(400).json({ success: false, message: "serviceKey required" });
      const doc = await PayrollPricing.findOneAndUpdate(
        { serviceKey: data.serviceKey },
        { $set: data },
        { upsert: true, new: true, runValidators: true }
      );
      res.json({ success: true, data: doc });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      await PayrollPricing.deleteMany({});
      res.json({ success: true, message: "All payroll pricing deleted" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

