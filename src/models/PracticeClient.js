const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['info', 'warning'], default: 'info' },
    text: { type: String, required: true },
    author: { type: String, default: 'System' },
    date: { type: String, default: '' },
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    date: { type: String, default: '' },
    who: { type: String, default: 'System' },
    action: { type: String, required: true },
  },
  { _id: false }
);

const reconSchema = new mongoose.Schema(
  {
    date: String,
    by: String,
    amount: Number,
    src: String,
  },
  { _id: false }
);

const quarterMap = {
  q1: { type: String, default: 'Not Required' },
  q2: { type: String, default: 'Not Required' },
  q3: { type: String, default: 'Not Required' },
  q4: { type: String, default: 'Not Required' },
};

const practiceClientSchema = new mongoose.Schema(
  {
    entity: { type: String, required: true, index: true },
    abn: { type: String, default: '', index: true },
    type: { type: String, enum: ['Company', 'Individual', 'Trust'], default: 'Company' },
    office: { type: String, default: 'Craigieburn', index: true },
    pkg: { type: String, enum: ['On Package', 'Non Package'], default: 'Non Package' },
    fee: { type: Number, default: null },
    freq: { type: String, enum: ['Monthly', 'Quarterly', 'Annually', null], default: null },
    pay: { type: String, default: null },
    gst: { type: Boolean, default: false },
    payroll: { type: Boolean, default: false },
    qb: { type: String, default: 'Not Required' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    managerName: { type: String, default: '', index: true },
    payrollMgrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    payrollMgr: { type: String, default: null },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeGroup', default: null, index: true },
    relLabel: { type: String, default: null },
    bas: { type: new mongoose.Schema(quarterMap, { _id: false }), default: () => ({}) },
    annual: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Lodged', 'Not Required'],
      default: 'Not Started',
    },
    payq: {
      type: new mongoose.Schema(
        {
          q1: { type: String, default: 'Not Paid' },
          q2: { type: String, default: 'Not Paid' },
          q3: { type: String, default: 'Not Paid' },
          q4: { type: String, default: 'Not Paid' },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    inv: { type: mongoose.Schema.Types.Mixed, default: {} },
    recon: { type: mongoose.Schema.Types.Mixed, default: {} },
    lodged: { type: mongoose.Schema.Types.Mixed, default: {} },
    onTime: { type: mongoose.Schema.Types.Mixed, default: {} },
    feeReview: { type: String, default: null },
    payrollBilled: { type: Number, default: 0 },
    payrollActual: { type: Number, default: 0 },
    payrollFreq: { type: String, enum: ['Weekly', 'Fortnightly', 'Monthly', null], default: null },
    payFirstDate: { type: String, default: null },
    payAnchor: { type: Number, default: 1 },
    payLag: { type: Number, default: 3 },
    notes: { type: [noteSchema], default: [] },
    isNewClient: { type: Boolean, default: false },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
    activity: { type: [activitySchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

practiceClientSchema.index({ entity: 'text', abn: 'text', email: 'text' });

module.exports = mongoose.model('PracticeClient', practiceClientSchema);
