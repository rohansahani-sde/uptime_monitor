const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    stats: {
      uptimePercentage: { type: Number, default: 0 },
      totalChecks: { type: Number, default: 0 },
      successfulChecks: { type: Number, default: 0 },
      failedChecks: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: null },
      minResponseTime: { type: Number, default: null },
      maxResponseTime: { type: Number, default: null },
      incidentCount: { type: Number, default: 0 },
      totalDowntimeSeconds: { type: Number, default: 0 },
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

weeklyReportSchema.index({ userId: 1, weekStart: -1 });
weeklyReportSchema.index({ monitorId: 1, weekStart: -1 });
// Prevent duplicate reports for same monitor + week
weeklyReportSchema.index({ monitorId: 1, weekStart: 1 }, { unique: true });

const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);
module.exports = WeeklyReport;
