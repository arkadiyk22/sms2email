const fs = require('fs');
const path = require('path');
const PROCESSED_FILE = path.join(__dirname, 'processed_messages.json');

function getProcessedMessages() {
    try {
        if (fs.existsSync(PROCESSED_FILE)) {
            const data = fs.readFileSync(PROCESSED_FILE, 'utf8');
            return JSON.parse(data) || [];
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
            fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2));
        }
    } catch (error) {
        console.error('Error saving processed message:', error);
    }
}

function isMessageProcessed(messageId) {
    const processed = getProcessedMessages();
    return processed.includes(messageId);
}

module.exports = { getProcessedMessages, saveProcessedMessage, isMessageProcessed };