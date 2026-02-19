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

  async sendSmsAsEmail(smsData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: `SMS from ${smsData.from}`,
        html: `
          <h2>New SMS Message</h2>
          <p><strong>From:</strong> ${smsData.from}</p>
          <p><strong>Time:</strong> ${smsData.timestamp}</p>
          <p><strong>Message:</strong></p>
          <p>${smsData.body}</p>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailSender;