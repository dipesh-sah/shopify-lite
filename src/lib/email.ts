import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass',
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.log('--- MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    console.log('------------------');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Shopify Lite Admin" <admin@shopifylite.com>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    // Fallback to console for dev
    console.log('--- FALLBACK MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    console.log('------------------');
  }
}

export async function send2FAEmail(to: string, code: string) {
  const subject = 'Your Admin Login Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Admin Login Verification</h2>
      <p>Please use the following code to complete your login:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="color: #000; letter-spacing: 5px; margin: 0;">${code}</h1>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this login, please contact support immediately.</p>
    </div>
  `;
  await sendEmail(to, subject, html);
}
