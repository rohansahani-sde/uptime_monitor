const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['down', 'slow', 'timeout', 'dns_error', 'error'],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    // Duration in seconds (populated when resolved)
    duration: {
      type: Number,
      default: null,
    },
    rootCause: {
      type: String,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Was alert sent for this incident
    alertSent: {
      type: Boolean,
      default: false,
    },
    recoveryAlertSent: {
      type: Boolean,
      default: false,
    },
    // Acknowledgement
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
incidentSchema.index({ monitorId: 1, resolved: 1 });
incidentSchema.index({ monitorId: 1, startTime: -1 });
incidentSchema.index({ userId: 1, startTime: -1 });

const Incident = mongoose.model('Incident', incidentSchema);
module.exports = Incident;
