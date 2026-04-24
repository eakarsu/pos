import nodemailer from 'nodemailer';
import { config } from '../config/environment';

const createTransporter = () => {
  const port = config.email.port;
  const isSSL = port === 465;

  return nodemailer.createTransport({
    host: config.email.host,
    port,
    secure: isSSL,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  // If SMTP not configured, log email instead
  if (!config.email.user || !config.email.pass || !config.email.host) {
    console.log(`[EMAIL - NOT SENT, SMTP not configured]`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text}`);
    return true;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.email.from || config.email.user,
      to,
      subject,
      text,
      html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send to ${to}:`, error);
    // Log the email content as fallback
    console.log(`[EMAIL FALLBACK]`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text}`);
    return false;
  }
}
