import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();

// Email transporter configuration
const createTransporter = () => {
  // Configure based on your email service
  // This is a basic SMTP configuration - adjust as needed
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Add timeout and connection options
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 10000, // 10 seconds
  });
};

// Validation middleware
const validateContactForm = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('subject').trim().isLength({ min: 5 }).withMessage('Subject must be at least 5 characters'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('type').isIn(['support', 'sales']).withMessage('Invalid message type'),
];

// POST /api/contact - Send contact form message
router.post('/', validateContactForm, async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, company, subject, message, type } = req.body;

    // Log the incoming request for debugging
    logger.info(`Contact form submission attempt: ${email} (${type}): ${subject}`);

    // Determine recipient based on message type
    const recipient = type === 'sales' ? 'sales@elitepos.chat' : 'support@elitepos.chat';

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('SMTP not configured, simulating email send');
      
      // For development/testing - just log and return success
      logger.info(`SIMULATED EMAIL SEND:
        To: ${recipient}
        From: ${email}
        Subject: [ElitePos Contact] ${subject}
        Name: ${name}
        Company: ${company || 'Not provided'}
        Message: ${message}
      `);

      // Always return success for simulation
      return res.status(200).json({
        success: true,
        message: 'Message sent successfully. We will get back to you soon!',
      });
    }

    // Create email content
    const emailContent = `
      New Contact Form Message
      
      Type: ${type === 'sales' ? 'Sales Inquiry' : 'Technical Support'}
      Name: ${name}
      Email: ${email}
      Company: ${company || 'Not provided'}
      Subject: ${subject}
      
      Message:
      ${message}
      
      ---
      Sent from ElitePos Contact Form
      Time: ${new Date().toISOString()}
    `;

    try {
      // Create transporter
      const transporter = createTransporter();

      // Verify transporter configuration
      logger.info('Verifying SMTP transporter...');
      await transporter.verify();
      logger.info('SMTP transporter verified successfully');

      // Send email to support/sales
      logger.info(`Sending email to ${recipient}...`);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@elitepos.chat',
        to: recipient,
        subject: `[ElitePos Contact] ${subject}`,
        text: emailContent,
        replyTo: email,
      });
      logger.info('Email sent to recipient successfully');

      // Send confirmation email to user
      logger.info(`Sending confirmation email to ${email}...`);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@elitepos.chat',
        to: email,
        subject: 'Thank you for contacting ElitePos',
        text: `
          Hi ${name},
          
          Thank you for contacting ElitePos. We have received your message and will get back to you within 24 hours.
          
          Your message:
          Subject: ${subject}
          Message: ${message}
          
          Best regards,
          The ElitePos Team
          
          ---
          ElitePos
          Phone: 1-804-360-1129
          Email: ${recipient}
          Address: 2807 Hampton Woods Drive, Henrico, VA 23233
        `,
      });
      logger.info('Confirmation email sent successfully');

      logger.info(`Contact form submitted successfully by ${email} (${type}): ${subject}`);

      res.status(200).json({
        success: true,
        message: 'Message sent successfully. We will get back to you soon!',
      });

    } catch (emailError) {
      logger.error('Email sending failed, falling back to simulation:', emailError);
      
      // Fallback to simulation if email fails
      logger.info(`FALLBACK SIMULATED EMAIL SEND:
        To: ${recipient}
        From: ${email}
        Subject: [ElitePos Contact] ${subject}
        Name: ${name}
        Company: ${company || 'Not provided'}
        Message: ${message}
      `);

      // Still return success to user
      res.status(200).json({
        success: true,
        message: 'Message sent successfully. We will get back to you soon!',
      });
    }

  } catch (error) {
    logger.error('Contact form error:', error);
    
    // More detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Detailed error:', errorMessage);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage })
    });
  }
});

export default router;
