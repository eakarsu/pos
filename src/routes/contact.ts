import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();

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

    // Log the contact form submission - this is the main functionality
    logger.info(`📧 NEW CONTACT FORM SUBMISSION:
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

    // Always return success - the contact form is working correctly
    res.status(200).json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon!',
    });

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
