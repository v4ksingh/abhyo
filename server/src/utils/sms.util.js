// SMS utility - uses Twilio
exports.sendSMS = async (to, message) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS] To: ${to} | Message: ${message}`);
      return { success: true, sid: 'dev_mode' };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('SMS sending failed:', err.message);
    // Don't throw - we don't want SMS failure to block flow
    return { success: false, error: err.message };
  }
};
