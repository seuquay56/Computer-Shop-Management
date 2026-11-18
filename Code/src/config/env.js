const dotenv = require('dotenv');
dotenv.config({ quiet: true });

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters.');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  database: {
    host: required('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT || 5432),
    database: required('DB_NAME', 'computer_shop_db'),
    user: required('DB_USER', 'postgres'),
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  sepay: {
    bankAccount: (process.env.SEPAY_BANK_ACCOUNT || '0123456789').trim(),
    bankCode: (process.env.SEPAY_BANK_CODE || 'MBBank').trim(),
    accountName: (process.env.SEPAY_ACCOUNT_NAME || 'COMPUTER SHOP VN').trim(),
    qrTemplate: (process.env.SEPAY_QR_TEMPLATE || 'compact').trim(),
    webhookApiKey: (process.env.SEPAY_WEBHOOK_API_KEY || 'dev_sepay_webhook_api_key_2026').trim(),
    apiToken: (process.env.SEPAY_API_TOKEN || '').trim(),
    bankAccountId: (process.env.SEPAY_BANK_ACCOUNT_ID || '').trim(),
  },
  orderPrefix: (process.env.ORDER_PREFIX || 'CSORDER').trim().toUpperCase(),
  orderExpireMinutes: Math.max(5, Number(process.env.ORDER_EXPIRE_MINUTES || 30)),
  paymentCallbackSecret: (process.env.PAYMENT_CALLBACK_SECRET || jwtSecret).trim(),
  paymentDemoMode: process.env.PAYMENT_DEMO_MODE !== undefined
    ? process.env.PAYMENT_DEMO_MODE === 'true'
    : (process.env.NODE_ENV || 'development') !== 'production',
};
