import nodemailer from 'nodemailer';

// ── Central owner-alert system ───────────────────────────────────────────────
// Sends important site events to the owner via Telegram (instant) and email.
// All sends are fire-and-forget: failures never block or break the request.

const TG_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT  = process.env.TG_CHAT_ID;
const ALERT_EMAIL = process.env.OWNER_ALERT_EMAIL || 'admin@julay.org';

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch (err) {
    console.error('[notify:telegram]', err.message);
  }
}

async function sendEmail(subject, html) {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"Julay Alerts" <${process.env.SMTP_FROM || 'admin@julay.org'}>`,
      to: ALERT_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error('[notify:email]', err.message);
  }
}

/**
 * Notify the owner of a site event.
 * @param {Object} o
 * @param {string} o.emoji   - leading emoji, e.g. '💰'
 * @param {string} o.title   - short headline, e.g. 'New paid subscription'
 * @param {Object} [o.fields] - key/value details, e.g. { Plan: 'starter', Email: 'x@y.com' }
 */
export function notifyOwner({ emoji = '🔔', title, fields = {} }) {
  const time = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' });
  const rows = Object.entries(fields).filter(([, v]) => v != null && v !== '');

  // Telegram (plain-ish HTML)
  const tgLines = [`${emoji} <b>${title}</b>`, ...rows.map(([k, v]) => `<b>${k}:</b> ${escapeHtml(String(v))}`), `🕒 ${time}`];
  sendTelegram(tgLines.join('\n'));

  // Email
  const emailRows = rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748B;font-weight:600">${k}</td><td style="padding:4px 0;color:#0F172A">${escapeHtml(String(v))}</td></tr>`).join('');
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px">
      <h2 style="font-size:18px;color:#0F172A;margin:0 0 12px">${emoji} ${title}</h2>
      <table style="font-size:14px;border-collapse:collapse">${emailRows}</table>
      <p style="font-size:12px;color:#94A3B8;margin-top:16px">${time} · julay.org</p>
    </div>`;
  sendEmail(`${emoji} ${title}`, html);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default notifyOwner;
