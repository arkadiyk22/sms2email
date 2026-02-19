const twilio = require('twilio');

class SMSHandler {
    constructor() {
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }

    async fetchIncomingSMS() {
        try {
            const messages = await this.client.messages.list({
                to: process.env.TWILIO_PHONE_NUMBER,
                limit: 20
            });
            return messages;
        } catch (error) {
            console.error('Error fetching SMS messages:', error);
            throw error;
        }
    }

    validateMessage(message) {
        return message && message.sid && message.body && message.from;
    }
}

module.exports = SMSHandler;