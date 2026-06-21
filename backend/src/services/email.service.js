const nodemailer = require('nodemailer');
const { config } = require('../config/env');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return 'Unknown duration';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const sendEmail = async ({ to, subject, html, monitorId, userId, type, incidentId }) => {
  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });

    if (monitorId && userId) {
      await Notification.create({
        userId,
        monitorId,
        incidentId: incidentId || null,
        type,
        channel: 'email',
        recipient: to,
        subject,
        success: true,
      });
    }

    return true;
  } catch (error) {
    logger.error(`Email send failed to ${to}: ${error.message}`);

    if (monitorId && userId) {
      await Notification.create({
        userId,
        monitorId,
        incidentId: incidentId || null,
        type,
        channel: 'email',
        recipient: to,
        subject,
        success: false,
        errorMessage: error.message,
      });
    }

    return false;
  }
};

const sendDownAlert = async ({ to, monitorName, monitorUrl, errorMessage, incidentTime, statusCode, incidentId }) => {
  const subject = `🚨 Monitor Down: ${monitorName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Monitor Down</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #94a3b8; font-size: 16px; margin-top: 0;">Your monitor has gone down and requires attention.</p>
          <div style="background: #0f172a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px; width: 40%;">Monitor</td>
                <td style="color: #f1f5f9; padding: 8px 0; font-size: 14px; font-weight: 600;">${monitorName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px;">URL</td>
                <td style="color: #60a5fa; padding: 8px 0; font-size: 14px;"><a href="${monitorUrl}" style="color: #60a5fa;">${monitorUrl}</a></td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Status Code</td>
                <td style="color: #f87171; padding: 8px 0; font-size: 14px; font-weight: 600;">${statusCode || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Error</td>
                <td style="color: #f87171; padding: 8px 0; font-size: 14px;">${errorMessage || 'Service unreachable'}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Time</td>
                <td style="color: #f1f5f9; padding: 8px 0; font-size: 14px;">${new Date(incidentTime).toUTCString()}</td>
              </tr>
            </table>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">
            UptimeMonitor — You're receiving this because you're a Premium subscriber.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, type: 'down', incidentId });
};

const sendRecoveryAlert = async ({ to, monitorName, monitorUrl, downtimeDuration, recoveryTime }) => {
  const subject = `✅ Monitor Recovered: ${monitorName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✅ Monitor Recovered</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #94a3b8; font-size: 16px; margin-top: 0;">Your monitor is back online!</p>
          <div style="background: #0f172a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px; width: 40%;">Monitor</td>
                <td style="color: #f1f5f9; padding: 8px 0; font-size: 14px; font-weight: 600;">${monitorName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px;">URL</td>
                <td style="color: #60a5fa; padding: 8px 0; font-size: 14px;"><a href="${monitorUrl}" style="color: #60a5fa;">${monitorUrl}</a></td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Downtime</td>
                <td style="color: #fbbf24; padding: 8px 0; font-size: 14px; font-weight: 600;">${formatDuration(downtimeDuration)}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Recovered At</td>
                <td style="color: #4ade80; padding: 8px 0; font-size: 14px;">${new Date(recoveryTime).toUTCString()}</td>
              </tr>
            </table>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">
            UptimeMonitor — You're receiving this because you're a Premium subscriber.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, type: 'recovered' });
};

const sendWeeklyReport = async ({ to, userId, monitorId, monitorName, monitorUrl, stats, weekStart, weekEnd }) => {
  const subject = `📊 Weekly Uptime Report: ${monitorName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Weekly Uptime Report</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${new Date(weekStart).toDateString()} — ${new Date(weekEnd).toDateString()}</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #f1f5f9; margin-top: 0;">${monitorName}</h2>
          <p style="color: #60a5fa; margin: 0 0 24px;"><a href="${monitorUrl}" style="color: #60a5fa;">${monitorUrl}</a></p>
          <div style="display: grid; gap: 16px;">
            <div style="background: #0f172a; border-radius: 8px; padding: 20px;">
              <div style="font-size: 36px; font-weight: 700; color: ${stats.uptimePercentage >= 99 ? '#4ade80' : stats.uptimePercentage >= 95 ? '#fbbf24' : '#f87171'};">${stats.uptimePercentage?.toFixed(2) || 0}%</div>
              <div style="color: #64748b; font-size: 14px; margin-top: 4px;">Uptime</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; background: #0f172a; border-radius: 8px; overflow: hidden;">
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #64748b; padding: 12px 16px; font-size: 14px;">Total Checks</td>
                <td style="color: #f1f5f9; padding: 12px 16px; font-size: 14px; text-align: right; font-weight: 600;">${stats.totalChecks}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #64748b; padding: 12px 16px; font-size: 14px;">Failed Checks</td>
                <td style="color: #f87171; padding: 12px 16px; font-size: 14px; text-align: right; font-weight: 600;">${stats.failedChecks}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #64748b; padding: 12px 16px; font-size: 14px;">Avg Response Time</td>
                <td style="color: #f1f5f9; padding: 12px 16px; font-size: 14px; text-align: right; font-weight: 600;">${stats.avgResponseTime ? Math.round(stats.avgResponseTime) + 'ms' : 'N/A'}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 12px 16px; font-size: 14px;">Incidents</td>
                <td style="color: ${stats.incidentCount > 0 ? '#f87171' : '#4ade80'}; padding: 12px 16px; font-size: 14px; text-align: right; font-weight: 600;">${stats.incidentCount}</td>
              </tr>
            </table>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">
            UptimeMonitor — Premium Weekly Report
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, type: 'weekly_report', userId, monitorId });
};

const sendPasswordResetEmail = async ({ to, resetToken, resetUrl }) => {
  const subject = 'Reset Your Password — UptimeMonitor';
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Reset Your Password</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #94a3b8; font-size: 16px; margin-top: 0;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">UptimeMonitor</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, type: 'down' });
};

module.exports = { sendDownAlert, sendRecoveryAlert, sendWeeklyReport, sendPasswordResetEmail };
