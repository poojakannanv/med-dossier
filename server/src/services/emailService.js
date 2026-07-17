const nodemailer = require('nodemailer');

let transporter = null;

// SMTP is optional. If SMTP_HOST is not configured the app still works,
// email functions simply log and return without sending.
const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx) {
    console.log(`[email] SMTP not configured, skipping email to ${to} (${subject})`);
    return false;
  }
  try {
    await tx.sendMail({
      from: process.env.EMAIL_FROM || 'MedDossier <no-reply@meddossier.local>',
      to,
      subject,
      text,
      html,
    });
    console.log(`[email] sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`[email] failed to send to ${to}: ${err.message}`);
    return false;
  }
};

const sendWelcomeEmail = (user) =>
  sendMail({
    to: user.email,
    subject: 'Welcome to MedDossier',
    text: `Hello ${user.name},\n\nYour MedDossier account has been created with the role "${user.role}".\n\nYou can now log in and start managing regulatory submissions.\n\nMedDossier`,
    html: `<p>Hello ${user.name},</p><p>Your MedDossier account has been created with the role <strong>${user.role}</strong>.</p><p>You can now log in and start managing regulatory submissions.</p><p>MedDossier</p>`,
  });

const sendModuleAssignmentEmail = (user, submission, module, productName) =>
  sendMail({
    to: user.email,
    subject: `You have been assigned CTD module ${module.code}`,
    text: `Hello ${user.name},\n\nYou have been assigned as owner of CTD module ${module.code} (${module.title}) on the ${submission.regulatoryAuthority} submission for ${productName}.\n\nTarget date: ${new Date(submission.targetDate).toDateString()}\n\nMedDossier`,
    html: `<p>Hello ${user.name},</p><p>You have been assigned as owner of CTD module <strong>${module.code}</strong> (${module.title}) on the <strong>${submission.regulatoryAuthority}</strong> submission for <strong>${productName}</strong>.</p><p>Target date: ${new Date(submission.targetDate).toDateString()}</p><p>MedDossier</p>`,
  });

const sendDeadlineReminderEmail = (user, submission, productName, daysLeft) =>
  sendMail({
    to: user.email,
    subject: `Reminder: ${productName} submission due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    text: `Hello ${user.name},\n\nThe ${submission.regulatoryAuthority} ${submission.submissionType} submission for ${productName} has a target date of ${new Date(submission.targetDate).toDateString()}, which is ${daysLeft} day${daysLeft === 1 ? '' : 's'} away.\n\nPlease review your assigned modules.\n\nMedDossier`,
    html: `<p>Hello ${user.name},</p><p>The <strong>${submission.regulatoryAuthority}</strong> ${submission.submissionType} submission for <strong>${productName}</strong> has a target date of <strong>${new Date(submission.targetDate).toDateString()}</strong>, which is ${daysLeft} day${daysLeft === 1 ? '' : 's'} away.</p><p>Please review your assigned modules.</p><p>MedDossier</p>`,
  });

module.exports = {
  isConfigured,
  sendMail,
  sendWelcomeEmail,
  sendModuleAssignmentEmail,
  sendDeadlineReminderEmail,
};
