import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const testSecret = 'test-only-secret-that-is-at-least-32-characters';
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === 'test' ? testSecret : '');
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || (nodeEnv === 'test' ? `${testSecret}-refresh` : '');
const placeholderSecret = /(?:generate[-_ ]?(?:a|an|another)|replace[-_ ]?me|change[-_ ]?me|changeme|example[-_ ]?secret)/i;

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  apiVersion: process.env.API_VERSION || '1',

  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis Configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT Configuration - Direct access for compatibility
  jwtSecret,
  jwtRefreshSecret,
  
  // JWT Configuration - Nested object for advanced usage
  jwt: {
    secret: jwtSecret,
    refreshSecret: jwtRefreshSecret,
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

  operations: {
    paymentProvider: process.env.PAYMENT_PROVIDER || 'disabled',
    offlineCashLimitCents: parseInt(process.env.OFFLINE_CASH_LIMIT_CENTS || '20000', 10),
    offlineMaxAgeMinutes: parseInt(process.env.OFFLINE_MAX_AGE_MINUTES || '1440', 10),
    cashVarianceApprovalCents: parseInt(process.env.CASH_VARIANCE_APPROVAL_CENTS || '500', 10),
    deviceCredentialHmacKey: process.env.DEVICE_CREDENTIAL_HMAC_KEY || (nodeEnv === 'test' ? `${testSecret}-device-hmac` : ''),
    giftCardHmacKey: process.env.GIFT_CARD_HMAC_KEY || (nodeEnv === 'test' ? `${testSecret}-gift-card-hmac` : ''),
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

if (jwtSecret.length < 32 || jwtRefreshSecret.length < 32 || jwtSecret === jwtRefreshSecret) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be distinct values of at least 32 characters');
}

if (nodeEnv !== 'test' && placeholderSecret.test(config.databaseUrl)) {
  throw new Error('DATABASE_URL contains an example placeholder');
}

if (!['disabled', 'simulator', 'stripe-terminal'].includes(config.operations.paymentProvider)) {
  throw new Error('PAYMENT_PROVIDER must be disabled, simulator, or stripe-terminal');
}
if (nodeEnv === 'production' && config.operations.paymentProvider === 'simulator') {
  throw new Error('PAYMENT_PROVIDER=simulator is prohibited in production');
}
if (nodeEnv !== 'test' && (config.operations.deviceCredentialHmacKey.length < 32 || config.operations.giftCardHmacKey.length < 32)) {
  throw new Error('DEVICE_CREDENTIAL_HMAC_KEY and GIFT_CARD_HMAC_KEY must be at least 32 characters');
}
if (nodeEnv !== 'test') {
  const operationalSecrets = [jwtSecret, jwtRefreshSecret, config.operations.deviceCredentialHmacKey, config.operations.giftCardHmacKey];
  if (operationalSecrets.some((secret) => placeholderSecret.test(secret))) {
    throw new Error('Runtime secrets must be generated values, not example placeholders');
  }
  if (new Set(operationalSecrets).size !== operationalSecrets.length) {
    throw new Error('JWT and operational HMAC secrets must all be distinct');
  }
}
