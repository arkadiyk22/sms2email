const nodemailer = require('nodemailer');

class EmailSender {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: to,
                subject: subject,
                html: html
            });
            console.log(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async sendSMSNotification(fromPhone, messageBody, timestamp) {
        const html = `<h2>New SMS Message</h2><p><strong>From:</strong> ${fromPhone}</p><p><strong>Time:</strong> ${timestamp}</p><hr/><p><strong>Message:</strong></p><p>${messageBody}</p>`;
        return this.sendEmail(process.env.EMAIL_TO, `SMS from ${fromPhone}`, html);
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('Email connection verified');
            return true;
        } catch (error) {
            console.error('Email connection failed:', error);
            return false;
        }
    }
}

module.exports = EmailSender;