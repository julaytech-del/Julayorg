import nodemailer from 'nodemailer';

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const FROM = `"Julay" <${process.env.SMTP_FROM || 'hello@julay.org'}>`;
const BASE_URL = process.env.FRONTEND_URL || 'https://julay.org';

const send = async (to, subject, html) => {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[Email]', err.message);
  }
};

const btn = (text, url) => `<a href="${url}" style="display:inline-block;background:#6366F1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">${text}</a>`;

export const sendTaskAssigned = async (toEmail, toName, task, projectName, assignerName) => {
  await send(toEmail, `New task assigned: ${task.title}`, `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#1E293B">
      <h2 style="color:#6366F1">You have a new task 📋</h2>
      <p>Hi ${toName}, <strong>${assignerName}</strong> assigned you a task in <strong>${projectName}</strong>.</p>
      <div style="background:#F8FAFC;border-left:4px solid #6366F1;padding:16px;border-radius:4px;margin:16px 0">
        <strong>${task.title}</strong><br>
        <span style="color:#64748B;font-size:14px">Priority: ${task.priority} · Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
      </div>
      ${btn('View Task', `${BASE_URL}/dashboard/projects`)}
    </div>
  `);
};

export const sendTaskOverdue = async (toEmail, toName, task, projectName) => {
  await send(toEmail, `⚠️ Overdue task: ${task.title}`, `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#1E293B">
      <h2 style="color:#EF4444">Task overdue ⚠️</h2>
      <p>Hi ${toName}, this task in <strong>${projectName}</strong> is past its due date.</p>
      <div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:16px;border-radius:4px;margin:16px 0">
        <strong>${task.title}</strong><br>
        <span style="color:#64748B;font-size:14px">Was due: ${new Date(task.dueDate).toLocaleDateString()}</span>
      </div>
      ${btn('Update Task', `${BASE_URL}/dashboard/projects`)}
    </div>
  `);
};

export const sendDueSoon = async (toEmail, toName, task, projectName) => {
  await send(toEmail, `🔔 Task due tomorrow: ${task.title}`, `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#1E293B">
      <h2 style="color:#F59E0B">Due tomorrow 🔔</h2>
      <p>Hi ${toName}, a task in <strong>${projectName}</strong> is due tomorrow.</p>
      <div style="background:#FFFBEB;border-left:4px solid #F59E0B;padding:16px;border-radius:4px;margin:16px 0">
        <strong>${task.title}</strong><br>
        <span style="color:#64748B;font-size:14px">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
      </div>
      ${btn('View Task', `${BASE_URL}/dashboard/projects`)}
    </div>
  `);
};

export const sendInvite = async (toEmail, inviterName, orgName, token) => {
  await send(toEmail, `You're invited to join ${orgName} on Julay`, `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#1E293B">
      <h2 style="color:#6366F1">You're invited! 🎉</h2>
      <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on Julay — the AI-powered work OS.</p>
      ${btn('Accept Invitation', `${BASE_URL}/accept-invite?token=${token}`)}
      <p style="color:#94A3B8;font-size:12px;margin-top:24px">This link expires in 7 days.</p>
    </div>
  `);
};

export const sendWelcome = async (toEmail, name) => {
  await send(toEmail, `Welcome to Julay, ${name}! 🎉`, `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#1E293B">
      <h2 style="color:#6366F1">Welcome to Julay! 🚀</h2>
      <p>Hi ${name}, your workspace is ready. Start by generating your first project with AI.</p>
      ${btn('Go to Dashboard', `${BASE_URL}/dashboard`)}
    </div>
  `);
};
