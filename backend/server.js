import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { startRecurringJobs } from './src/services/recurring.service.js';
import { startOverdueCron } from './src/services/overdue.service.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Julay Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
  startRecurringJobs();
  startOverdueCron();
});
