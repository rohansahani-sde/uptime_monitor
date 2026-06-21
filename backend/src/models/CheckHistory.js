const mongoose = require('mongoose');

const checkHistorySchema = new mongoose.Schema(
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
    timestamp: {
      type: Date,
      default: Date.now,
    },
    responseTime: {
      type: Number, // in milliseconds
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    success: {
      type: Boolean,
      required: true,
    },
    // 'up', 'down', 'slow', 'timeout', 'dns_error'
    result: {
      type: String,
      enum: ['up', 'down', 'slow', 'timeout', 'dns_error', 'error'],
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    // Whether response time exceeded threshold
    isSlowResponse: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false, // using timestamp field directly
    versionKey: false,
  }
);

// TTL index: auto-delete records older than 90 days
checkHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Compound index for efficient queries by monitor + time
checkHistorySchema.index({ monitorId: 1, timestamp: -1 });
checkHistorySchema.index({ monitorId: 1, success: 1, timestamp: -1 });

const CheckHistory = mongoose.model('CheckHistory', checkHistorySchema);
module.exports = CheckHistory;
