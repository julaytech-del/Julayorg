import nodemailer from 'nodemailer';

const HEALTH_URL = 'https://julay.org/api/health';
const CHECK_INTERVAL_MS = 60 * 1000; // every 1 minute
const ALERT_AFTER_FAILURES = 2;      // alert after 2 consecutive failures
const ALERT_EMAIL = 'assimohammad489@gmail.com';

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

let failures = 0;
let alertSent = false;
let downSince = null;

async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(HEALTH_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);

    // Recovered
    if (failures >= ALERT_AFTER_FAILURES && alertSent) {
      const downFor = downSince ? Math.round((Date.now() - downSince) / 60000) : '?';
      await sendEmail(
        '✅ Julay.org is back online',
        `<p>The server has <strong>recovered</strong> and is responding normally.</p><p>Was down for approximately <strong>${downFor} minutes</strong>.</p>`
      );
      console.log(`[${now()}] ✅ Recovered after ${failures} failures`);
    }

    failures = 0;
    alertSent = false;
    downSince = null;
    console.log(`[${now()}] ✅ OK`);

  } catch (err) {
    failures++;
    if (!downSince) downSince = Date.now();
    console.log(`[${now()}] ❌ Failure #${failures}: ${err.message}`);

    if (failures >= ALERT_AFTER_FAILURES && !alertSent) {
      alertSent = true;
      const errorMsg = err.message;
      await sendEmail(
        '🚨 Julay.org is DOWN',
        `
        <div style="font-family:sans-serif;max-width:520px">
          <h2 style="color:#EF4444">🚨 Julay.org Server Alert</h2>
          <p>The server at <strong>${HEALTH_URL}</strong> has been unreachable for <strong>${failures}</strong> consecutive checks.</p>
          <p><strong>Error:</strong> ${errorMsg}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <hr/>
          <p style="color:#94A3B8;font-size:12px">SSH to server: ubuntu@julay.org<br/>Run: pm2 logs julay-backend --lines 50</p>
        </div>
        `
      );
    }
  }
}

async function sendEmail(subject, html) {
  try {
    await transporter.sendMail({
      from: `"Julay Monitor" <${SMTP.user}>`,
      to: ALERT_EMAIL,
      subject,
      html,
    });
    console.log(`[${now()}] 📧 Alert sent: ${subject}`);
  } catch (e) {
    console.error(`[${now()}] Failed to send email: ${e.message}`);
  }
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

console.log(`[${now()}] 🔍 Julay Monitor started — checking every ${CHECK_INTERVAL_MS / 1000}s`);
checkHealth();
setInterval(checkHealth, CHECK_INTERVAL_MS);
