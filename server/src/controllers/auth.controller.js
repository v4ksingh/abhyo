const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Institute } = require('../models');
const { sendEmail } = require('../utils/email.util');
const { sendSMS } = require('../utils/sms.util');

// ─── Trial Activation Helper ──────────────────────────────
async function activateTrialIfAvailable(userId, role) {
  try {
    const { Plan, Notification } = require('../models');
    const planType = role === 'institute' ? 'institute' : 'student';
    // Find any active trial plan
    const trialPlan = await Plan.findOne({
      where: { type: planType, isActive: true, trialEnabled: true },
      order: [['price', 'DESC']], // Give the highest-value trial
    });
    if (!trialPlan || !trialPlan.trialDays) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + trialPlan.trialDays);

    if (role === 'student') {
      await User.update({
        studentSubscriptionPlan: trialPlan.id,
        studentSubscriptionStatus: 'trial',
        studentSubscriptionEndDate: endDate,
      }, { where: { id: userId } });
    }
    // For institute, the institute record is created after — handled separately

    await Notification.create({
      userId,
      title: `🎁 ${trialPlan.trialDays}-Day Free Trial Activated!`,
      message: `Welcome! Your free trial of "${trialPlan.name}" is active until ${endDate.toLocaleDateString('en-IN')}. Explore all premium features!`,
      type: 'payment_success',
    });
  } catch (err) {
    console.error('Trial activation error (non-fatal):', err.message);
  }
}

async function activateInstituteTrialIfAvailable(userId, institute) {
  try {
    const { Plan, Notification } = require('../models');
    const trialPlan = await Plan.findOne({
      where: { type: 'institute', isActive: true, trialEnabled: true },
      order: [['price', 'DESC']],
    });
    if (!trialPlan || !trialPlan.trialDays) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + trialPlan.trialDays);

    // Derive enum plan name (free/basic/pro/enterprise)
    let enumPlanName = trialPlan.name.toLowerCase().replace(/[^a-z]/g, '');
    if (!['free', 'basic', 'pro', 'enterprise'].includes(enumPlanName)) enumPlanName = 'pro';

    await institute.update({
      subscriptionPlan: enumPlanName,
      subscriptionStatus: 'trial',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: endDate,
      maxStudents: trialPlan.maxStudents || 50,
      maxBatches: trialPlan.maxBatches || 5,
    });

    await Notification.create({
      userId,
      title: `🎁 ${trialPlan.trialDays}-Day Institute Trial Activated!`,
      message: `Welcome! Your "${trialPlan.name}" trial is active until ${endDate.toLocaleDateString('en-IN')}. Invite students and explore all features!`,
      type: 'payment_success',
    });
  } catch (err) {
    console.error('Institute trial activation error (non-fatal):', err.message);
  }
}

// ─── Helpers ────────────────────────────────────────
const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const INST_INCLUDE = {
  association: 'institute',
  attributes: ['id', 'name', 'status', 'subscriptionPlan', 'subscriptionStatus', 'subscriptionEndDate', 'logo', 'inviteCode'],
};

// ─── Register ────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, role = 'student', instituteName, instituteCode, state, city, isOlympiadUser } = req.body;

    if (!name || !password) return res.status(400).json({ error: 'Name and password are required' });
    if (!email && !mobile) return res.status(400).json({ error: 'Email or mobile is required' });

    // Check existing user
    const where = {};
    if (email) where.email = email;
    if (mobile) where.mobile = mobile;
    const existing = await User.findOne({ where: { [Op.or]: [email ? { email } : null, mobile ? { mobile } : null].filter(Boolean) } });
    if (existing) return res.status(400).json({ error: 'User already exists with this email/mobile' });

    const { SiteSettings } = require('../models');
    
    // Check if registration is enabled
    const settingKey = role === 'institute' ? 'institute_registration' : 'student_registration';
    const registrationSetting = await SiteSettings.findOne({ where: { key: settingKey } });
    
    // Default to true if not set, otherwise check if it's explicitly 'false'
    if (registrationSetting && registrationSetting.value === 'false') {
      return res.status(403).json({ error: `${role === 'institute' ? 'Institute' : 'Student'} registration is currently disabled by the administrator.` });
    }

    let instituteId = null;

    // Handle institute join via code
    if (role === 'student' && instituteCode) {
      const inst = await Institute.findOne({ where: { inviteCode: instituteCode, status: 'approved' } });
      if (inst) {
        instituteId = inst.id;
        await inst.increment('totalStudents');
      }
    }

    const user = await User.create({ name, email, mobile, password, role, instituteId, state: state || null, city: city || null, isOlympiadUser: !!isOlympiadUser });

    // If registering as institute, create institute record
    if (role === 'institute') {
      const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const inst = await Institute.create({
        name: instituteName || `${name}'s Institute`,
        email,
        mobile,
        state: state || null,
        city: city || null,
        ownerId: user.id,
        inviteCode,
      });
      await user.update({ instituteId: inst.id });
      
      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: 'Registration successful. Your institute is pending admin approval.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'institute',
          instituteName: inst.name,
        },
      });
    } else {
      // Activate student trial if available
      await activateTrialIfAvailable(user.id, role);
    }

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await user.update({ refreshToken });

    const fullUser = await User.findByPk(user.id, { include: [INST_INCLUDE] });
    const trialInfo = fullUser.studentSubscriptionStatus === 'trial' ? { trialActive: true, trialEndDate: fullUser.studentSubscriptionEndDate } : null;

    // Send Welcome Email asynchronously
    if (user.email) {
      try {
        const rawClientUrl = (process.env.CLIENT_URL || 'https://abhyo.com').split(',')[0].trim();
        const primaryClientUrl = (!rawClientUrl || rawClientUrl.includes('localhost') || rawClientUrl.includes('127.0.0.1'))
          ? 'https://abhyo.com'
          : rawClientUrl;

        sendEmail({
          to: user.email,
          subject: 'Welcome to Abhyo - Your Account is Ready',
          html: emailTemplates.welcomeEmail({
            name: user.name,
            email: user.email,
            role: user.role,
            loginUrl: `${primaryClientUrl}/login`,
          }),
        }).catch(e => console.error('[Welcome Email non-fatal]:', e.message));
      } catch (mailErr) {
        console.error('[Welcome Email Init non-fatal]:', mailErr.message);
      }
    }

    res.status(201).json({ success: true, token, refreshToken, user: fullUser, trialInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Login ────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const where = email ? { email } : { mobile };
    const user = await User.findOne({ 
      where, 
      attributes: { include: ['password', 'refreshToken', 'failedLoginAttempts', 'lockUntil'] },
      include: [INST_INCLUDE]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(403).json({ error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.` });
    }

    if (!(await user.comparePassword(password))) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates = { failedLoginAttempts: attempts };
      if (attempts >= 3) {
        updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await user.update(updates);

      if (attempts >= 3) {
        return res.status(403).json({
          error: 'Account locked for 15 minutes due to 3 consecutive failed login attempts. Try again later or reset your password.',
        });
      }

      const attemptsRemaining = Math.max(0, 3 - attempts);
      return res.status(401).json({
        error: `Invalid credentials. ${attemptsRemaining} attempt(s) remaining before a 15-minute account lockout.`,
      });
    }

    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    // Block unapproved institutes
    if (user.role === 'institute' && user.institute) {
      if (user.institute.status === 'pending') {
        return res.status(403).json({ error: 'Your institute registration is pending admin approval.' });
      }
      if (user.institute.status === 'rejected') {
        return res.status(403).json({ error: 'Your institute registration was rejected by the admin.' });
      }
    }

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await user.update({ 
      refreshToken, 
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockUntil: null
    });

    res.json({ success: true, token, refreshToken, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin Military-Grade Login ────────────────────────────────────────
exports.adminLogin = async (req, res) => {
  try {
    const { email, password, sessionNonce, clientFingerprint, securityChallenge } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'UNKNOWN';
    const userAgent = req.headers['user-agent'] || 'UNKNOWN';
    const STAFF_ROLES = ['superadmin', 'admin', 'accountant', 'content_manager', 'teacher'];

    if (!email || !password) {
      return res.status(400).json({ error: 'Administrative identifier and passphrase are required.' });
    }

    const user = await User.findOne({
      where: { email },
      attributes: { include: ['password', 'refreshToken', 'failedLoginAttempts', 'lockUntil'] },
      include: [INST_INCLUDE],
    });

    // Forensic security logging
    console.log(`[MIL-SEC-AUDIT] Admin Login Attempt for: ${email} | IP: ${ip} | Fingerprint: ${clientFingerprint || 'N/A'} | Nonce: ${sessionNonce || 'N/A'}`);

    if (!user) {
      // Generic error response to block user enumeration attacks
      return res.status(401).json({ error: 'Authentication rejected: Invalid administrative credentials or clearance level.' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      console.warn(`[MIL-SEC-AUDIT] BLOCKED: Account ${email} is locked until ${user.lockUntil}`);
      return res.status(403).json({
        error: `Security Lockout Active: Account locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s). Forensic log ID: #LOG-${Date.now().toString(16).toUpperCase()}`
      });
    }

    // Verify passphrase
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates = { failedLoginAttempts: attempts };
      if (attempts >= 3) {
        updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        console.warn(`[MIL-SEC-AUDIT] LOCKOUT TRIGGERED for ${email} after 3 failed attempts.`);
      }
      await user.update(updates);

      const attemptsRemaining = Math.max(0, 3 - attempts);
      return res.status(401).json({
        error: attemptsRemaining > 0
          ? `Invalid passphrase. Security clearance rejected. ${attemptsRemaining} attempt(s) remaining before account lockout.`
          : 'Account locked for 15 minutes due to 3 consecutive failed attempts. Intrusion alert logged.'
      });
    }

    // Verify account active status
    if (!user.isActive) {
      console.warn(`[MIL-SEC-AUDIT] INACTIVE ACCOUNT LOGIN ATTEMPT: ${email}`);
      return res.status(403).json({ error: 'Access Denied: Administrative account has been revoked or deactivated.' });
    }

    // Role check: Strictly platform staff only
    if (!STAFF_ROLES.includes(user.role)) {
      console.warn(`[MIL-SEC-AUDIT] INSUFFICIENT CLEARANCE: ${email} with role ${user.role} attempted Admin Portal login.`);
      return res.status(403).json({
        error: 'Access Denied: Insufficient clearance level. This terminal is strictly isolated to platform administration personnel.'
      });
    }

    // Generate military-grade session tokens
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await user.update({
      refreshToken,
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    console.log(`[MIL-SEC-AUDIT] Clearance Authorized: ${email} (${user.role}) logged in successfully.`);

    res.json({
      success: true,
      token,
      refreshToken,
      user: user.toJSON(),
      clearanceLevel: 'LEVEL_5_MILITARY_GRADE',
      auditLogId: `AUDIT-0x${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      issuedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[MIL-SEC-AUDIT] Admin Login Error:', err);
    res.status(500).json({ error: 'Cryptographic gateway error: ' + err.message });
  }
};

// ─── Send OTP ────────────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { mobile, email } = req.body;
    if (!mobile && !email) return res.status(400).json({ error: 'Mobile or email required' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const where = mobile ? { mobile } : { email };
    let user = await User.findOne({ where });

    if (!user) {
      user = await User.create({ name: 'New User', mobile, email, otp, otpExpiry });
    } else {
      await user.update({ otp, otpExpiry, otpAttempts: 0 });
    }

    // Send OTP
    const message = `Your MockTest LMS OTP is: ${otp}. Valid for 10 minutes.`;
    if (mobile) {
      await sendSMS(mobile, message).catch(() => {});
    } else {
      await sendEmail(email, 'Your OTP', `<p>${message}</p>`).catch(() => {});
    }

    res.json({ success: true, message: `OTP sent to ${mobile || email}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Verify OTP ────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { mobile, email, otp, name } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required' });

    const where = mobile ? { mobile } : { email };
    const user = await User.findOne({ 
      where, 
      attributes: { include: ['otp', 'otpExpiry', 'otpAttempts'] },
      include: [INST_INCLUDE]
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.otpAttempts >= 5) return res.status(429).json({ error: 'Too many OTP attempts. Request a new OTP.' });
    if (!user.otp || user.otp !== otp) {
      await user.increment('otpAttempts');
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const updates = { otp: null, otpExpiry: null, otpAttempts: 0 };
    if (name && !user.name?.trim()) updates.name = name;
    if (mobile) updates.isMobileVerified = true;
    if (email) updates.isEmailVerified = true;
    await user.update(updates);

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await user.update({ refreshToken });

    res.json({ success: true, token, refreshToken, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Refresh Token ────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { include: ['refreshToken'] } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newToken = generateToken(user.id, user.role);
    res.json({ success: true, token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// ─── Forgot Password ────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    await user.update({
      resetPasswordToken: token,
      resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
    const primaryClientUrl = clientUrls[0].trim();
    const resetUrl = `${primaryClientUrl}/reset-password?token=${token}`;

    try {
      const { emailTemplates } = require('../utils/email.util');
      await sendEmail({
        to: email,
        subject: 'Reset Your Password - Abhyo',
        html: emailTemplates.forgotPasswordEmail({
          name: user.name,
          resetUrl,
          expiryMinutes: 60,
        }),
      });
    } catch (mailErr) {
      console.error('[Forgot Password Email Failed]:', mailErr.message);
    }

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Verify Reset Token ────────────────────────────────────────
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Reset token is required.' });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { [Op.gt]: new Date() },
      },
      attributes: ['id', 'name', 'email'],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Password reset link is invalid or has expired. Please request a new link.',
      });
    }

    // Mask email for privacy (e.g. j***@example.com)
    const emailParts = user.email ? user.email.split('@') : ['', ''];
    const maskedEmail = emailParts[0].length > 2
      ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
      : user.email;

    res.json({
      success: true,
      data: {
        name: user.name,
        email: maskedEmail,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Password Strength Validator
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*).';
  }
  const commonWeak = ['password', '12345678', 'qwerty123', 'admin123', 'abhyo123', 'password123'];
  if (commonWeak.includes(password.toLowerCase())) {
    return 'This password is too common and easily guessed. Please choose a stronger password.';
  }
  return null;
}

// ─── Reset Password ────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return res.status(400).json({ error: strengthError });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { [Op.gt]: new Date() },
      },
      attributes: { include: ['password'] },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Password reset link is invalid or has expired. Please request a new link.',
      });
    }

    // Security check: Prohibit reusing the exact same previous password
    if (user.password && (await user.comparePassword(password))) {
      return res.status(400).json({
        error: 'New password cannot be identical to your old password. Please choose a new, secure password.',
      });
    }

    // Update password, clear reset token, and reset lockout state
    await user.update({
      password,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    // Send confirmation email asynchronously
    if (user.email) {
      try {
        const { sendEmail, emailTemplates } = require('../utils/email.util');
        sendEmail({
          to: user.email,
          subject: 'Your Password Was Changed — Abhyo',
          html: emailTemplates.passwordChangedEmail({ name: user.name }),
        }).catch(e => console.error('[Password Changed Email non-fatal]:', e.message));
      } catch (mailErr) {
        console.error('[Password Changed Email Init non-fatal]:', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Me ────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [INST_INCLUDE],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Update Profile ────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, language, city, state } = req.body;

    // Sanitize: empty string → null for unique/enum fields
    const email = req.body.email?.trim() || null;
    const mobile = req.body.mobile?.trim() || null;
    const casteCategory = req.body.casteCategory?.trim() || null;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Pre-check email uniqueness (excluding self)
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: 'Email is already registered to another account' });
      }
    }

    // Pre-check mobile uniqueness (excluding self)
    if (mobile && mobile !== user.mobile) {
      const existing = await User.findOne({ where: { mobile } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: 'Mobile number is already registered to another account' });
      }
    }

    const updates = {
      ...(name && { name }),
      email,
      mobile,
      casteCategory,
      ...(language && { language }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(state !== undefined && { state: state?.trim() || null }),
    };

    if (req.file) {
      updates.avatar = req.file.filename;
    }

    await user.update(updates);
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error('[updateProfile]', err);
    if (err.original?.code === 'ER_DUP_ENTRY') {
      const field = err.original.sqlMessage?.includes('mobile') ? 'Mobile number' : 'Email';
      return res.status(400).json({ error: `${field} is already registered to another account` });
    }
    res.status(500).json({ error: err.message });
  }
};


// ─── Change Password ────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id, { attributes: { include: ['password'] } });

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      return res.status(400).json({ error: strengthError });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    await user.update({ password: newPassword });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
