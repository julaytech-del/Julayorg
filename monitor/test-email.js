import nodemailer from 'nodemailer';

const SMTP = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || 'julaytech@gmail.com',
  pass: process.env.SMTP_PASS || 'nxdczdhcgyyabyid',
};

const transporter = nodemailer.createTransport({
  host: SMTP.host,
  port: SMTP.port,
  secure: false,
  auth: { user: SMTP.user, pass: SMTP.pass },
});

try {
  await transporter.sendMail({
    from: `"Julay Monitor" <${SMTP.user}>`,
    to: 'assimohammad489@gmail.com',
    subject: '✅ Julay Monitor — Email Test',
    html: `
      <div style="font-family:sans-serif;max-width:520px">
        <h2 style="color:#6366F1">✅ Monitor email test passed</h2>
        <p>This is a test email from the Julay uptime monitor.</p>
        <p>If you received this, the alert system is working correctly and will notify you if <strong>julay.org</strong> goes down.</p>
        <p style="color:#94A3B8;font-size:12px">Sent at: ${new Date().toISOString()}</p>
      </div>
    `,
  });
  console.log('✅ Test email sent successfully to assimohammad489@gmail.com');
} catch (e) {
  console.error('❌ Failed to send test email:', e.message);
  process.exit(1);
}
