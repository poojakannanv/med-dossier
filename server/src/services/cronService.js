const cron = require('node-cron');
const Submission = require('../models/Submission');
const { sendDeadlineReminderEmail } = require('./emailService');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Finds every open submission whose target date falls within the next 7 days
 * and emails each distinct module owner one reminder per submission.
 * Exported separately so it can be tested or triggered manually.
 */
const runDeadlineReminders = async () => {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * MS_PER_DAY);

  const submissions = await Submission.find({
    targetDate: { $gte: now, $lte: inSevenDays },
    status: { $in: ['draft', 'in-review'] },
  })
    .populate('productId', 'productName')
    .populate('modules.owner', 'name email isActive');

  let emailsSent = 0;

  for (const submission of submissions) {
    const daysLeft = Math.max(1, Math.ceil((submission.targetDate - now) / MS_PER_DAY));
    const productName = submission.productId ? submission.productId.productName : 'Unknown product';

    // Distinct, active owners across all modules of this submission.
    const seen = new Set();
    for (const module of submission.modules) {
      const owner = module.owner;
      if (!owner || !owner.email || owner.isActive === false) continue;
      if (seen.has(String(owner._id))) continue;
      seen.add(String(owner._id));
      await sendDeadlineReminderEmail(owner, submission, productName, daysLeft);
      emailsSent += 1;
    }
  }

  console.log(`[cron] deadline reminders complete: ${submissions.length} submission(s) due within 7 days, ${emailsSent} email(s) sent`);
  return { submissions: submissions.length, emailsSent };
};

// Daily at 08:00 server time.
const startCronJobs = () => {
  cron.schedule('0 8 * * *', () => {
    runDeadlineReminders().catch((err) => console.error(`[cron] reminder job failed: ${err.message}`));
  });
  console.log('[cron] deadline reminder job scheduled for 08:00 daily');
};

module.exports = { startCronJobs, runDeadlineReminders };
