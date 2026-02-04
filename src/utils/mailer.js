import nodemailer from 'nodemailer';

// Create verify transport
const createTransporter = () => {
    // For V0, we use SMTP (Gmail) as configured in .env
    // In production, you might switch to SendGrid/SES via MAIL_PROVIDER env
    
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const sendEmail = async ({ to, subject, html }) => {
    try {
        if (process.env.EMAIL_ENABLED !== 'true') {
            console.log('⚠️ Email is disabled. Logging instead:');
            console.log(`To: ${to}, Subject: ${subject}`);
            return;
        }

        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || '"UniToko" <noreply@unitoko.com>',
            to,
            subject,
            html,
        });

        console.log(`📧 Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Email failed:', error);
        // Don't crash the app, but maybe throw so the caller knows?
        // For OTP, it's critical.
        throw new Error('Failed to send email');
    }
};

export default {
    sendEmail
};
