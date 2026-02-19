class SmsHandler {
    constructor(twilioClient) {
        this.twilioClient = twilioClient;
    }
    async fetchMessages() {
        try {
            const messages = await this.twilioClient.messages.list();
            return messages;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }
    validateMessage(message) {
        // Example validation: check if the message has a body
        return message.body && message.body.trim().length > 0;
    }
    filterInboundMessages(messages) {
        return messages.filter(message => message.direction === 'inbound');
    }
    async handleMessages() {
        const messages = await this.fetchMessages();
        const validMessages = messages.filter(msg => this.validateMessage(msg));
        const inboundMessages = this.filterInboundMessages(validMessages);
        return inboundMessages;
    }
}

// Example usage:
// const twilioClient = require('twilio')(accountSid, authToken);
// const smsHandler = new SmsHandler(twilioClient);
// smsHandler.handleMessages().then(inboundMessages => console.log(inboundMessages));