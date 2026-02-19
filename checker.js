require('dotenv').config();
const SMSHandler = require('./sms-handler');
const EmailSender = require('./email-sender');
const { isMessageProcessed, saveProcessedMessage } = require('./utils');

const smsHandler = new SMSHandler();
const emailSender = new EmailSender();

async function checkSMS() {
    try {
        console.log('Starting SMS check...');
        const emailConnected = await emailSender.testConnection();
        if (!emailConnected) {
            console.warn('Warning: Email connection failed');
        }

        const messages = await smsHandler.fetchIncomingSMS();
        console.log(`Found ${messages.length} inbound messages`);

        let processedCount = 0;

        for (const message of messages) {
            if (isMessageProcessed(message.sid)) {
                console.log(`Message ${message.sid} already processed, skipping`);
                continue;
            }

            if (!smsHandler.validateMessage(message)) {
                console.warn(`Invalid message ${message.sid}, skipping`);
                continue;
            }

            try {
                const timestamp = new Date(message.dateCreated).toLocaleString();
                await emailSender.sendSMSNotification(
                    message.from,
                    message.body,
                    timestamp
                );

                saveProcessedMessage(message.sid);
                processedCount++;
                console.log(`Successfully processed message from ${message.from}`);
            } catch (error) {
                console.error(`Error processing message ${message.sid}: ${error.message}`);
            }
        }

        console.log(`SMS check completed. Processed ${processedCount} new messages`);
    } catch (error) {
        console.error(`Error in SMS check: ${error.message}`);
        process.exit(1);
    }
}

checkSMS();
