import crypto from 'crypto';
import Webhook from '../models/Webhook.js';

export async function triggerWebhooks(orgId, event, payload) {
  try {
    const webhooks = await Webhook.find({ organization: orgId, active: true, events: event });
    for (const webhook of webhooks) {
      const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
      const signature = webhook.secret
        ? crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
        : null;
      const start = Date.now();
      let statusCode = 0, success = false, response = '';
      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature ? { 'X-Julay-Signature': `sha256=${signature}` } : {}),
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
        statusCode = res.status;
        success = res.ok;
        response = await res.text().catch(() => '');
      } catch (err) {
        response = err.message;
      }
      webhook.deliveryLog.push({ event, statusCode, success, response: response.slice(0, 500), durationMs: Date.now() - start });
      if (webhook.deliveryLog.length > 50) webhook.deliveryLog = webhook.deliveryLog.slice(-50);
      webhook.lastTriggeredAt = new Date();
      await webhook.save();
    }
  } catch (err) {
    console.error('Webhook trigger failed:', err.message);
  }
}
