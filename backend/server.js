import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { startRecurringJobs } from './src/services/recurring.service.js';
import { startOverdueCron } from './src/services/overdue.service.js';
import { startScheduler } from './src/services/scheduler.service.js';
import Role from './src/models/Role.js';

const PORT = process.env.PORT || 5000;

async function runMigrations() {
  try {
    // M001: Manager must be able to delete projects
    const m1 = await Role.updateMany(
      { level: 'manager', 'permissions.projects.delete': false },
      { $set: { 'permissions.projects.delete': true } }
    );
    if (m1.modifiedCount > 0) console.log(`[migration] M001: fixed ${m1.modifiedCount} Manager role(s) — projects.delete set to true`);

    // M002: Viewer must NOT see reports
    const m2 = await Role.updateMany(
      { level: 'viewer', 'permissions.reports.view': true },
      { $set: { 'permissions.reports.view': false, 'permissions.reports.export': false } }
    );
    if (m2.modifiedCount > 0) console.log(`[migration] M002: fixed ${m2.modifiedCount} Viewer role(s) — reports.view set to false`);
  } catch (e) {
    console.error('[migration] failed:', e.message);
  }
}

connectDB().then(async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Julay Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
  startRecurringJobs();
  startOverdueCron();
  startScheduler();
});
