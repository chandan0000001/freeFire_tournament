import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { ROLES } from '../constants/roles.js';
import { redisAuth } from '../config/redis.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber || '',
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Player Registration
 */
export const register = async (req, res, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues || parseResult.error.errors || [];
      const errorMsg = issues.map((e) => e.message).join('. ');
      return res.status(400).json({ success: false, message: errorMsg });
    }

    const { fullName, email, mobileNumber, password, freeFireUid, inGameName, location } = parseResult.data;

    // Redis rate limit: Max 5 registrations per hour per IP
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const rateCheck = await redisAuth.rateLimit(`reg:${clientIp}`, 5, 3600);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please wait an hour before trying again.',
      });
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in instead.',
      });
    }

    // Create Player User
    const user = await User.create({
      name: fullName,
      email,
      mobileNumber,
      password,
      role: ROLES.PLAYER,
      freeFireUid: freeFireUid || '',
      inGameName: inGameName || '',
      location: location || '',
      lastLogin: new Date(),
    });

    // Automatically create or link Wallet for this player
    let wallet = await Wallet.findOne({ userEmail: email });
    if (wallet) {
      wallet.userId = user._id;
      wallet.playerName = user.name;
      wallet.phone = user.mobileNumber;
      if (freeFireUid) wallet.freeFireUid = freeFireUid;
      await wallet.save();
    } else {
      wallet = await Wallet.create({
        userId: user._id,
        userEmail: email,
        playerName: user.name,
        phone: user.mobileNumber,
        freeFireUid: freeFireUid || '',
      });
    }

    // Invalidate and refresh Redis caches
    await redisAuth.invalidateWallet([user._id.toString(), email]);
    await redisAuth.cacheUser(user.toObject());

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Rahul Esports.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        freeFireUid: user.freeFireUid,
        inGameName: user.inGameName,
        location: user.location,
      },
      wallet: {
        totalCoins: wallet.totalCoins,
        depositCoins: wallet.depositCoins,
        winningCoins: wallet.winningCoins,
        lockedCoins: wallet.lockedCoins,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Player Login
 */
export const login = async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues || parseResult.error.errors || [];
      const errorMsg = issues.map((e) => e.message).join('. ');
      return res.status(400).json({ success: false, message: errorMsg });
    }

    const { email, password } = parseResult.data;

    // Redis rate limit: Max 10 attempts per 15 minutes
    const rateCheck = await redisAuth.rateLimit(`login:${email}`, 10, 900);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please wait 15 minutes or reset your password.',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    // Link wallet if missing userId
    let wallet = await Wallet.findOne({ userEmail: email });
    if (wallet && !wallet.userId) {
      wallet.userId = user._id;
      await wallet.save();
    } else if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        userEmail: email,
        playerName: user.name,
        phone: user.mobileNumber || '',
      });
    }

    // Cache user & wallet in Redis
    await redisAuth.cacheUser(user.toObject());
    await redisAuth.cacheWallet(user._id.toString(), wallet.toObject());

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        freeFireUid: user.freeFireUid,
        inGameName: user.inGameName,
        location: user.location,
      },
      wallet: {
        totalCoins: wallet.totalCoins,
        depositCoins: wallet.depositCoins,
        winningCoins: wallet.winningCoins,
        lockedCoins: wallet.lockedCoins,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin Login
 */
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || ![ROLES.SUPERADMIN, ROLES.ADMIN].includes(user.role)) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password - Generates Single-Use Reset Token & Sends Brevo Email
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues || parseResult.error.errors || [];
      return res.status(400).json({
        success: false,
        message: issues[0]?.message || 'Please provide a valid email.',
      });
    }

    const { email } = parseResult.data;

    // Redis rate limit: Max 3 requests per 30 minutes per email
    const rateCheck = await redisAuth.rateLimit(`pwd_reset_req:${email}`, 3, 1800);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset requests. Please wait 30 minutes before requesting again.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't disclose whether account exists
      return res.json({
        success: true,
        message: 'If an account is associated with this email, a password reset link has been dispatched.',
      });
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save in Mongo
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Store in Redis with exact 15-minute TTL (900 seconds)
    await redisAuth.storeResetToken(hashedToken, {
      userId: user._id.toString(),
      email: user.email,
    }, 900);

    // Determine Client Base URL
    const clientBase =
      process.env.CLIENT_URL ||
      req.headers.origin ||
      (process.env.NODE_ENV === 'production' ? 'https://rittournament.vercel.app' : 'http://localhost:5173');

    const resetUrl = `${clientBase}/reset-password?token=${rawToken}`;

    // Send email via Brevo
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (mailErr) {
      console.error('[Forgot Password] Email send failure:', mailErr.message);
    }

    return res.json({
      success: true,
      message: 'Password reset link sent! Please check your email inbox (and spam folder).',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset Password - Verifies Token & Sets New Password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues || parseResult.error.errors || [];
      const errorMsg = issues.map((e) => e.message).join('. ');
      return res.status(400).json({ success: false, message: errorMsg });
    }

    const { token, password } = parseResult.data;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 1. Check Redis fast-path
    let tokenData = await redisAuth.getResetToken(hashedToken);
    let user = null;

    if (tokenData?.userId) {
      user = await User.findById(tokenData.userId).select('+resetPasswordToken +resetPasswordExpires');
    }

    // 2. Fallback to MongoDB check if Redis cache expired or missed
    if (!user) {
      user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      }).select('+resetPasswordToken +resetPasswordExpires');
    }

    if (!user || user.resetPasswordToken !== hashedToken || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new link.',
      });
    }

    // Update password (pre-save hook hashes with bcrypt)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Clear Redis token and invalidate cached user session
    await redisAuth.clearResetToken(hashedToken);
    await redisAuth.invalidateUser(user._id.toString());

    return res.json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Current Authenticated User & Wallet
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Check Redis for cached wallet
    let wallet = await redisAuth.getCachedWallet(userId);
    if (!wallet) {
      wallet = await Wallet.findOne({
        $or: [{ userId: req.user._id }, { userEmail: req.user.email }],
      });
      if (wallet) {
        if (!wallet.userId) {
          wallet.userId = req.user._id;
          await wallet.save();
        }
        await redisAuth.cacheWallet(userId, wallet.toObject());
      }
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobileNumber: req.user.mobileNumber || '',
        role: req.user.role,
        freeFireUid: req.user.freeFireUid || '',
        inGameName: req.user.inGameName || '',
        location: req.user.location || '',
      },
      wallet: wallet
        ? {
            totalCoins: wallet.totalCoins,
            depositCoins: wallet.depositCoins,
            winningCoins: wallet.winningCoins,
            lockedCoins: wallet.lockedCoins,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};
