/**
 * Responsive, Modern HTML Email Templates for Abhyo LMS & Olympiad Platform
 */

const getPublicBaseUrl = () => {
  const clientUrl = (process.env.CLIENT_URL || 'https://abhyo.com').split(',')[0].trim();
  if (!clientUrl || clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1')) {
    return 'https://abhyo.com';
  }
  return clientUrl;
};

const getLogoUrl = () => `${getPublicBaseUrl()}/logo.png`;

const baseEmailWrapper = ({ title, preheader, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 24px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);
      padding: 30px 24px 26px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 6px 0 0 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .header .subtitle {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #e0e7ff;
    }
    .logo-container {
      display: inline-block;
      background: #ffffff;
      padding: 10px 22px;
      border-radius: 14px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
      margin-bottom: 12px;
    }
    .logo-img {
      height: 38px;
      width: auto;
      max-width: 170px;
      display: block;
      margin: 0 auto;
      object-fit: contain;
    }
    .body {
      padding: 32px 28px;
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
    }
    .cta-button {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      margin: 18px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .cta-button-success {
      background: #059669;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      margin: 18px 0;
    }
    .info-card table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-card td {
      padding: 6px 0;
      font-size: 13px;
      vertical-align: top;
    }
    .info-card .label {
      color: #64748b;
      width: 38%;
      font-weight: 500;
    }
    .info-card .value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 28px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <!-- Clean non-spam preheader -->
  <div style="display:none;max-height:0px;overflow:hidden;mso-hide:all;">
    ${preheader || title}
  </div>
  <div class="email-container">
    <div class="header">
      <div class="logo-container">
        <img src="${getLogoUrl()}" alt="Abhyo" class="logo-img" />
      </div>
      <h1>${title}</h1>
      <div class="subtitle">Mock Tests • Olympiads • Learning Management</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <div style="margin-bottom: 12px;">
        <img src="${getLogoUrl()}" alt="Abhyo" style="height: 22px; width: auto; opacity: 0.85; display: inline-block;" />
      </div>
      <p style="margin: 0 0 6px 0;">This email was sent from <strong>Abhyo Learning Platform</strong>.</p>
      <p style="margin: 0 0 6px 0;">Need assistance? Contact our support desk at <a href="mailto:support@abhyo.com">support@abhyo.com</a></p>
      <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 11px;">© ${new Date().getFullYear()} Abhyo. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── 1. Welcome & Registration Complete ─────────────────────────────────────
exports.welcomeEmail = ({ name, email, role = 'student', loginUrl = 'https://abhyo.com/login' }) => {
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Student';
  const targetLoginUrl = (!loginUrl || loginUrl.includes('localhost') || loginUrl.includes('127.0.0.1'))
    ? `${getPublicBaseUrl()}/login`
    : loginUrl;

  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Welcome to Abhyo, ${name}!</h2>
    <p>Your account has been successfully created and registered on <strong>Abhyo</strong>, India's examination and Olympiad preparation ecosystem.</p>
    
    <div class="info-card">
      <table>
        <tr>
          <td class="label">Full Name</td>
          <td class="value">${name}</td>
        </tr>
        <tr>
          <td class="label">Registered Email</td>
          <td class="value">${email}</td>
        </tr>
        <tr>
          <td class="label">Account Role</td>
          <td class="value">${roleDisplay}</td>
        </tr>
        <tr>
          <td class="label">Account Status</td>
          <td class="value" style="color: #059669; font-weight: 600;">Active & Ready</td>
        </tr>
      </table>
    </div>

    <p>You can now take full-length mock tests, enter national Olympiads, track your performance analytics, and access comprehensive study materials.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${targetLoginUrl}" class="cta-button">Sign In to Your Dashboard</a>
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
      If you need any assistance, reach out to our support team at <a href="mailto:support@abhyo.com">support@abhyo.com</a>.
    </p>
  `;

  return baseEmailWrapper({
    title: 'Welcome to Abhyo - Account Created',
    preheader: `Welcome to Abhyo, ${name}! Your account is active.`,
    content
  });
};

// ─── 2. Forgot Password / Reset Link ─────────────────────────────────────────
exports.forgotPasswordEmail = ({ name, resetUrl, expiryMinutes = 60 }) => {
  const safeResetUrl = (!resetUrl || resetUrl.includes('localhost') || resetUrl.includes('127.0.0.1'))
    ? (resetUrl ? resetUrl.replace(/http:\/\/localhost:\d+/i, 'https://abhyo.com').replace(/http:\/\/127\.0\.0\.1:\d+/i, 'https://abhyo.com') : `${getPublicBaseUrl()}/forgot-password`)
    : resetUrl;

  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Password Reset Request</h2>
    <p>Hello <strong>${name || 'User'}</strong>,</p>
    <p>We received an official request to reset the password for your Abhyo account. Click the button below to set a new password:</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${safeResetUrl}" class="cta-button" style="background: #4f46e5; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">Reset My Password</a>
    </div>

    <div class="info-card">
      <table>
        <tr>
          <td class="label">Link Validity</td>
          <td class="value">${expiryMinutes} Minutes</td>
        </tr>
        <tr>
          <td class="label">Security Advisory</td>
          <td class="value" style="color: #64748b; font-weight: normal;">Single-use cryptographic token</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      If the button above does not work, copy and paste this link into your web browser:<br>
      <a href="${safeResetUrl}" style="color: #4f46e5; word-break: break-all;">${safeResetUrl}</a>
    </p>

    <p style="font-size: 13px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 20px;">
      <strong>Security Warning:</strong> If you did not initiate this password reset, please ignore this email or reach out to support. Your existing password remains completely secure.
    </p>
  `;

  return baseEmailWrapper({
    title: 'Reset Your Password - Abhyo',
    preheader: 'Use this secure link to reset your Abhyo account password.',
    content
  });
};

// ─── 3. Olympiad Verification Status Update ──────────────────────────────────
exports.olympiadVerificationEmail = ({ name, olympiadTitle, status, remarks, actionUrl }) => {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#059669' : '#dc2626';
  const statusLabel = isApproved ? 'APPROVED & READY FOR PAYMENT' : 'ADDITIONAL VERIFICATION REQUIRED';

  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">
      ${isApproved ? '🎉 ID Verification Approved!' : '⚠️ ID Verification Status Update'}
    </h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your identity document submission for <strong>${olympiadTitle}</strong> has been reviewed by the administrative examination committee.</p>

    <div class="info-card">
      <table>
        <tr>
          <td class="label">Olympiad</td>
          <td class="value">${olympiadTitle}</td>
        </tr>
        <tr>
          <td class="label">Verification Result</td>
          <td class="value" style="color: ${statusColor};">${statusLabel}</td>
        </tr>
        ${remarks ? `
        <tr>
          <td class="label">Committee Remarks</td>
          <td class="value" style="color: #334155; font-weight: normal;">${remarks}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${isApproved ? `
      <p style="color: #059669; font-weight: 500;">
        Your identity verification is complete. The payment gateway is now unlocked for you to confirm your exam seat.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${actionUrl || 'https://abhyo.com/student/olympiad'}" class="cta-button cta-button-success">
          Complete Registration & Pay Now →
        </a>
      </div>
    ` : `
      <p style="color: #dc2626; font-weight: 500;">
        Please review the remarks above and upload a clearer document or corrected details through your portal.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${actionUrl || 'https://abhyo.com/student/olympiad'}" class="cta-button" style="background: #dc2626;">
          Re-submit ID Document →
        </a>
      </div>
    `}
  `;

  return baseEmailWrapper({
    title: isApproved ? 'Document Approved' : 'Verification Update',
    preheader: `Olympiad verification update for ${olympiadTitle}: ${status.toUpperCase()}`,
    content
  });
};

// ─── 4. Payment Confirmation / Receipt ───────────────────────────────────────
exports.paymentReceiptEmail = ({ name, itemTitle, amount, paymentId, orderId, date }) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Payment Successful! 💳</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Thank you for your payment. Your transaction has been securely processed and confirmed.</p>

    <div class="info-card">
      <table>
        <tr>
          <td class="label">Item / Service</td>
          <td class="value">${itemTitle}</td>
        </tr>
        <tr>
          <td class="label">Amount Paid</td>
          <td class="value" style="color: #059669; font-size: 16px;">₹${amount}</td>
        </tr>
        <tr>
          <td class="label">Payment ID</td>
          <td class="value" style="font-family: monospace;">${paymentId}</td>
        </tr>
        ${orderId ? `
        <tr>
          <td class="label">Order Reference</td>
          <td class="value" style="font-family: monospace;">${orderId}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="label">Date & Time</td>
          <td class="value">${date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
        </tr>
        <tr>
          <td class="label">Payment Status</td>
          <td class="value" style="color: #059669;">● Captured & Completed</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://abhyo.com/dashboard" class="cta-button">Go to My Dashboard →</a>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      Please preserve this email as your official digital receipt for future reference.
    </p>
  `;

  return baseEmailWrapper({
    title: 'Payment Receipt',
    preheader: `Payment confirmation of ₹${amount} for ${itemTitle}`,
    content
  });
};

// ─── 5. Admin SMTP Test Email ────────────────────────────────────────────────
exports.testEmail = ({ to, host, port, user, timestamp }) => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 42px;">🎉</span>
      <h2 style="margin: 10px 0 6px 0; color: #059669; font-size: 22px;">SMTP Mail System Is Active!</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        Your Abhyo mail server is successfully configured and sending live emails.
      </p>
    </div>

    <div class="info-card">
      <div style="font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
        Handshake Diagnostics
      </div>
      <table>
        <tr>
          <td class="label">SMTP Host</td>
          <td class="value">${host}</td>
        </tr>
        <tr>
          <td class="label">SMTP Port</td>
          <td class="value">${port}</td>
        </tr>
        <tr>
          <td class="label">Authenticated User</td>
          <td class="value">${user}</td>
        </tr>
        <tr>
          <td class="label">Recipient Test Address</td>
          <td class="value">${to}</td>
        </tr>
        <tr>
          <td class="label">Test Timestamp</td>
          <td class="value">${timestamp || new Date().toISOString()}</td>
        </tr>
        <tr>
          <td class="label">Connection Status</td>
          <td class="value" style="color: #059669;">● 250 OK - Message Handed Off</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #334155;">
      All automated notification triggers (student registrations, password resets, verification updates, and receipts) will now be transmitted reliably via this mail configuration.
    </p>
  `;

  return baseEmailWrapper({
    title: 'SMTP Mail Test - Abhyo',
    preheader: 'Your Abhyo SMTP mail server connection test was successful.',
    content
  });
};

// ─── 6. Password Changed Notification ─────────────────────────────────────────
exports.passwordChangedEmail = ({ name }) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Password Changed Successfully 🔒</h2>
    <p>Hello <strong>${name || 'User'}</strong>,</p>
    <p>The password for your Abhyo account was recently updated.</p>

    <div class="info-card">
      <table>
        <tr>
          <td class="label">Time of Change</td>
          <td class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
        </tr>
        <tr>
          <td class="label">Account Status</td>
          <td class="value" style="color: #059669;">● Protected & Active</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #334155;">
      If you made this change, you do not need to take any further action. You can sign in using your new password.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="https://abhyo.com/login" class="cta-button">Sign In to Abhyo →</a>
    </div>

    <p style="font-size: 13px; color: #dc2626; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 20px;">
      ⚠️ <strong>Didn't make this change?</strong> If you did not authorize this password update, please contact our support desk immediately at <a href="mailto:support@abhyo.com" style="color: #dc2626; font-weight: 600;">support@abhyo.com</a>.
    </p>
  `;

  return baseEmailWrapper({
    title: 'Password Changed - Abhyo',
    preheader: 'Your Abhyo account password was changed successfully.',
    content,
  });
};
