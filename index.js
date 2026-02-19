// index.js

// Main entry point for orchestrating SMS handling and email sending

const express = require('express');
const bodyParser = require('body-parser');
const { sendEmail } = require('./emailService');
const { handleSMS } = require('./smsService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Endpoint to handle incoming SMS
app.post('/sms', (req, res) => {
    const smsData = req.body;
    handleSMS(smsData);
    res.status(200).send('SMS received');
});

// Endpoint to send email
app.post('/send-email', (req, res) => {
    const emailData = req.body;
    sendEmail(emailData);
    res.status(200).send('Email sent');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
