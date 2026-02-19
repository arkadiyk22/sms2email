require('dotenv').config();
const express = require('express');
const SMSHandler = require('./sms-handler');
const EmailSender = require('./email-sender');
const { isMessageProcessed, saveProcessedMessage } = require('./utils');

const app = express();
const smsHandler = new SMSHandler();
const emailSender = new EmailSender();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/check-sms', async (req, res) => {
    try {
        console.log('Manual SMS check triggered');
        await runSMSCheck();
        res.json({ success: true, message: 'SMS check completed' });
    } catch (error) {
        console.error(`Error in manual check: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

async function runSMSCheck() {
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
                await emailSender.sendSMSNotification(message.from, message.body, timestamp);
                saveProcessedMessage(message.sid);
                processedCount++;
                console.log(`Successfully processed message from ${message.from}`);
            } catch (error) {
                console.error(`Error processing message ${message.sid}: ${error.message}`);
            }
        }
        console.log(`SMS check completed. Processed ${processedCount} new messages`);
        return { success: true, processedCount };
    } catch (error) {
        console.error(`Error in SMS check: ${error.message}`);
        throw error;
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, runSMSCheck };