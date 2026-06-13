import os from 'os';
import { notifyOwner } from './notify.service.js';

// Proactively warns the owner before the server runs out of disk or memory.
const DISK_WARN = 85;   // percent
const MEM_WARN = 92;    // percent
const CHECK_EVERY_MS = 15 * 60 * 1000; // every 15 minutes
const RE_ALERT_MS = 6 * 60 * 60 * 1000; // don't repeat the same alert more than once / 6h

const lastAlert = { disk: 0, mem: 0 };

async function diskPercent() {
  try {
    const { statfs } = await import('fs/promises');
    const s = await statfs('/');
    const total = s.blocks * s.bsize;
    const free = s.bavail * s.bsize;
    return Math.round(((total - free) / total) * 100);
  } catch { return null; }
}

async function check() {
  try {
    const now = Date.now();

    const memPct = Math.round((1 - os.freemem() / os.totalmem()) * 100);
    if (memPct >= MEM_WARN && now - lastAlert.mem > RE_ALERT_MS) {
      lastAlert.mem = now;
      notifyOwner({
        emoji: '🧠',
        title: 'Server memory high',
        fields: { Memory: `${memPct}% used`, Free: `${Math.round(os.freemem() / 1024 / 1024)} MB`, Action: 'Consider upgrading the server (more RAM)' },
      });
    }

    const diskPct = await diskPercent();
    if (diskPct != null && diskPct >= DISK_WARN && now - lastAlert.disk > RE_ALERT_MS) {
      lastAlert.disk = now;
      notifyOwner({
        emoji: '💾',
        title: 'Server disk filling up',
        fields: { Disk: `${diskPct}% full`, Risk: 'Server can crash if it hits 100%', Action: 'Clean old uploads/logs or upgrade storage' },
      });
    }
  } catch (err) {
    console.error('[healthMonitor]', err.message);
  }
}

export function startHealthMonitor() {
  // First check after 2 min (let the server settle), then on interval.
  setTimeout(check, 2 * 60 * 1000);
  setInterval(check, CHECK_EVERY_MS);
  console.log('[healthMonitor] started — disk/memory alerts active');
}
