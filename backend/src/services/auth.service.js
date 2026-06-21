const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { config } = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const emailService = require('./email.service');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
};

const signup = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 400);
  }

  const user = await User.create({ name, email, password });

  // Create default free subscription
  await Subscription.create({ userId: user._id, plan: 'free', status: 'active' });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { token: refreshToken } },
    lastLogin: new Date(),
  });

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 401);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Prune old tokens (keep last 5)
  const tokens = user.refreshTokens || [];
  const prunedTokens = tokens.slice(-4);
  prunedTokens.push({ token: refreshToken });

  await User.findByIdAndUpdate(user._id, {
    refreshTokens: prunedTokens,
    lastLogin: new Date(),
  });

  return { user, accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token required.', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User not found.', 401);

  const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);
  if (!tokenExists) throw new AppError('Refresh token not recognized.', 401);

  const newAccessToken = generateAccessToken(user._id);
  return { accessToken: newAccessToken, user };
};

const logout = async (userId, refreshToken) => {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { token: refreshToken } },
  });
};

const googleOAuthLogin = async ({ googleId, email, name, avatar }) => {
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({ googleId, email, name, avatar, isEmailVerified: true });
    await Subscription.create({ userId: user._id, plan: 'free', status: 'active' });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (!user.avatar && avatar) user.avatar = avatar;
    await user.save();
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { token: refreshToken } },
    lastLogin: new Date(),
  });

  return { user, accessToken, refreshToken };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Always return success to prevent email enumeration
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: hashedToken,
    passwordResetExpires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
  await emailService.sendPasswordResetEmail({ to: email, resetToken, resetUrl });
};

const resetPassword = async ({ token, password }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) throw new AppError('Password reset token is invalid or has expired.', 400);

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();
};

module.exports = { signup, login, refreshAccessToken, logout, googleOAuthLogin, forgotPassword, resetPassword };
