require('dotenv').config();
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Path to store processed message IDs
const processedFile = path.join(__dirname, 'processed_messages.json');

function getProcessedMessages() {
    try {
        if (fs.existsSync(processedFile)) {
            const data = fs.readFileSync(processedFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading processed messages:', error);
    }
    return [];
}

function saveProcessedMessage(messageId) {
    try {
        const processed = getProcessedMessages();
        if (!processed.includes(messageId)) {
            processed.push(messageId);
            fs.writeFileSync(processedFile, JSON.stringify(processed, null, 2));
        }
    } catch (error) {
        console.error('Error saving processed message:', error);
    }
}

async function checkAndForwardSMS() {
    try {
        console.log('Starting SMS check...');
        const messages = await twilioClient.messages.list({ limit: 20 });
        const processedMessages = getProcessedMessages();
        for (const message of messages) {
            if (message.direction === 'inbound' && !processedMessages.includes(message.sid)) {
                console.log(`New SMS from ${message.from}: ${message.body}`);
                const mailOptions = {
                    from: process.env.EMAIL_FROM,
                    to: process.env.EMAIL_TO,
                    subject: `SMS from ${message.from}`,
                    html: `<h2>New SMS Message</h2><p><strong>From:</strong> ${message.from}</p><p><strong>To:</strong> ${message.to}</p><p><strong>Received:</strong> ${message.dateCreated}</p><hr><p><strong>Message:</strong></p><p>${message.body}</p>`
                };
                try {
                    const info = await emailTransporter.sendMail(mailOptions);
                    console.log(`Email sent with ID: ${info.messageId}`);
                    saveProcessedMessage(message.sid);
                } catch (emailError) {
                    console.error(`Failed to send email for SMS ${message.sid}:`, emailError);
                }
            }
        }
        console.log('SMS check completed');
    } catch (error) {
        console.error('Error checking SMS:', error);
        process.exit(1);
    }
}

checkAndForwardSMS();