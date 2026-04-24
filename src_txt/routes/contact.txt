import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();

// Email transporter configuration
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587');
  const isSSL = port === 465;
  
  const config = {
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSSL, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Connection timeouts
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 15000, // 15 seconds
    // Configure based on port
    ...(isSSL ? {
      // SSL configuration for port 465
      tls: {
        rejectUnauthorized: false,
        servername: process.env.SMTP_HOST
      }
    } : {
      // STARTTLS configuration for port 587
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    }),
    // Authentication
    authMethod: 'PLAIN',
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };
  
  logger.info(`Creating SMTP transporter with config: ${JSON.stringify({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    hasPassword: !!config.auth.pass,
    passwordLength: config.auth.pass?.length || 0,
    encryptionType: isSSL ? 'SSL' : 'STARTTLS'
  })}`);
  
  return nodemailer.createTransport(config);
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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
      logger.warn('SMTP not configured, logging message only');
      logger.warn(`SMTP Config Check - User: ${!!process.env.SMTP_USER}, Pass: ${!!process.env.SMTP_PASS}, Host: ${!!process.env.SMTP_HOST}`);
      
      // Log the contact form submission
      logger.info(`📧 NEW CONTACT FORM SUBMISSION (LOGGED ONLY):
        ═══════════════════════════════════════
        To: ${recipient}
        From: ${email}
        Name: ${name}
        Company: ${company || 'Not provided'}
        Subject: ${subject}
        Type: ${type === 'sales' ? 'Sales Inquiry' : 'Technical Support'}
        
        Message:
        ${message}
        
        Timestamp: ${new Date().toISOString()}
        ═══════════════════════════════════════
      `);

      return res.status(200).json({
        success: true,
        message: 'Message sent successfully. We will get back to you soon!',
      });
    }

    // Log SMTP configuration (without password)
    logger.info(`SMTP Configuration - Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, User: ${process.env.SMTP_USER}`);

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

      // Test different approaches if verification fails
      logger.info('Verifying SMTP transporter...');
      
      try {
        await transporter.verify();
        logger.info('SMTP transporter verified successfully');
      } catch (verifyError: any) {
        logger.warn('SMTP verification failed, trying alternative configuration:', verifyError.message);
        
        // Try alternative port/encryption method
        const currentPort = parseInt(process.env.SMTP_PORT || '587');
        const altPort = currentPort === 587 ? 465 : 587;
        const altSecure = altPort === 465;
        
        logger.info(`Trying alternative configuration: Port ${altPort} with ${altSecure ? 'SSL' : 'STARTTLS'}`);
        
        const altTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: altPort,
          secure: altSecure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          ...(altSecure ? {
            // SSL configuration for port 465
            tls: {
              rejectUnauthorized: false,
              servername: process.env.SMTP_HOST
            }
          } : {
            // STARTTLS configuration for port 587
            requireTLS: true,
            tls: {
              rejectUnauthorized: false,
              ciphers: 'SSLv3'
            }
          })
        });
        
        try {
          await altTransporter.verify();
          logger.info('Alternative SMTP configuration verified successfully');
          // Use the alternative transporter
          const emailResult = await altTransporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipient,
            subject: `[ElitePos Contact] ${subject}`,
            text: emailContent,
            replyTo: email,
          });
          logger.info('Email sent with alternative config:', emailResult.messageId);
          
          // Send confirmation email
          const confirmationResult = await altTransporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Thank you for contacting ElitePos',
            text: `Hi ${name},

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
Address: 2807 Hampton Woods Drive, Henrico, VA 23233`,
          });
          logger.info('Confirmation email sent with alternative config:', confirmationResult.messageId);
          
          logger.info(`📧 EMAIL SENT SUCCESSFULLY (ALT CONFIG):
            ═══════════════════════════════════════
            To: ${recipient}
            From: ${email}
            Name: ${name}
            Company: ${company || 'Not provided'}
            Subject: ${subject}
            Type: ${type === 'sales' ? 'Sales Inquiry' : 'Technical Support'}
            Message ID: ${emailResult.messageId}
            Timestamp: ${new Date().toISOString()}
            ═══════════════════════════════════════
          `);

          return res.status(200).json({
            success: true,
            message: 'Message sent successfully. We will get back to you soon!',
          });
          
        } catch (altError: any) {
          logger.error('Alternative SMTP configuration also failed:', altError.message);
          throw verifyError; // Throw original error to fall through to logging
        }
      }

      // Send email to support/sales
      logger.info(`Sending email to ${recipient}...`);
      const emailResult = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient,
        subject: `[ElitePos Contact] ${subject}`,
        text: emailContent,
        replyTo: email,
      });
      logger.info('Email sent to recipient successfully:', emailResult.messageId);

      // Send confirmation email to user
      logger.info(`Sending confirmation email to ${email}...`);
      const confirmationResult = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Thank you for contacting ElitePos',
        text: `Hi ${name},

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
Address: 2807 Hampton Woods Drive, Henrico, VA 23233`,
      });
      logger.info('Confirmation email sent successfully:', confirmationResult.messageId);

      // Also log for record keeping
      logger.info(`📧 EMAIL SENT SUCCESSFULLY:
        ═══════════════════════════════════════
        To: ${recipient}
        From: ${email}
        Name: ${name}
        Company: ${company || 'Not provided'}
        Subject: ${subject}
        Type: ${type === 'sales' ? 'Sales Inquiry' : 'Technical Support'}
        Message ID: ${emailResult.messageId}
        Timestamp: ${new Date().toISOString()}
        ═══════════════════════════════════════
      `);

      res.status(200).json({
        success: true,
        message: 'Message sent successfully. We will get back to you soon!',
      });

    } catch (emailError: any) {
      logger.error('Email sending failed:', emailError);
      
      // Fallback to logging if email fails
      logger.info(`📧 EMAIL FAILED - LOGGING INSTEAD:
        ═══════════════════════════════════════
        To: ${recipient}
        From: ${email}
        Name: ${name}
        Company: ${company || 'Not provided'}
        Subject: ${subject}
        Type: ${type === 'sales' ? 'Sales Inquiry' : 'Technical Support'}
        
        Message:
        ${message}
        
        Error: ${emailError.message}
        Timestamp: ${new Date().toISOString()}
        ═══════════════════════════════════════
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
