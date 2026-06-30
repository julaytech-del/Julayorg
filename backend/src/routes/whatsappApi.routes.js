import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Organization from '../models/Organization.js';

const router = Router();
router.use(protect);

const GRAPH = 'https://graph.facebook.com/v21.0';
const orgIdOf = (req) => req.user.organization?._id || req.user.organization;
const adminOnly = (req, res, next) => req.user?.isAdmin ? next() : res.status(403).json({ success: false, message: 'Admin only' });
const digits = (s) => String(s || '').replace(/[^\d]/g, '');

const getConfig = async (orgId) => {
  const org = await Organization.findById(orgId).select('integrations.whatsapp');
  return org?.integrations?.whatsapp || {};
};

// GET /api/whatsapp/config — connection status (never returns the token)
router.get('/config', async (req, res) => {
  try {
    const wa = await getConfig(orgIdOf(req));
    res.json({ success: true, data: { connected: !!(wa.phoneNumberId && wa.accessToken), phoneNumberId: wa.phoneNumberId || '', wabaId: wa.wabaId || '', connectedAt: wa.connectedAt || null } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/whatsapp/config — save credentials (admin)
router.post('/config', adminOnly, async (req, res) => {
  try {
    const { phoneNumberId, accessToken, wabaId } = req.body;
    if (!phoneNumberId || !accessToken) return res.status(400).json({ success: false, message: 'Phone Number ID and Access Token are required' });
    await Organization.findByIdAndUpdate(orgIdOf(req), {
      $set: {
        'integrations.whatsapp.phoneNumberId': String(phoneNumberId).trim(),
        'integrations.whatsapp.accessToken': String(accessToken).trim(),
        'integrations.whatsapp.wabaId': String(wabaId || '').trim(),
        'integrations.whatsapp.connectedAt': new Date(),
      },
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/whatsapp/config — disconnect (admin)
router.delete('/config', adminOnly, async (req, res) => {
  try {
    await Organization.findByIdAndUpdate(orgIdOf(req), { $unset: { 'integrations.whatsapp': '' } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/whatsapp/test — verify the credentials against Meta
router.post('/test', adminOnly, async (req, res) => {
  try {
    const wa = await getConfig(orgIdOf(req));
    if (!wa.phoneNumberId || !wa.accessToken) return res.status(400).json({ success: false, message: 'Not connected' });
    const r = await fetch(`${GRAPH}/${wa.phoneNumberId}?fields=display_phone_number,verified_name`, { headers: { Authorization: `Bearer ${wa.accessToken}` } });
    const data = await r.json();
    if (!r.ok) return res.status(400).json({ success: false, message: data?.error?.message || 'Verification failed' });
    res.json({ success: true, data: { displayPhone: data.display_phone_number, name: data.verified_name } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/whatsapp/templates — approved message templates
router.get('/templates', async (req, res) => {
  try {
    const wa = await getConfig(orgIdOf(req));
    if (!wa.accessToken || !wa.wabaId) return res.json({ success: true, data: [] });
    const r = await fetch(`${GRAPH}/${wa.wabaId}/message_templates?fields=name,language,status,category&limit=100`, { headers: { Authorization: `Bearer ${wa.accessToken}` } });
    const data = await r.json();
    if (!r.ok) return res.status(400).json({ success: false, message: data?.error?.message || 'Failed to load templates' });
    const approved = (data.data || []).filter(t => t.status === 'APPROVED').map(t => ({ name: t.name, language: t.language, category: t.category }));
    res.json({ success: true, data: approved });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/whatsapp/send — send to many numbers in one go.
// Body: { numbers:[], template:{name,language,variables:[]} }  OR  { numbers:[], text:"..." }
router.post('/send', async (req, res) => {
  try {
    const wa = await getConfig(orgIdOf(req));
    if (!wa.phoneNumberId || !wa.accessToken) return res.status(400).json({ success: false, message: 'WhatsApp API is not connected' });

    const numbers = [...new Set((Array.isArray(req.body.numbers) ? req.body.numbers : []).map(digits).filter(n => n.length >= 8))].slice(0, 1000);
    if (!numbers.length) return res.status(400).json({ success: false, message: 'No valid numbers' });

    const { template, text } = req.body;
    const buildBody = (to) => {
      if (template?.name) {
        const comp = (template.variables && template.variables.length)
          ? [{ type: 'body', parameters: template.variables.map(v => ({ type: 'text', text: String(v) })) }]
          : undefined;
        return { messaging_product: 'whatsapp', to, type: 'template', template: { name: template.name, language: { code: template.language || 'en_US' }, ...(comp ? { components: comp } : {}) } };
      }
      return { messaging_product: 'whatsapp', to, type: 'text', text: { body: String(text || '') } };
    };
    if (!template?.name && !String(text || '').trim()) return res.status(400).json({ success: false, message: 'Provide a template or message text' });

    const url = `${GRAPH}/${wa.phoneNumberId}/messages`;
    const headers = { Authorization: `Bearer ${wa.accessToken}`, 'Content-Type': 'application/json' };
    const results = [];
    for (const to of numbers) {
      try {
        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(buildBody(to)) });
        const d = await r.json();
        results.push({ to, ok: r.ok, id: d?.messages?.[0]?.id || null, error: r.ok ? null : (d?.error?.message || 'failed') });
      } catch (err) {
        results.push({ to, ok: false, error: err.message });
      }
    }
    const sent = results.filter(r => r.ok).length;
    res.json({ success: true, data: { sent, failed: results.length - sent, total: results.length, results } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
