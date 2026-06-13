import Anthropic from '@anthropic-ai/sdk';
import { notifyOwner } from '../notify.service.js';

// Shared Anthropic client for all AI services.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

let lastCreditAlert = 0;

function isCreditError(err) {
  const status = err?.status;
  const msg = String(err?.error?.error?.message || err?.error?.message || err?.message || '').toLowerCase();
  // Anthropic returns 400 with a "credit balance is too low" message when funds run out;
  // 402/429 can also indicate billing/quota problems.
  return (status === 400 && (msg.includes('credit') || msg.includes('billing') || msg.includes('insufficient') || msg.includes('balance')))
    || status === 402;
}

/**
 * Wrapper around client.messages.create that alerts the owner (Telegram + email)
 * the moment Claude rejects a request because the API credit has run out.
 */
export async function createMessage(params) {
  try {
    return await client.messages.create(params);
  } catch (err) {
    if (isCreditError(err) && Date.now() - lastCreditAlert > 10 * 60 * 1000) {
      lastCreditAlert = Date.now();
      notifyOwner({
        emoji: '🔴',
        title: 'Claude API credit running out — recharge now!',
        fields: {
          Reason: err?.message || 'Insufficient credit balance',
          Action: 'Top up at console.anthropic.com → Billing',
          Impact: 'AI features are failing for users until recharged',
        },
      });
    }
    throw err;
  }
}

export default client;
