require('dotenv').config();
const SMSHandler = require('../sms-handler');
const EmailSender = require('../email-sender');
const { TableClient } = require('@azure/data-tables');

const smsHandler = new SMSHandler();
const emailSender = new EmailSender();

// Azure Table Storage for tracking processed messages
const tableClient = new TableClient(
    process.env.AZURE_STORAGE_CONNECTION_STRING,
    'ProcessedMessages'
);

async function isMessageProcessed(messageSid) {
    try {
        await tableClient.getEntity('sms', messageSid);
        return true;
    } catch (error) {
        if (error.code === 'ResourceNotFound') {
            return false;
        }
        console.error('Error checking processed message:', error);
        throw error;
    }
}

async function saveProcessedMessage(messageSid) {
    try {
        await tableClient.createEntity({
            partitionKey: 'sms',
            rowKey: messageSid,
            timestamp: new Date().toISOString()
        });
        console.log(`Message ${messageSid} saved to processed messages`);
    } catch (error) {
        console.error('Error saving processed message:', error);
        throw error;
    }
}

module.exports = async function (context, myTimer) {
    context.log('SMS Check Timer trigger function started at', new Date().toISOString());

    try {
        // Test email connection
        const emailConnected = await emailSender.testConnection();
        if (!emailConnected) {
            context.log.warn('Warning: Email connection failed');
        }

        // Fetch incoming SMS
        const messages = await smsHandler.fetchIncomingSMS();
        context.log(`Found ${messages.length} inbound messages`);

        let processedCount = 0;

        for (const message of messages) {
            try {
                // Check if already processed
                if (await isMessageProcessed(message.sid)) {
                    context.log(`Message ${message.sid} already processed, skipping`);
                    continue;
                }

                // Validate message
                if (!smsHandler.validateMessage(message)) {
                    context.log.warn(`Invalid message ${message.sid}, skipping`);
                    continue;
                }

                // Send email notification
                const timestamp = new Date(message.dateCreated).toLocaleString();
                await emailSender.sendSMSNotification(message.from, message.body, timestamp);
                
                // Mark as processed
                await saveProcessedMessage(message.sid);
                
                processedCount++;
                context.log(`Message ${message.sid} processed successfully`);
            } catch (error) {
                context.log.error(`Error processing message ${message.sid}:`, error);
                // Continue with next message even if one fails
            }
        }

        context.log(`SMS check completed. Processed ${processedCount} new messages`);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                messagesFound: messages.length,
                messagesProcessed: processedCount,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        context.log.error('Error in SMS check function:', error);
        
        context.res = {
            status: 500,
            body: {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
};
