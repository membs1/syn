const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const config = require('./config.js');
const { replacePlaceholders, loadData } = require('./placeholders');

// User options
const contentChoice = 'html'; // 'html' or 'js'
const sendAttachment = config.enableAttachment; // Use config for send attachment
const rateLimit = 1; // Emails per second

// Main function to send emails with concurrency and rate limiting
async function sendEmails() {
  await loadData(); // Ensure data is loaded before proceeding

  try {
    const recipients = (await fs.readFile('list.txt', 'utf8')).trim().split('\n').map(email => email.trim());
    printHeader();
    let emailCount = 1;
    let successCount = 0;
    const testAfterSends = 100;
    const concurrency = 2; // Concurrency level for sending emails
    const testEmail = "debby@debbysrealty.com";

    // Function to send emails in batches with rate limiting
    async function sendEmailBatch(batch) {
      for (const recipient of batch) {
        if (!recipient) continue; // Skip empty email addresses
        const placeholders = {}; // Store placeholders for consistency within the same message
        const success = await sendIndividualEmail(recipient, contentChoice, sendAttachment, emailCount, placeholders);
        if (success) {
          console.log(`\x1b[32mEmail sent successfully to ${recipient}\x1b[0m`);
          successCount++;
        }
        if (successCount % testAfterSends === 0) {
          await sendTestEmail(testEmail, contentChoice, sendAttachment, emailCount, placeholders);
        }
        emailCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 / rateLimit)); // Rate limiting
      }
    }

    // Split recipients into batches and send them
    for (let i = 0; i < recipients.length; i += concurrency) {
      const batch = recipients.slice(i, i + concurrency);
      await sendEmailBatch(batch);
    }
  } catch (error) {
    console.error(`\x1b[31mError initializing email sending process: ${error}\x1b[0m`);
  }
}

// Function to send email to an individual recipient
async function sendIndividualEmail(recipient, contentChoice, sendAttachment, emailCount, placeholders) {
  const fromName = replacePlaceholders(`"${config.fromName}" <${config.fromEmail}>`, recipient, placeholders);
  const subject = replacePlaceholders(config.subject, recipient, placeholders);
  const html = replacePlaceholders(await fs.readFile('letter.html', 'utf8'), recipient, placeholders);
  const attachments = sendAttachment ? await prepareAttachments(recipient, placeholders) : [];

  const mailOptions = {
    from: fromName,
    to: recipient,
    subject: subject,
    html: html,
    attachments: attachments,
    headers: config.enableCustomHeaders ? config.customHeaders : {}
  };

  try {
    const emailTransporter = nodemailer.createTransport(config.smtp);
    await emailTransporter.sendMail(mailOptions);
    console.log(`\x1b[36m(${emailCount})-Email sent from ${mailOptions.from} to ${recipient}\x1b[0m`);
    return true; // Return true on success
  } catch (error) {
    console.error(`\x1b[31mFailed to send email to ${recipient}: ${error}\x1b[0m`);
    return false; // Return false on failure
  }
}

// Function to send a test email
async function sendTestEmail(testEmail, contentChoice, sendAttachment, emailCount, placeholders) {
  try {
    const fromName = replacePlaceholders(`"${config.fromName}" <${config.fromEmail}>`, testEmail, placeholders);
    const subject = replacePlaceholders(`Test Email (${emailCount}) to ${config.subject}`, testEmail, placeholders);
    const html = replacePlaceholders(await fs.readFile('letter.html', 'utf8'), testEmail, placeholders);
    const attachments = sendAttachment ? await prepareAttachments(testEmail, placeholders) : [];

    const mailOptions = {
      from: fromName,
      to: testEmail,
      subject: subject,
      html: html,
      attachments: attachments,
      headers: config.enableCustomHeaders ? config.customHeaders : {}
    };

    const emailTransporter = nodemailer.createTransport(config.smtp);
    await emailTransporter.sendMail(mailOptions);
    console.log(`\x1b[36mTest email sent to ${testEmail}\x1b[0m`);
    return true; // Return true on success
  } catch (error) {
    console.error(`\x1b[31mError sending test email to ${testEmail}: ${error}\x1b[0m`);
    return false; // Return false on failure
  }
}

// Function to prepare email attachments
async function prepareAttachments(recipient, placeholders) {
  const cids = config.cidMappings;
  const attachmentContent = await fs.readFile('attach.html', 'utf8');
  const attachments = [
    {
      filename: 'You Have a New Message In Teams.eml',
      content: replacePlaceholders(attachmentContent, recipient, placeholders),
      contentType: 'eml/eml'
    }
  ];

  for (const [cid, filePath] of Object.entries(cids)) {
    attachments.push({
      filename: filePath.split('/').pop(),
      path: filePath,
      cid: cid
    });
  }

  return attachments;
}

// Function to print a welcome header in the console
function printHeader() {
  console.log("\x1b[36m_________________________________________________________________________");
  console.log("|                                                                       |");
  console.log("|  Welcome to Email Sender                                              |");
  console.log("|_______________________________________________________________________|");
}

// Execute the sendEmails function
sendEmails().catch(console.error);
