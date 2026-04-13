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

export const sendContactEmail = async ({ name, email, subject, message }) => {
  const transporter = getTransporter();
  const subjectLabels = { general: 'General Inquiry', sales: 'Sales', support: 'Technical Support', privacy: 'Privacy / Data Request', bug: 'Bug Report' };
  const label = subjectLabels[subject] || subject;
  if (!transporter) {
    console.log(`[CONTACT] From: ${name} <${email}> | Subject: ${label}\n${message}`);
    return;
  }
  // Notify team
  await transporter.sendMail({
    from: `"Julay Contact" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_EMAIL || 'hello@julay.org',
    replyTo: email,
    subject: `[${label}] Contact from ${name}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#1E293B">New Contact Form Submission</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#64748B;width:100px">Name</td><td style="color:#1E293B;font-weight:600">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#64748B">Email</td><td><a href="mailto:${email}" style="color:#6366F1">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#64748B">Subject</td><td style="color:#1E293B">${label}</td></tr>
      </table>
      <div style="margin-top:16px;padding:16px;background:#F8FAFC;border-radius:8px;border-left:4px solid #6366F1">
        <p style="margin:0;color:#1E293B;white-space:pre-wrap">${message}</p>
      </div>
    </div>`,
  });
  // Auto-reply to sender
  await transporter.sendMail({
    from: `"Julay" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'We received your message — Julay',
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
      <h2 style="color:#0F172A;font-weight:800">Got your message, ${name}!</h2>
      <p style="color:#64748B">Thanks for reaching out. We've received your message about <strong>${label}</strong> and will get back to you within 24 hours.</p>
      <p style="color:#64748B">In the meantime, you can check our <a href="https://julay.org" style="color:#6366F1">homepage</a> or explore the app.</p>
      <p style="color:#94A3B8;font-size:13px;margin-top:32px">— The Julay Team</p>
    </div>`,
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
