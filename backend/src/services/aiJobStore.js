// In-memory store for async AI generation jobs.
// Safe because pm2 runs the backend in fork mode (single process). If the app
// is ever moved to cluster mode, replace this with a shared store (Mongo/Redis).
import { randomUUID } from 'crypto';

const jobs = new Map();
const TTL_MS = 15 * 60 * 1000; // keep finished jobs around long enough to be polled

export function createJob() {
  const id = randomUUID();
  jobs.set(id, { status: 'pending', createdAt: Date.now() });
  return id;
}

export function setJobDone(id, data) {
  const j = jobs.get(id);
  if (j) { j.status = 'done'; j.data = data; j.finishedAt = Date.now(); }
}

export function setJobError(id, { code, message }) {
  const j = jobs.get(id);
  if (j) { j.status = 'error'; j.code = code; j.message = message; j.finishedAt = Date.now(); }
}

export function getJob(id) {
  return jobs.get(id);
}

// Periodic cleanup so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [id, j] of jobs) {
    const ref = j.finishedAt || j.createdAt;
    if (now - ref > TTL_MS) jobs.delete(id);
  }
}, 5 * 60 * 1000).unref();
