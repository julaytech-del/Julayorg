import nodemailer from 'nodemailer';

const getTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

export const sendOTPEmail = async (to, code) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[OTP DEV] ${to} → ${code}`);
    return;
  }
  await transporter.sendMail({
    from: `"Julay" <${process.env.SMTP_USER}>`,
    to,
    subject: `${code} — Your Julay verification code`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#ffffff">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366F1,#8B5CF6);display:flex;align-items:center;justify-content:center">
            <span style="color:white;font-weight:800;font-size:18px">J</span>
          </div>
          <span style="font-weight:800;font-size:18px;color:#0F172A">Julay</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;color:#0F172A;font-weight:800">Your verification code</h2>
        <p style="margin:0 0 28px;color:#64748B;font-size:15px">Use this code to sign in to Julay. It expires in 10 minutes.</p>
        <div style="background:#F8FAFC;border:2px solid #E2E8F0;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#6366F1;font-family:monospace">${code}</span>
        </div>
        <p style="color:#94A3B8;font-size:13px;margin:0">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
};
