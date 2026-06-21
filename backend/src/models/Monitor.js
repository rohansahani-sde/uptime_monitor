const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const monitorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Monitor name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL starting with http:// or https://'],
    },
    type: {
      type: String,
      enum: ['website', 'api'],
      required: [true, 'Monitor type is required'],
    },
    interval: {
      type: Number,
      enum: [1, 2, 3, 5, 10],
      default: 10,
    },
    // Slow response threshold in milliseconds
    threshold: {
      type: Number,
      default: 2000,
      min: [100, 'Threshold must be at least 100ms'],
      max: [30000, 'Threshold cannot exceed 30000ms'],
    },
    // HTTP method for API monitors
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
      default: 'GET',
    },
    // Custom headers for API monitors (stored as JSON string)
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    // Expected status code
    expectedStatusCode: {
      type: Number,
      default: 200,
    },
    // Public status page slug
    slug: {
      type: String,
      unique: true,
      default: () => uuidv4().split('-')[0] + uuidv4().split('-')[1],
    },
    // Current status
    status: {
      type: String,
      enum: ['up', 'down', 'paused', 'unknown', 'slow'],
      default: 'unknown',
      index: true,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    // Aggregated uptime statistics
    uptimeStats: {
      last24Hours: { type: Number, default: null },
      last7Days: { type: Number, default: null },
      last30Days: { type: Number, default: null },
      allTime: { type: Number, default: null },
    },
    // Aggregated response time statistics
    responseTimeStats: {
      avg: { type: Number, default: null },
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      last: { type: Number, default: null },
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    lastDownAt: {
      type: Date,
      default: null,
    },
    totalChecks: {
      type: Number,
      default: 0,
    },
    totalDowntime: {
      type: Number, // in seconds
      default: 0,
    },
    incidentCount: {
      type: Number,
      default: 0,
    },
    // Track if currently in an incident
    activeIncidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    // Notification preferences per monitor
    notifyOnDown: {
      type: Boolean,
      default: true,
    },
    notifyOnRecover: {
      type: Boolean,
      default: true,
    },
    notifyOnSlow: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
monitorSchema.index({ userId: 1, status: 1 });
monitorSchema.index({ userId: 1, isPaused: 1 });

const Monitor = mongoose.model('Monitor', monitorSchema);
module.exports = Monitor;
