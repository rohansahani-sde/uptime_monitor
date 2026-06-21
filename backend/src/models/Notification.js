const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    type: {
      type: String,
      enum: ['down', 'recovered', 'slow', 'weekly_report'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email'],
      default: 'email',
    },
    recipient: {
      type: String, // email address
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    success: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, sentAt: -1 });
notificationSchema.index({ monitorId: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
