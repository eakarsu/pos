import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || 'postgresql://pos_user:pos_password@localhost:5432/pos_system?schema=public',

  // Redis Configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',

  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // AWS S3 Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'pos-system-files',
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // Business Configuration
  business: {
    defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.08'),
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    name: process.env.BUSINESS_NAME || 'Your Business Name',
    address: process.env.BUSINESS_ADDRESS || '123 Main St, City, State 12345',
    phone: process.env.BUSINESS_PHONE || '+1-555-123-4567',
    email: process.env.BUSINESS_EMAIL || 'info@yourbusiness.com',
  },

  // Hardware Integration
  hardware: {
    enableBarcodeScanner: process.env.ENABLE_BARCODE_SCANNER === 'true',
    enableReceiptPrinter: process.env.ENABLE_RECEIPT_PRINTER === 'true',
    enableCashDrawer: process.env.ENABLE_CASH_DRAWER === 'true',
    printerIp: process.env.PRINTER_IP || '192.168.1.100',
    cashDrawerPort: process.env.CASH_DRAWER_PORT || 'COM1',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/pos-system.log',
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
