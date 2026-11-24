const nodemailer = require('nodemailer');
const emailTemplates = require('./emailTemplates');

/**
 * Build a Nodemailer Transporter with fallback to environment variables
 */
const getTransporter = (customConfig = null) => {
  const host = customConfig?.host || process.env.EMAIL_HOST;
  const rawPort = customConfig?.port || process.env.EMAIL_PORT;
  const port = parseInt(rawPort, 10) || 465;
  const secure = customConfig?.secure !== undefined
    ? (customConfig.secure === true || customConfig.secure === 'true')
    : (process.env.EMAIL_SECURE === 'true' || port === 465);
  const user = customConfig?.user || process.env.EMAIL_USER;
  const pass = customConfig?.pass || process.env.EMAIL_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      // Prevents rejection on self-signed or shared cPanel SNI certificates
      rejectUnauthorized: false,
    },
    connectionTimeout: 12000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
};

/**
 * Convert HTML to clean plain text without CSS code or scripts for multipart emails
 */
function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove <style> blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove <script> blocks
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '') // Remove <head> blocks
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '') // Remove remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&copy;/g, '©')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Send an email supporting both object syntax { to, subject, html, text } and positional syntax (to, subject, html, text)
 */
exports.sendEmail = async (optionsOrTo, maybeSubject, maybeHtml, maybeText) => {
  try {
    let to, subject, html, text, fromOverride, headersOverride;

    if (typeof optionsOrTo === 'object' && optionsOrTo !== null) {
      ({ to, subject, html, text, from: fromOverride, headers: headersOverride } = optionsOrTo);
    } else {
      to = optionsOrTo;
      subject = maybeSubject;
      html = maybeHtml;
      text = maybeText;
    }

    if (!to) {
      console.warn('[Email Warning] No recipient email specified in sendEmail call.');
      return;
    }

    // In dev mode without host, log and return
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
      console.log(`[Dev Email Simulation] To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true };
    }

    const transporter = getTransporter();
    const from = fromOverride || process.env.EMAIL_FROM || `Abhyo <${process.env.EMAIL_USER || 'info@abhyo.com'}>`;

    // Ensure clean human-readable plain text part (never raw CSS code)
    const cleanText = (text && text.trim().length > 0) ? text : htmlToPlainText(html);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: cleanText,
      headers: {
        'X-Mailer': 'Abhyo Mailer',
        'X-Priority': '3',
        'List-Unsubscribe': '<mailto:support@abhyo.com?subject=Unsubscribe>',
        ...(headersOverride || {}),
      },
    });

    console.log(`[Email Sent] MessageId: ${info.messageId} | Recipient: ${to} | Subject: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Failed] Error sending to ${typeof optionsOrTo === 'object' ? optionsOrTo?.to : optionsOrTo}:`, err.message);
    throw err;
  }
};

/**
 * Test SMTP configuration & send a diagnostic test email
 */
exports.testSmtpConnection = async (customConfig, testRecipient) => {
  const host = customConfig?.host || process.env.EMAIL_HOST;
  const rawPort = customConfig?.port || process.env.EMAIL_PORT;
  const port = parseInt(rawPort, 10) || 465;
  const user = customConfig?.user || process.env.EMAIL_USER;
  const pass = customConfig?.pass || process.env.EMAIL_PASS;
  const from = customConfig?.from || process.env.EMAIL_FROM || `Abhyo <${user}>`;
  const secure = customConfig?.secure !== undefined
    ? (customConfig.secure === true || customConfig.secure === 'true')
    : (process.env.EMAIL_SECURE === 'true' || port === 465);

  if (!host || !user || !pass) {
    return {
      success: false,
      error: 'Incomplete SMTP credentials. Host, Username, and Password are required for testing.',
      code: 'MISSING_CREDENTIALS',
    };
  }

  const recipient = testRecipient || user || 'info@abhyo.com';
  const transporter = getTransporter({ host, port, user, pass, secure });

  try {
    // Phase 1: Test Handshake / Authentication
    await transporter.verify();

    // Phase 2: Send Live Test Email
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html = emailTemplates.testEmail({
      to: recipient,
      host,
      port,
      user,
      timestamp,
    });

    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: '✅ Abhyo SMTP Connection Test — Mail System Active',
      html,
      text: `Abhyo SMTP Test Email: Connection to ${host}:${port} as ${user} succeeded at ${timestamp}.`,
    });

    return {
      success: true,
      message: `Test email successfully delivered to ${recipient}!`,
      details: {
        host,
        port,
        user,
        recipient,
        secure,
        messageId: info.messageId,
        timestamp,
      },
    };
  } catch (err) {
    console.error('[SMTP Test Error]', err);

    let friendlyError = err.message;
    if (err.code === 'EAUTH') {
      friendlyError = 'SMTP Authentication failed. The username or password was rejected by the mail server.';
    } else if (err.code === 'ECONNREFUSED') {
      friendlyError = `Connection refused by ${host} on port ${port}. Verify the hostname and port number.`;
    } else if (err.code === 'ETIMEDOUT') {
      friendlyError = `Connection to ${host}:${port} timed out. Verify your hosting firewall allows outgoing connections on port ${port}.`;
    } else if (err.code === 'ESOCKET') {
      friendlyError = `SSL/TLS Handshake failed on port ${port}. Toggle the "Use SSL/TLS (Secure)" setting.`;
    }

    return {
      success: false,
      error: friendlyError,
      code: err.code || 'SMTP_ERROR',
      originalError: err.message,
    };
  }
};

exports.getTransporter = getTransporter;
exports.emailTemplates = emailTemplates;
